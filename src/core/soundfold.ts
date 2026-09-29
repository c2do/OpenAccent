import { normalize } from './normalize.js';

/**
 * Sound rules are [spoken, written] pairs: how a dialect pronounces a letter vs how it is written.
 * Fallahi: [تش, ك] (كيف is said تشيف) and [ك, ق] (قال is said كال).
 *
 * Given something typed the way it sounds, this returns the possible written forms. Each rule is
 * applied once per position and never chained, so تشال does NOT become قال: the ك that comes
 * from ق is never pronounced تش.
 */
const MAX_OCCURRENCES = 4;

export function soundVariants(text: string, script: string, rules: [string, string][] | undefined): string[] {
  const base = normalize(text, script);
  if (!rules?.length) return [];
  const sorted = rules
    .map(([spoken, written]) => [normalize(spoken, script), normalize(written, script)] as const)
    .filter(([spoken]) => spoken.length > 0)
    .sort((a, b) => b[0].length - a[0].length);

  // Split the text into fixed pieces and replaceable spots (longest spoken pattern wins).
  const pieces: ({ fixed: string } | { spoken: string; written: string })[] = [];
  let i = 0;
  let fixed = '';
  let spots = 0;
  while (i < base.length) {
    const rule = spots < MAX_OCCURRENCES ? sorted.find(([spoken]) => base.startsWith(spoken, i)) : undefined;
    if (rule) {
      if (fixed) pieces.push({ fixed });
      fixed = '';
      pieces.push({ spoken: rule[0], written: rule[1] });
      i += rule[0].length;
      spots += 1;
    } else {
      fixed += base[i];
      i += 1;
    }
  }
  if (fixed) pieces.push({ fixed });

  let variants = [''];
  for (const p of pieces) {
    variants = 'fixed' in p ? variants.map((v) => v + p.fixed) : variants.flatMap((v) => [v + p.spoken, v + p.written]);
  }
  return [...new Set(variants)].filter((v) => v !== base);
}
