/**
 * Search-key normalization. Both the dictionary and the query go through the same function,
 * so the output only has to be consistent, not pretty.
 */

// Harakat, Quranic annotation marks, and superscript alef.
const ARABIC_MARKS = /[ً-ٰٟۖ-ۭ]/g;
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

function normalizeArabic(text: string): string {
  const s = toAsciiDigits(text)
    .replace(ARABIC_MARKS, '')
    .replace(TATWEEL, '')
    .replace(ARABIC_LETTERS, (c) => ARABIC_LETTER_MAP[c] ?? c)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
  return collapse(s);
}

function normalizeLatin(text: string): string {
  const s = text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    // Keep apostrophes only inside words (y'all, ain't).
    .replace(/(^|[^\p{L}])'+|'+(?=[^\p{L}]|$)/gu, '$1')
    // Fold British spellings onto American ones: colour→color, realise→realize.
    .replace(/([a-z]{2,})our/g, '$1or')
    .replace(/([a-z]{3,})is(e|es|ed|ing|ation)\b/g, '$1iz$2');
  return collapse(s);
}

/** Normalize text for search. `script` is the dialect's ISO 15924 code (arab, latn, ...). */
export function normalize(text: string, script: string): string {
  switch (script) {
    case 'arab':
      return normalizeArabic(text);
    case 'latn':
      return normalizeLatin(text);
    default:
      return collapse(text.normalize('NFKC').toLowerCase());
  }
}
