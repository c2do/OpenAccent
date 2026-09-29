import type { Bundle, BundledEntry } from '../../src/core/bundle.js';
import { DialectSchema, EntrySchema } from '../../src/core/schema.js';

/** Deterministic pseudo-random numbers (mulberry32), so every run builds the same dictionary. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIALECTS = [
  { id: 'ar', script: 'arab' },
  { id: 'ar-ps', parent: 'ar', script: 'arab' },
  { id: 'ar-ps-fallahi', parent: 'ar-ps', script: 'arab', sound_rules: [['ك', 'ق']] },
  { id: 'ar-ps-fallahi-kaf', parent: 'ar-ps-fallahi', script: 'arab' },
  { id: 'ar-eg', parent: 'ar', script: 'arab' },
  { id: 'ar-sy', parent: 'ar', script: 'arab' },
  { id: 'en', script: 'latn' },
  { id: 'en-us-general', parent: 'en', script: 'latn' },
  { id: 'en-gb', parent: 'en', script: 'latn' },
  { id: 'es-mx', script: 'latn' },
  { id: 'fr-fr', script: 'latn' },
  { id: 'de-de', script: 'latn' },
  { id: 'tr-tr', script: 'latn' },
  { id: 'hi-in', script: 'deva' },
] as const;

const LETTERS: Record<string, string[]> = {
  arab: [...'ابتثجحخدذرزسشصضطظعغفقكلمنهوية'],
  latn: [...'abcdefghijklmnopqrstuvwxyzéñüöçş'],
  deva: ['क', 'ख', 'ग', 'म', 'न', 'र', 'ल', 'स', 'ह', 'का', 'की', 'कु', 'मे', 'नो'],
};

/** A dictionary with `size` entries spread over 14 dialects, for performance tests. */
export function syntheticBundle(size: number, seed = 1): Bundle {
  const rand = rng(seed);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  const word = (script: string, min = 3, max = 8) => {
    const n = min + Math.floor(rand() * (max - min + 1));
    return Array.from({ length: n }, () => pick(LETTERS[script]!)).join('');
  };
  const glossWords = Array.from({ length: 3000 }, () => word('latn', 3, 9).normalize('NFKD').replace(/\p{M}/gu, ''));
  const conceptIds = Array.from({ length: 110 }, (_, i) => `concept_${i}`);

  const entries: BundledEntry[] = [];
  const used = new Set<string>();
  for (let i = 0; entries.length < size; i++) {
    const d = pick(DIALECTS);
    const w = word(d.script);
    const id = `${d.id}/w${i}`;
    if (used.has(`${d.id}|${w}`)) continue;
    used.add(`${d.id}|${w}`);
    const gloss = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => pick(glossWords)).join(' ');
    entries.push({
      id,
      ...EntrySchema.parse({
        dialect: d.id,
        word: w,
        type: 'word',
        status: rand() < 0.1 ? 'verified' : 'draft',
        ...(rand() < 0.1 ? { verified_by: ['rev'] } : {}),
        spellings: rand() < 0.2 ? [word(d.script)] : [],
        romanized: d.script === 'arab' && rand() < 0.3 ? [word('latn')] : [],
        meanings: [{ en: gloss }],
        ...(rand() < 0.05 ? { concept: pick(conceptIds) } : {}),
        familiarity: pick(['common', 'common', 'common', 'regional', 'rare', 'dated'] as const),
        related: i > 0 && rand() < 0.05 ? [entries[Math.floor(rand() * entries.length)]?.id].filter(Boolean) : [],
        source: { kind: 'ai-draft' },
      }),
    });
  }
  return {
    formatVersion: 1,
    builtAt: '',
    guides: {},
    countries: [],
    samples: [],
    concepts: Object.fromEntries(conceptIds.map((c) => [c, { en: c.replace('_', ' '), ar: c, category: 'misc' }])),
    dialects: DIALECTS.map((d) =>
      DialectSchema.parse({ status: 'active', reviewers: ['rev'], name: { en: d.id }, ...d }),
    ) as Bundle['dialects'],
    entries,
  };
}
