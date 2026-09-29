import { normalize } from './normalize.js';

/**
 * A search key that treats a dialect's sound variants as the same letter,
 * e.g. fallahi تشيف and كيف, or كال and قال. Rules come from the dialect's `sound_rules`.
 */
export function soundKey(text: string, script: string, rules: [string, string][] | undefined): string {
  let key = normalize(text, script);
  if (!rules?.length) return key;
  // Longest patterns first, so "تش" folds before any single-letter rule could touch it.
  const sorted = [...rules]
    .map(([from, to]) => [normalize(from, script), normalize(to, script)] as const)
    .filter(([from]) => from.length > 0)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) key = key.split(from).join(to);
  return key;
}
