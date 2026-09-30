/**
 * Imports dialect entries from Wiktionary, via wiktextract's per-language JSONL (kaikki.org).
 * Wiktionary is CC BY-SA 4.0, like OpenAccent's data. Every imported entry is a draft that cites
 * its Wiktionary page, and waits for a native reviewer.
 *
 * Usage (one pass over one kaikki language file serves every dialect that draws on it):
 *   tsx scripts/import-wiktextract.ts --language "Spanish" --input kaikki-Spanish.jsonl [--input -]
 *        [--freq es_50k.txt] [--limit 150] [--dialects es-mx,es-es] [--data data]
 *   tsx scripts/import-wiktextract.ts --plan [--dialects ...]   # prints languages, URLs and frequency lists as JSON
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { stringify } from 'yaml';
import { loadRawData } from '../src/core/data-loader.js';
import { normalize, type NormalizeOptions } from '../src/core/normalize.js';
import { BARE_CLITICS, FUNCTION_POS, letterCount, sensitiveLabels } from './quality.js';
import type { SensitiveLabel } from '../src/core/schema.js';
import { EntrySchema, type Entry } from '../src/core/schema.js';

export interface DialectImport {
  dialect: string;
  /** kaikki.org language names this dialect draws on. */
  languages: string[];
  /** Keep only senses tagged with one of these regions. Omit to keep every sense (dialect-specific files). */
  regionTags?: string[];
  /**
   * For a language's "default" variety (French of France, German of Germany), Wiktionary rarely tags
   * the region. With this set, everyday (colloquial/informal/slang) senses count too, unless they
   * are tagged with one of these other regions.
   */
  otherRegions?: string[];
  /** Senses tagged with any of these (sub-regions that have their own dialect folder) are left out. */
  excludeTags?: string[];
  /** Keep pronouns, particles and other function words (true for dialect-specific files like Egyptian Arabic). */
  keepFunctionWords?: boolean;
  /** FrequencyWords list code (content/<freqYear>/<code>/<code>_50k.txt), used to rank words. */
  freq?: string;
  /** FrequencyWords edition, when the 2018 one has no list for the language (Hindi). */
  freqYear?: number;
  /** Skip words borrowed from these languages (Wiktionary codes): American "gracias" is Spanish, not American English. */
  skipBorrowedFrom?: string[];
  /** Skip learned borrowings (tatsama) from these languages: Sanskrit words in Hindi are formal, not everyday speech. */
  skipLearnedFrom?: string[];
  script: string;
}

// Borrowings that English speakers use but that belong to another language's voice (Spanish "nada", Italian "capisce").
const EN_LOANS = ['es', 'it', 'fr', 'yi', 'chn', 'ja', 'haw', 'nv', 'la'];

export const WAVE_1: DialectImport[] = [
  { dialect: 'en-us-general', languages: ['English'], regionTags: ['US', 'North-America'], skipBorrowedFrom: EN_LOANS, excludeTags: ['Southern-US', 'New-England', 'New-York', 'New-York-City', 'African-American-Vernacular', 'AAVE', 'Appalachia', 'Midwest', 'Midwestern-US', 'Pennsylvania', 'Boston', 'California', 'Texas', 'Hawaii', 'Louisiana', 'Western-US'], freq: 'en', script: 'latn' },
  { dialect: 'en-gb', languages: ['English'], regionTags: ['UK', 'British'], skipBorrowedFrom: EN_LOANS, excludeTags: ['Scotland', 'Scottish', 'Northern-England', 'Yorkshire', 'Geordie', 'Cockney', 'West-Country', 'Ireland', 'Irish', 'Northern-Ireland', 'Wales', 'Welsh', 'Liverpool', 'Scouse', 'Manchester', 'Birmingham', 'Cornwall', 'Lancashire', 'East-Anglia', 'Northumbria', 'Newcastle'], freq: 'en', script: 'latn' },
  // Indian English keeps its Hindi and Urdu words (yaar, chai): they are what gives it away.
  { dialect: 'en-in', languages: ['English'], regionTags: ['India', 'Indian-English'], skipBorrowedFrom: ['es', 'it', 'fr'], freq: 'en', script: 'latn' },
  { dialect: 'es-mx', languages: ['Spanish'], regionTags: ['Mexico'], freq: 'es', script: 'latn' },
  { dialect: 'es-es', languages: ['Spanish'], regionTags: ['Spain'], freq: 'es', script: 'latn' },
  { dialect: 'pt-br', languages: ['Portuguese'], regionTags: ['Brazil'], freq: 'pt_br', script: 'latn' },
  {
    dialect: 'fr-fr',
    languages: ['French'],
    regionTags: ['France'],
    otherRegions: ['Quebec', 'Canada', 'Belgium', 'Switzerland', 'Africa', 'Louisiana', 'Acadia', 'Cajun', 'Haiti', 'Réunion', 'Ivory-Coast', 'Senegal', 'Cameroon', 'Congo', 'Morocco', 'Algeria', 'Tunisia', 'New-Caledonia'],
    freq: 'fr',
    script: 'latn',
  },
  {
    dialect: 'de-de',
    languages: ['German'],
    regionTags: ['Germany'],
    otherRegions: ['Austria', 'Switzerland', 'Swiss', 'South-Tyrol', 'Liechtenstein', 'Luxembourg', 'Namibia', 'Bavaria', 'Swabia'],
    // Regional German (Swabian "ha noi", Berlin "kieken") is not the German of Germany as a whole.
    excludeTags: ['Bavaria', 'Bavarian', 'Swabia', 'Swabian', 'Berlin', 'Northern-Germany', 'Southern-Germany', 'Low-German', 'Saxony', 'Saxon', 'Rhineland', 'Franconia', 'Franconian', 'Ruhr', 'Palatinate', 'Hesse', 'Westphalia', 'Austria', 'Switzerland', 'Swiss'],
    freq: 'de',
    script: 'latn',
  },
  { dialect: 'tr-tr', languages: ['Turkish'], freq: 'tr', script: 'latn' },
  { dialect: 'hi-in', languages: ['Hindi'], freq: 'hi', freqYear: 2016, skipLearnedFrom: ['sa'], script: 'deva' },
  { dialect: 'ar-eg', languages: ['Egyptian Arabic'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  // Wiktionary has no separate Najdi Arabic dictionary (kaikki returns 404).
  { dialect: 'ar-sa', languages: ['Hijazi Arabic', 'Gulf Arabic'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  // Wiktionary's North Levantine entries are mostly untagged: they go to the shared Levantine level
  // (inherited by Syrian and Lebanese), and the few tagged senses go to the country dialects.
  {
    dialect: 'ar-levantine',
    languages: ['North Levantine Arabic', 'South Levantine Arabic'],
    excludeTags: ['Syria', 'Syrian', 'Lebanon', 'Lebanese', 'Palestine', 'Palestinian', 'Jordan', 'Jordanian'],
    freq: 'ar',
    script: 'arab',
    keepFunctionWords: true,
  },
  { dialect: 'ar-sy', languages: ['North Levantine Arabic'], regionTags: ['Syria', 'Syrian'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  { dialect: 'ar-lb', languages: ['North Levantine Arabic'], regionTags: ['Lebanon', 'Lebanese'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  { dialect: 'ar-jo', languages: ['South Levantine Arabic', 'North Levantine Arabic'], regionTags: ['Jordan', 'Jordanian'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  { dialect: 'ar-ma', languages: ['Moroccan Arabic'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  { dialect: 'ar-dz', languages: ['Algerian Arabic'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  { dialect: 'ar-tn', languages: ['Tunisian Arabic'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  // Wiktionary has used both names for acm; a missing one is only a warning in the import workflow.
  { dialect: 'ar-iq', languages: ['Iraqi Arabic', 'Mesopotamian Arabic'], freq: 'ar', script: 'arab', keepFunctionWords: true },
  { dialect: 'ar-sd', languages: ['Sudanese Arabic'], freq: 'ar', script: 'arab', keepFunctionWords: true },
];

export const kaikkiUrl = (language: string) =>
  `https://kaikki.org/dictionary/${encodeURIComponent(language)}/kaikki.org-dictionary-${language.replace(/[^A-Za-z]/g, '')}.jsonl`;
export const frequencyUrl = (code: string, year = 2018) =>
  `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/${year}/${code}/${code}_50k.txt`;

// Parts of speech that are not dialect vocabulary.
const SKIP_POS = new Set(['name', 'character', 'symbol', 'prefix', 'suffix', 'infix', 'affix', 'letter', 'num', 'punct', 'romanization']);
// Senses tagged like this are everyday speech, which is what a dialect dictionary is for.
const EVERYDAY_TAGS = ['colloquial', 'informal', 'slang', 'familiar'];
// Senses we never import.
const SKIP_TAGS = new Set(['obsolete', 'archaic', 'historical', 'form-of', 'alt-of', 'misspelling', 'nonstandard-spelling', 'dialectal', 'rare-form', 'auxiliary', 'literary', 'poetic']);
// Senses from a trade or field ("car": a railway car, "long": a paper size, "leg": a paratrooper) are jargon, not the dialect.
const JARGON_TOPICS = new Set([
  'aviation', 'banking', 'botany', 'business', 'card-games', 'chemistry', 'chess', 'board-games', 'computing', 'engineering',
  'finance', 'gambling', 'geography', 'geology', 'law', 'mathematics', 'medicine', 'military', 'mining', 'nautical', 'paper',
  'physics', 'poker', 'printing', 'rail-transport', 'railways', 'sciences', 'stock-market', 'surveying', 'trading', 'zoology',
]);
// Wiktionary templates that mark a borrowing (args["2"] is the source language), and the learned (tatsama) kind.
const BORROWED = new Set(['bor', 'bor+', 'ubor', 'lbor', 'slbor', 'obor']);
const LEARNED = new Set(['lbor', 'slbor']);
// Glosses that describe grammar or spelling rather than a meaning.
const GRAMMAR_GLOSS =
  /^(used (to|before|after|as|in|with|for)\b|(alternative|obsolete|archaic|dated|nonstandard) (form|spelling)|(plural|form|spelling|clipping|ellipsis|contraction|abbreviation|initialism|acronym) of\b|misspelling|eye dialect|pronunciation spelling|the (name of the )?letter\b|a term of address for someone)/i;

interface Sense {
  glosses?: string[];
  tags?: string[];
  topics?: string[];
  form_of?: unknown;
  alt_of?: unknown;
  examples?: { text?: string; english?: string; translation?: string; type?: string }[];
}

interface KaikkiEntry {
  word: string;
  pos: string;
  lang?: string;
  senses?: Sense[];
  sounds?: { ipa?: string }[];
  forms?: { form: string; tags?: string[] }[];
  etymology_templates?: { name: string; args?: Record<string, string> }[];
}

interface Candidate {
  word: string;
  meanings: { en: string; examples: { text: string; en?: string }[]; sensitive: SensitiveLabel[]; concept?: string }[];
  tags: Set<string>;
  /** Tags of the ordinary (not sensitive) senses: they set the word's register. */
  ordinaryTags: Set<string>;
  allRare: boolean;
  allDated: boolean;
  ipa?: string;
  romanized: Set<string>;
  pos: Set<string>;
  /** At least one selected sense is tagged colloquial/informal/slang. */
  everyday: boolean;
  /** Core concept, if one of the meanings kept in the entry expresses it (see keptMeanings). */
  concept?: string;
  /** Every part of speech the word has in the language, including entries with no selected sense. */
  allPos: Set<string>;
  /**
   * A selected sense is the word's main (first) sense. When it isn't, the word's frequency belongs to
   * other meanings: "girl" is frequent, but not as slang for cocaine.
   */
  main: boolean;
}

const REGISTER_ORDER = ['vulgar', 'casual', 'formal'] as const;
const MAX_PER_CONCEPT = 3;
function registerFrom(tags: Set<string>): Entry['register'] {
  if (['vulgar', 'offensive', 'derogatory'].some((t) => tags.has(t))) return REGISTER_ORDER[0];
  if (['slang', 'colloquial', 'informal'].some((t) => tags.has(t))) return REGISTER_ORDER[1];
  if (tags.has('formal')) return REGISTER_ORDER[2];
  return 'neutral';
}

/** Normalized concept gloss part → concept id and category. */
export type ConceptIndex = Map<string, { id: string; category?: string }>;

// Which parts of speech can express a concept of each category. Without this, Arabic صام "to fast"
// was linked to fast (quick), علبة "can, tin" to can (be able) and بير "well" (water) to fine.
const CATEGORY_POS: Record<string, string[]> = {
  verbs: ['verb'],
  describing: ['adj', 'adv'],
  things: ['noun'],
  people: ['noun'],
  time: ['adv', 'noun', 'phrase', 'prep_phrase'],
  greetings: ['intj', 'phrase', 'adv', 'adj', 'particle'],
  expressions: ['intj', 'phrase', 'adv', 'adj', 'particle', 'verb', 'prep_phrase'],
  questions: ['pron', 'adv', 'det', 'intj', 'particle', 'phrase'],
  amounts: ['adv', 'adj', 'det', 'pron', 'num', 'phrase'],
};

const glossParts = (text: string) =>
  text
    .replace(/\([^)]*\)/g, ' ')
    .split(/[;,/]/)
    .map((p) => normalize(p, { script: 'latn', dialect: 'en' }).replace(/^(slang|informal|colloquial) for /, ''))
    .filter(Boolean);

/** Builds the lookup from data/concepts.yaml ({ id: { en, category } }). */
export function conceptIndex(concepts: Record<string, { en: string; category?: string }>): ConceptIndex {
  const index: ConceptIndex = new Map();
  for (const [id, c] of Object.entries(concepts)) {
    for (const part of glossParts(c.en)) if (!index.has(part)) index.set(part, { id, ...(c.category ? { category: c.category } : {}) });
  }
  return index;
}

/**
 * The core concept a sense expresses. Only the sense's main meaning counts: the first part of its
 * first gloss ("now; right now" → now, but "stove; (by extension) car" is not car), and the part of
 * speech must fit the concept's category. Mexican "lana" = "money" → money, American "bread" =
 * "Money." → money. (Matching English headwords instead links "can" to the modal verb when its
 * regional sense is slang for something else.)
 */
export function conceptFor(_word: string, sense: Sense, _cfg: DialectImport, concepts?: ConceptIndex, pos?: string): string | undefined {
  if (!concepts) return undefined;
  const first = sense.glosses?.[0];
  const main = first ? glossParts(first)[0] : undefined;
  if (!main) return undefined;
  // "to go" is the verb go; "a car" is the noun car. Other articles stay: "a lot" is its own concept.
  const keys = [main];
  if (pos === 'verb' || !pos) keys.push(main.replace(/^to /, ''));
  if (pos === 'noun' || !pos) keys.push(main.replace(/^(a|an|the) /, ''));
  for (const key of keys) {
    const hit = concepts.get(key);
    if (!hit) continue;
    const allowed = hit.category ? CATEGORY_POS[hit.category] : undefined;
    if (allowed && pos && !allowed.includes(pos)) continue;
    return hit.id;
  }
  return undefined;
}

/** Whether the word is borrowed from one of `languages`, by the templates in its etymology. */
export function borrowedFrom(entry: Pick<KaikkiEntry, 'etymology_templates'>, languages: string[] | undefined, learnedOnly = false): boolean {
  if (!languages?.length) return false;
  return (entry.etymology_templates ?? []).some(
    (t) => (learnedOnly ? LEARNED : BORROWED).has(t.name) && languages.includes(t.args?.['2'] ?? ''),
  );
}

/** The word's main sense: its first sense with a meaning. */
const mainSense = (entry: KaikkiEntry) => entry.senses?.find((s) => s.glosses?.length);

/** Selects the senses a dialect wants from one kaikki entry. */
export function selectSenses(entry: KaikkiEntry, cfg: DialectImport, concepts?: ConceptIndex): Sense[] {
  if (SKIP_POS.has(entry.pos)) return [];
  if (letterCount(entry.word) < 2 || BARE_CLITICS.has(entry.word)) return []; // letters and bare clitics (ب، ال)
  if (cfg.script === 'latn' && /^\p{Lu}/u.test(entry.word)) return []; // proper nouns
  if (borrowedFrom(entry, cfg.skipBorrowedFrom) || borrowedFrom(entry, cfg.skipLearnedFrom, true)) return [];
  const main = mainSense(entry);
  return (entry.senses ?? []).filter((s) => {
    const tags = s.tags ?? [];
    if (!s.glosses?.length || s.form_of || s.alt_of) return false;
    if (tags.some((t) => SKIP_TAGS.has(t) || cfg.excludeTags?.includes(t))) return false;
    if (s.topics?.some((t) => JARGON_TOPICS.has(t))) return false;
    if (s.glosses.every((g) => GRAMMAR_GLOSS.test(g.trim()))) return false;
    const concept = conceptFor(entry.word, s, cfg, concepts, entry.pos);
    if (FUNCTION_POS.has(entry.pos) && !cfg.keepFunctionWords && !concept) return false;
    if (!cfg.regionTags) return true;
    const everyday = tags.some((t) => EVERYDAY_TAGS.includes(t));
    if (tags.some((t) => cfg.regionTags!.includes(t))) {
      // A regionalism is a word whose main meaning is regional (lorry), or a regional everyday sense
      // (bread = money). A plain regional side sense of a common word ("school" as a fish school
      // term, "long" as a paper size) is not what the dialect sounds like.
      return s === main || everyday || Boolean(concept);
    }
    // Default variety: untagged-for-region everyday senses belong to it.
    return Boolean(cfg.otherRegions && everyday && !tags.some((t) => cfg.otherRegions!.includes(t)));
  });
}

const MAX_MEANINGS = 4;

/** The meanings an entry keeps: ordinary ones first, so a word's everyday sense is what readers see first. */
export function keptMeanings(c: Pick<Candidate, 'meanings'>): Candidate['meanings'] {
  return [...c.meanings].sort((a, b) => Number(a.sensitive.length > 0) - Number(b.sensitive.length > 0)).slice(0, MAX_MEANINGS);
}

/** Wiktionary sometimes stores notes like "ع (ʕa-) (alternative form)" as examples; keep real sentences only. */
export function isRealExample(text: string): boolean {
  if (/\((alternative|obsolete|dated|rare) form|\bform of\b/i.test(text)) return false;
  return text.trim().split(/\s+/).length >= 2;
}

/** Collects candidates per word from a stream of kaikki JSONL lines. */
export async function collect(lines: AsyncIterable<string> | Iterable<string>, cfgs: DialectImport[], concepts?: ConceptIndex) {
  const byDialect = new Map<string, Map<string, Candidate>>(cfgs.map((c) => [c.dialect, new Map()]));
  const posByDialect = new Map<string, Map<string, Set<string>>>(cfgs.map((c) => [c.dialect, new Map()]));
  for await (const line of lines) {
    if (!line.trim()) continue;
    let entry: KaikkiEntry;
    try {
      entry = JSON.parse(line) as KaikkiEntry;
    } catch {
      continue; // a truncated last line, for example
    }
    if (!entry.word) continue;
    for (const cfg of cfgs) {
      if (entry.lang && !cfg.languages.includes(entry.lang)) continue;
      const seen = posByDialect.get(cfg.dialect)!;
      if (!seen.has(entry.word)) seen.set(entry.word, new Set());
      seen.get(entry.word)!.add(entry.pos);
      const senses = selectSenses(entry, cfg, concepts);
      if (senses.length === 0) continue;
      const map = byDialect.get(cfg.dialect)!;
      const c: Candidate = map.get(entry.word) ?? {
        word: entry.word,
        meanings: [],
        tags: new Set(),
        ordinaryTags: new Set(),
        allRare: true,
        allDated: true,
        romanized: new Set(),
        pos: new Set(),
        everyday: false,
        allPos: seen.get(entry.word)!,
        main: false,
      };
      c.pos.add(entry.pos);
      c.ipa ??= entry.sounds?.find((s) => s.ipa)?.ipa;
      for (const f of entry.forms ?? []) if (f.tags?.includes('romanization')) c.romanized.add(f.form);
      if (senses.includes(mainSense(entry)!)) c.main = true;
      // Only the first ordinary sense may link a concept: बाल is "hair" first, so it is not the word for "child".
      const conceptSense = senses.find((s) => sensitiveLabels(s).length === 0);
      for (const s of senses) {
        const tags = s.tags ?? [];
        tags.forEach((t) => c.tags.add(t));
        if (!tags.includes('rare')) c.allRare = false;
        if (!tags.includes('dated')) c.allDated = false;
        if (tags.some((t) => EVERYDAY_TAGS.includes(t))) c.everyday = true;
        const sensitive = sensitiveLabels(s);
        if (sensitive.length === 0) tags.forEach((t) => c.ordinaryTags.add(t));
        // A vulgar or offensive sense never stands for a core concept: core words go into briefings.
        const concept = s === conceptSense ? conceptFor(entry.word, s, cfg, concepts, entry.pos) : undefined;
        const en = s.glosses!.join('; ');
        if (c.meanings.some((m) => m.en === en)) continue;
        // Only Wiktionary's own usage examples; quotations from books and papers are left out.
        const examples = (s.examples ?? [])
          .filter((e) => e.text && e.type !== 'quote' && e.text.length <= 200 && isRealExample(e.text))
          .slice(0, 2)
          .map((e) => ({ text: e.text!, ...((e.english ?? e.translation) ? { en: (e.english ?? e.translation)! } : {}) }));
        c.meanings.push({ en, examples, sensitive, ...(concept ? { concept } : {}) });
        // Only a meaning that ends up in the entry may link it to a concept (कार "tax; action; work"
        // must not become "car" through a fifth sense nobody will see).
        c.concept = keptMeanings(c).find((m) => m.concept)?.concept;
      }
      map.set(entry.word, c);
    }
  }
  return byDialect;
}

/** Word → rank (0 = most frequent) from a FrequencyWords list ("word count" per line). */
export function readFrequency(text: string, script: string | NormalizeOptions): Map<string, number> {
  const ranks = new Map<string, number>();
  text.split('\n').forEach((line, i) => {
    const word = line.split(' ')[0];
    if (word) {
      const key = normalize(word, script);
      if (!ranks.has(key)) ranks.set(key, i);
    }
  });
  return ranks;
}

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Turns ranked candidates into entries (and file slugs), skipping words the dialect already has. */
export function toEntries(
  candidates: Map<string, Candidate>,
  cfg: DialectImport,
  opts: { limit: number; ranks?: Map<string, number>; existingWords?: Set<string>; existingSlugs?: Set<string> },
): { slug: string; entry: Entry }[] {
  // Frequency of the word, with a boost for everyday senses: a common word whose regional sense is
  // obscure (e.g. Mexican "ante" = tapir) should not beat a slang word everyone uses there.
  const EVERYDAY_BOOST = 0.25;
  const rank = (w: string) => {
    const c = candidates.get(w);
    // Words for core concepts come first: they are what gives a dialect away.
    const conceptBonus = c?.concept ? -1e15 : 0;
    return conceptBonus + baseRank(w, c);
  };
  // Without a frequency (no list, or not in it): everyday senses first, then words with examples, then shorter words.
  const UNLISTED = 1e12;
  const heuristic = (w: string, c: Candidate | undefined) =>
    (c?.everyday ? 0 : 2_000) + (c?.meanings.some((m) => m.examples.length) ? 0 : 1_000) + w.length;
  const baseRank = (w: string, c: Candidate | undefined) => {
    if (!opts.ranks) return heuristic(w, c);
    // A word's frequency counts only for its main meaning (see Candidate.main).
    const listed = c?.main === false ? undefined : opts.ranks.get(normalize(w, cfg));
    if (listed === undefined) return UNLISTED + heuristic(w, c);
    return c?.everyday ? (listed + 1) * EVERYDAY_BOOST : listed + 1;
  };
  const existing = opts.existingWords ?? new Set<string>();
  const slugs = new Set(opts.existingSlugs ?? []);
  const sorted = [...candidates.values()]
    .filter((c) => !existing.has(normalize(c.word, cfg)))
    // A word that is also a grammar word (German "ab", "da", "zu") is mostly used as one.
    .filter((c) => cfg.keepFunctionWords || c.concept || ![...c.allPos].some((p) => FUNCTION_POS.has(p)))
    .sort((a, b) => rank(a.word) - rank(b.word) || a.word.localeCompare(b.word));

  // At most a few words per concept, so eight synonyms for "very" don't crowd out everything else.
  const perConcept = new Map<string, number>();
  const picked = sorted
    .filter((c) => {
      if (!c.concept) return true;
      const n = (perConcept.get(c.concept) ?? 0) + 1;
      perConcept.set(c.concept, n);
      return n <= MAX_PER_CONCEPT;
    })
    .slice(0, opts.limit);

  const out: { slug: string; entry: Entry }[] = [];
  for (const c of picked) {
    const romanized = [...c.romanized];
    let base = slugify(cfg.script === 'latn' ? c.word : (romanized[0] ?? '')) || `entry-${out.length + 1}`;
    let slug = base;
    for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
    slugs.add(slug);
    const language = cfg.languages[0]!;
    const entry = EntrySchema.parse({
      word: c.word,
      dialect: cfg.dialect,
      type: c.word.includes(' ') ? 'phrase' : 'word',
      romanized,
      ...(c.ipa ? { pronunciation: { ipa: c.ipa } } : {}),
      ...(c.pos.size === 1 ? { part_of_speech: [...c.pos][0] } : {}),
      meanings: keptMeanings(c).map((m) => ({ en: m.en, examples: m.examples, ...(m.sensitive.length ? { sensitive: m.sensitive } : {}) })),
      ...(c.concept ? { concept: c.concept } : {}),
      // A word with an everyday sense keeps that sense's register; only words that are vulgar in every sense are "vulgar".
      register: c.meanings.every((m) => m.sensitive.length > 0) ? 'vulgar' : registerFrom(c.ordinaryTags),
      familiarity: c.allDated ? 'dated' : c.allRare ? 'rare' : 'common',
      status: 'draft',
      source: {
        kind: 'dataset',
        name: 'wiktionary',
        ref: `https://en.wiktionary.org/wiki/${encodeURIComponent(c.word.replace(/ /g, '_'))}#${language.replace(/ /g, '_')}`,
        license: 'CC-BY-SA-4.0',
      },
      added_by: 'wiktionary-import',
    });
    out.push({ slug, entry });
  }
  return out;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const wanted = arg('dialects')?.split(',').map((s) => s.trim()).filter(Boolean);
  const cfgs = wanted ? WAVE_1.filter((c) => wanted.includes(c.dialect)) : WAVE_1;
  if (wanted && cfgs.length !== wanted.length) throw new Error(`Unknown dialect in --dialects ${wanted.join(',')}`);

  if (process.argv.includes('--plan')) {
    const languages = [...new Set(cfgs.flatMap((c) => c.languages))];
    console.log(
      JSON.stringify({
        languages: languages.map((l) => ({ language: l, url: kaikkiUrl(l), dialects: cfgs.filter((c) => c.languages.includes(l)).map((c) => c.dialect) })),
        frequency: [...new Map(cfgs.filter((c) => c.freq).map((c) => [c.freq!, frequencyUrl(c.freq!, c.freqYear)])).entries()].map(([code, url]) => ({ code, url })),
      }),
    );
    return;
  }

  const language = arg('language');
  const input = arg('input');
  if (!language || !input) throw new Error('--language and --input are required (or use --plan)');
  const dataRoot = arg('data') ?? 'data';
  const limit = Number(arg('limit') ?? 150);
  const freqDir = arg('freq-dir');
  const mine = cfgs.filter((c) => c.languages.includes(language));
  if (mine.length === 0) throw new Error(`No selected dialect draws on "${language}"`);

  const raw = loadRawData(dataRoot);
  const concepts = raw.concepts ? conceptIndex(raw.concepts as Record<string, { en: string; category?: string }>) : undefined;
  const stream = input === '-' ? process.stdin : createReadStream(input);
  const byDialect = await collect(createInterface({ input: stream, crlfDelay: Infinity }), mine, concepts);

  for (const cfg of mine) {
    const folder = raw.dialects.find((d) => d.folder === cfg.dialect);
    if (!folder) throw new Error(`No folder for dialect ${cfg.dialect}`);
    const dir = join(dataRoot, folder.file.replace(/\/dialect\.yaml$/, ''), 'entries');
    const own = raw.entries.filter((e) => e.folder === cfg.dialect);
    const existingWords = new Set(own.map((e) => normalize(String((e.data as { word?: string }).word ?? ''), cfg)));
    const freqFile = freqDir && cfg.freq ? join(freqDir, `${cfg.freq}_50k.txt`) : undefined;
    const ranks = freqFile && existsSync(freqFile) ? readFrequency(readFileSync(freqFile, 'utf8'), cfg) : undefined;
    // The limit is per dialect, across all its source languages and earlier runs.
    const alreadyImported = own.filter((e) => (e.data as { added_by?: string }).added_by === 'wiktionary-import').length;
    const entries = toEntries(byDialect.get(cfg.dialect)!, cfg, {
      limit: Math.max(0, limit - alreadyImported),
      ...(ranks ? { ranks } : {}),
      existingWords,
      existingSlugs: new Set(own.map((e) => e.slug)),
    });
    mkdirSync(dir, { recursive: true });
    // YAML 1.1 output quotes words like "no" and "yes", so every YAML reader keeps them as text.
    for (const { slug, entry } of entries) writeFileSync(join(dir, `${slug}.yaml`), stringify(entry, { version: '1.1' }));
    console.log(`${cfg.dialect}: ${byDialect.get(cfg.dialect)!.size} candidates, wrote ${entries.length} entries${ranks ? '' : ' (no frequency list)'}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  });
}
