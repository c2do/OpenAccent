import fc from 'fast-check';

/** Runs per property. Raise it locally to search harder: FC_RUNS=5000 npx vitest run tests/property */
export const RUNS = Number(process.env.FC_RUNS ?? 300);

// Pieces that tend to break text code: combining marks, Arabic harakat and tatweel, letters whose
// case or decomposition is special, apostrophes, RTL/LTR marks, zero-width joiners, emoji with
// skin tones and ZWJ sequences, Arabic-Indic digits, Devanagari with virama, and lone surrogates.
const PIECES = [
  ...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'éèêëàâäôöûüùçñœæßİıIŞşĞğ',
  '́', '̈', '̧', '̇', // combining acute, diaeresis, cedilla, dot above
  ...'ابتثجحخدذرزسشصضطظعغفقكلمنهويةىأإآٱؤئءکی',
  'ً', 'ٌ', 'ٍ', 'َ', 'ُ', 'ِ', 'ّ', 'ْ', 'ٰ', 'ـ', // harakat, superscript alef, tatweel
  'our', 'ise', 'ation', 'ing', // English spelling folds
  'وبال', 'لل', 'ال', 'تش', 'چ', // clitics and sound-rule letters
  ...'٠١٢٣٤٥٦٧٨٩۰۱۲0123456789',
  "'", '’', 'ʼ', '`', '´', '-', '.', ',', '؟', '?', '!', '،', '«', '»', '(', ')', '\n', '\t', '  ',
  '‏', '‎', '‍', '‌', ' ', '﻿', // RLM, LRM, ZWJ, ZWNJ, NBSP, BOM
  'नमस्ते', 'क्', '्', 'ा', 'ि', '।', 'Привет', 'שלום', '你好', 'ﬁ', 'Ⅻ', '①',
  '😀', '👍🏽', '👨‍👩‍👧', '🇵🇸', '\ud83d', '\ude00', // emoji, ZWJ family, flag, lone surrogates
];

/** Messy multilingual text built from the pieces above, mixed with arbitrary UTF-16. */
export const messyText = fc.oneof(
  { weight: 4, arbitrary: fc.array(fc.constantFrom(...PIECES), { maxLength: 40 }).map((xs) => xs.join('')) },
  { weight: 1, arbitrary: fc.string({ unit: 'binary', maxLength: 40 }) },
  { weight: 1, arbitrary: fc.string({ unit: fc.integer({ min: 0, max: 0xffff }).map((c) => String.fromCharCode(c)), maxLength: 30 }) },
);

export const scripts = fc.constantFrom('arab', 'latn', 'deva', 'cyrl', 'zyyy');
export const dialects = fc.constantFrom(undefined, 'en', 'en-us-general', 'en-gb', 'fr-fr', 'es-mx', 'de-de', 'tr-tr', 'pt-br', 'ar-ps-fallahi', 'hi-in');
export const levels = fc.constantFrom('exact' as const, 'canonical' as const, 'fuzzy' as const);
