/**
 * Search-key normalization. Both the dictionary and the query go through the same function,
 * so the output only has to be consistent, not pretty.
 *
 * Rules stack from general to specific: the script's rules (Arabic, Latin, ...), then the
 * language's (en, tr, ...), then the dialect's (en-us, en-us-general, ...). A language rule
 * never leaks into another language: English spelling folds apply to English only, so French
 * "amour" stays "amour".
 *
 * Levels:
 *   exact     – Unicode NFC and whitespace cleanup only.
 *   canonical – the search key: case, accents that don't change the word, punctuation,
 *               spelling variants (colour/color, Straße/Strasse). The default.
 *   fuzzy     – canonical plus looser folds for typing without the right keyboard
 *               (año→ano, şık→sik) and stretched letters (heyyy, هلااا).
 */

export type NormalizeLevel = 'exact' | 'canonical' | 'fuzzy';

export interface NormalizeOptions {
  /** ISO 15924 code of the text's script: arab, latn, deva, ... */
  script: string;
  /** Dialect ID or language tag (en-us-general, fr, ar-ps), to add that language's and dialect's rules. */
  dialect?: string;
  level?: NormalizeLevel;
}

interface LanguageRules {
  /** Lowercase the way this language does (Turkish: I → ı, İ → i). */
  lower?: (s: string) => string;
  /** Letters whose marks make a different word; kept at the canonical level, folded at the fuzzy level. */
  keep?: string;
  /** Spelling variants folded onto one key. */
  canonical?: (s: string) => string;
  /** Extra folds at the fuzzy level only. */
  fuzzy?: (s: string) => string;
}

/** Keyed by language tag or dialect ID. Longer keys refine shorter ones (en → en-us → en-us-general). */
const RULES: Record<string, LanguageRules> = {
  en: {
    // Fold British spellings onto American ones: colour→color, realise→realize.
    // Lookbehinds instead of captures, so every occurrence folds in one pass and folding again changes nothing.
    canonical: (s) => s.replace(/(?<=[a-z]{2})our/g, 'or').replace(/(?<=[a-z]{3})is(?=(?:e|es|ed|ing|ation)\b)/g, 'iz'),
  },
  es: { keep: 'ñ' }, // año ≠ ano
  de: {
    keep: 'äöü', // schön ≠ schon
    canonical: (s) => s.replace(/ß/g, 'ss'),
  },
  tr: {
    lower: (s) => s.toLocaleLowerCase('tr'),
    keep: 'çğöşü', // şık ≠ sık
    fuzzy: (s) => s.replace(/ı/g, 'i'),
  },
};

/** The language of a dialect ID: "en-us-general" → "en". */
export const languageOf = (dialect: string) => dialect.split('-')[0]!.toLowerCase();

interface ResolvedRules {
  lower: (s: string) => string;
  keep: string;
  canonical: ((s: string) => string)[];
  fuzzy: ((s: string) => string)[];
}

const resolved = new Map<string, ResolvedRules>();

/** Rules for a dialect, general to specific: "en-us-general" gets en, then en-us, then en-us-general. */
function rulesFor(dialect: string | undefined): ResolvedRules {
  const key = dialect?.toLowerCase() ?? '';
  const cached = resolved.get(key);
  if (cached) return cached;
  const out: ResolvedRules = { lower: (s) => s.toLowerCase(), keep: '', canonical: [], fuzzy: [] };
  const parts = key ? key.split('-') : [];
  for (let i = 1; i <= parts.length; i++) {
    const r = RULES[parts.slice(0, i).join('-')];
    if (!r) continue;
    if (r.lower) out.lower = r.lower;
    if (r.keep) out.keep += r.keep;
    if (r.canonical) out.canonical.push(r.canonical);
    if (r.fuzzy) out.fuzzy.push(r.fuzzy);
  }
  resolved.set(key, out);
  return out;
}

// Harakat, Quranic annotation marks, and superscript alef.
const ARABIC_MARKS = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

const ARABIC_LETTER_MAP: Record<string, string> = {
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ٱ': 'ا',
  'ى': 'ي',
  'ی': 'ي', // Persian yeh
  'ة': 'ه',
  'ؤ': 'و',
  'ئ': 'ي',
  'ک': 'ك', // Persian kaf
};
const ARABIC_LETTERS = new RegExp(`[${Object.keys(ARABIC_LETTER_MAP).join('')}]`, 'g');

/** Arabic-Indic (U+0660–0669) and Extended Arabic-Indic (U+06F0–06F9) digits to ASCII. */
const toAsciiDigits = (s: string) =>
  s.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Stretched letters, as typed in chat: "heyyy" → "hey", "هلااا" → "هلا". Doubles are kept (hello, تمّ). */
const unstretch = (s: string) => s.replace(/(\p{L})\1{2,}/gu, '$1');

/** Drop combining marks (é → e), except on letters listed in `keep`. */
function stripMarks(s: string, keep: string): string {
  if (!keep) return s.normalize('NFKD').replace(/\p{M}/gu, '');
  return s.replace(/./gsu, (ch) => (keep.includes(ch) ? ch : ch.normalize('NFKD').replace(/\p{M}/gu, '')));
}

function normalizeArabic(text: string): string {
  return toAsciiDigits(text)
    .replace(ARABIC_MARKS, '')
    .replace(TATWEEL, '')
    .replace(ARABIC_LETTERS, (c) => ARABIC_LETTER_MAP[c] ?? c)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
}

const PLAIN_ASCII = /^[\x20-\x7e]*$/;

function normalizeLatin(text: string, rules: ResolvedRules, fuzzy: boolean): string {
  // Lowercase before decomposing, so Turkish İ becomes i and not ı.
  // Plain ASCII has nothing to compose or decompose (most English, and most queries).
  // Lowercase again after decomposing: compatibility forms decompose to capitals (ℙ → P, Ⅻ → XII).
  const lowered = PLAIN_ASCII.test(text)
    ? rules.lower(text)
    : rules.lower(stripMarks(rules.lower(text.normalize('NFC')), fuzzy ? '' : rules.keep));
  return lowered
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    // Keep apostrophes only inside words (y'all, ain't, aujourd'hui).
    .replace(/(?<!\p{L})'+|'+(?!\p{L})/gu, '');
}

/** Other scripts: case and punctuation only. Marks stay, because in Devanagari and others they are vowels. */
// NFKC again after lowercasing: lowercasing can leave marks out of canonical order (İ → i + U+0307).
const normalizeOther = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ');

/**
 * Normalize text for search. Pass the script alone (`'arab'`) for script rules only, or
 * `{ script, dialect }` to add the language's and dialect's rules.
 */
export function normalize(text: string, opts: string | NormalizeOptions): string {
  const { script, dialect, level = 'canonical' } = typeof opts === 'string' ? { script: opts } : opts;
  if (level === 'exact') return collapse(text.normalize('NFC'));
  const rules = rulesFor(dialect);
  const fuzzy = level === 'fuzzy';
  let s: string;
  switch (script) {
    case 'arab':
      s = normalizeArabic(text);
      break;
    case 'latn':
      s = normalizeLatin(text, rules, fuzzy);
      break;
    default:
      s = normalizeOther(text);
  }
  for (const fold of rules.canonical) s = fold(s);
  if (fuzzy) for (const fold of rules.fuzzy) s = fold(s);
  // Other scripts keep their marks, so a fold can leave a letter next to a mark it composes with (ß + ̧ → sş → sş).
  if (script !== 'arab' && script !== 'latn') s = s.normalize('NFKC');
  if (fuzzy) s = unstretch(s);
  return collapse(s);
}

/** A normalizer bound to one dialect, for normalizing many strings the same way. */
export function normalizerFor(dialect: { id: string; script: string }, level: NormalizeLevel = 'canonical') {
  const opts: NormalizeOptions = { script: dialect.script, dialect: dialect.id, level };
  return (text: string) => normalize(text, opts);
}
