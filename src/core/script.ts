/**
 * Which writing system a text is in, as a lowercase ISO 15924 code (arab, latn, deva, ...).
 * The script with the most letters wins; text with no letters is `zyyy` (undetermined).
 */

const SCRIPTS: [code: string, pattern: RegExp][] = [
  ['latn', /\p{Script=Latin}/u],
  ['arab', /\p{Script=Arabic}/u],
  ['deva', /\p{Script=Devanagari}/u],
  ['cyrl', /\p{Script=Cyrillic}/u],
  ['grek', /\p{Script=Greek}/u],
  ['hebr', /\p{Script=Hebrew}/u],
  ['hani', /\p{Script=Han}/u],
  ['hira', /\p{Script=Hiragana}/u],
  ['kana', /\p{Script=Katakana}/u],
  ['hang', /\p{Script=Hangul}/u],
  ['thai', /\p{Script=Thai}/u],
  ['beng', /\p{Script=Bengali}/u],
  ['guru', /\p{Script=Gurmukhi}/u],
  ['gujr', /\p{Script=Gujarati}/u],
  ['taml', /\p{Script=Tamil}/u],
  ['telu', /\p{Script=Telugu}/u],
  ['knda', /\p{Script=Kannada}/u],
  ['mlym', /\p{Script=Malayalam}/u],
  ['sinh', /\p{Script=Sinhala}/u],
  ['armn', /\p{Script=Armenian}/u],
  ['geor', /\p{Script=Georgian}/u],
  ['ethi', /\p{Script=Ethiopic}/u],
  ['khmr', /\p{Script=Khmer}/u],
  ['mymr', /\p{Script=Myanmar}/u],
  ['tibt', /\p{Script=Tibetan}/u],
];

export const UNDETERMINED_SCRIPT = 'zyyy';

export function detectScript(text: string): string {
  const counts = new Map<string, number>();
  for (const ch of text) {
    if (!/\p{L}/u.test(ch)) continue;
    const code = SCRIPTS.find(([, re]) => re.test(ch))?.[0] ?? 'zzzz';
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  let best = UNDETERMINED_SCRIPT;
  let max = 0;
  for (const [code, n] of counts) {
    if (n > max) [best, max] = [code, n];
  }
  return best;
}
