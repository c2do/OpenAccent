/**
 * Splits text into words with their positions, and offers conservative alternative readings
 * of a word with its clitics removed (وبالحاكورة → حاكورة, l'école → école).
 *
 * This is not a morphological analyzer. Readings are only candidates: the caller tries the
 * whole word first and falls back to a reading only when the dictionary knows it.
 *
 * Offsets are JavaScript string indexes (UTF-16 code units): `text.slice(start, end)` is the word.
 */

export interface Token {
  /** The word exactly as written. */
  surface: string;
  start: number;
  end: number;
}

export interface Reading {
  /** What to look up (may differ from the written letters: للبيت → البيت). */
  form: string;
  /** The part of the text this reading covers. */
  start: number;
  end: number;
}

// Letters, marks (harakat, Devanagari vowel signs) and digits, with apostrophes inside words (don't, j'aime).
const WORD = /[\p{L}\p{M}\p{N}]+(?:['’ʼ][\p{L}\p{M}\p{N}]+)*/gu;

export function tokenize(text: string): Token[] {
  return [...text.matchAll(WORD)].map((m) => ({ surface: m[0], start: m.index, end: m.index + m[0].length }));
}

const ARABIC_CONJUNCTIONS = ['', 'و', 'ف'];
const ARABIC_PREPOSITIONS = ['', 'ب', 'ل', 'ك'];
/** A stripped word must keep at least this many letters, so short words are left alone. */
const MIN_STEM_LETTERS = 2;
const MIN_FORM_LETTERS = 3;

/** Base letters of an Arabic word with their positions, skipping harakat and tatweel. */
function arabicLetters(surface: string): { ch: string; index: number }[] {
  const out: { ch: string; index: number }[] = [];
  for (let i = 0; i < surface.length; i++) {
    const ch = surface[i]!;
    if (/\p{M}/u.test(ch) || ch === 'ـ') continue;
    out.push({ ch, index: i });
  }
  return out;
}

/**
 * Arabic proclitics: an optional conjunction (و ف), an optional preposition (ب ل ك) and an
 * optional article (ال), in that order. ل + ال is written لل (للبيت).
 */
function arabicReadings(token: Token): Reading[] {
  const letters = arabicLetters(token.surface);
  const word = letters.map((l) => l.ch).join('');
  const out: { stripped: number; reading: Reading }[] = [];
  const add = (stripped: number, formPrefix = '') => {
    const rest = letters.slice(stripped);
    if (rest.length < MIN_STEM_LETTERS || formPrefix.length + rest.length < MIN_FORM_LETTERS) return;
    const form = formPrefix + token.surface.slice(rest[0]!.index);
    out.push({ stripped, reading: { form, start: token.start + rest[0]!.index, end: token.end } });
  };
  for (const conj of ARABIC_CONJUNCTIONS) {
    for (const prep of ARABIC_PREPOSITIONS) {
      const head = conj + prep;
      if (!word.startsWith(head)) continue;
      const rest = word.slice(head.length);
      if (head) add(head.length); // والحاكورة → الحاكورة
      if (prep === 'ل' && rest.startsWith('ل')) {
        // للبيت = ل + البيت
        add(head.length, 'ا');
        add(head.length + 1);
      } else if (rest.startsWith('ال')) {
        add(head.length + 2); // بالحاكورة → حاكورة
      }
    }
  }
  const seen = new Set<string>();
  return out
    .sort((a, b) => a.stripped - b.stripped)
    .map((o) => o.reading)
    .filter((r) => !seen.has(r.form) && seen.add(r.form));
}

const FRENCH_ELISION = /^(?:qu|jusqu|lorsqu|puisqu|[cdjlmnst])['’ʼ](?=\p{L})/iu;
const ENGLISH_POSSESSIVE = /['’ʼ]s$/i;

function latinReadings(token: Token, language: string): Reading[] {
  if (language === 'fr') {
    const m = FRENCH_ELISION.exec(token.surface);
    if (m) return [{ form: token.surface.slice(m[0].length), start: token.start + m[0].length, end: token.end }];
  }
  if (language === 'en' && ENGLISH_POSSESSIVE.test(token.surface) && token.surface.length > 3) {
    return [{ form: token.surface.slice(0, -2), start: token.start, end: token.end - 2 }];
  }
  return [];
}

/**
 * Other ways to read a word with its clitics removed, least stripped first.
 * `language` is the dialect's language ("ar", "fr", "en", ...).
 */
export function readings(token: Token, script: string, language: string): Reading[] {
  if (script === 'arab') return arabicReadings(token);
  if (script === 'latn') return latinReadings(token, language);
  return [];
}
