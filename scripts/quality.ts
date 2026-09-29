/**
 * Data quality rules shared by the Wiktionary importer (what never gets imported) and the audit
 * (what gets flagged in data that is already there).
 */

import type { SensitiveLabel } from '../src/core/schema.js';

// Offensive, sexual and slur senses are imported like any other ("the language is the language"),
// but labelled, so OpenAccent never lets a model use them on its own. Tags come from Wiktionary;
// the gloss patterns catch senses it did not tag.
const TAG_LABELS: Record<string, SensitiveLabel> = {
  vulgar: 'vulgar',
  offensive: 'offensive',
  derogatory: 'offensive',
  pejorative: 'offensive',
  slur: 'slur',
  ethnic: 'slur',
  sexual: 'sexual',
  sexuality: 'sexual',
};
const GLOSS_LABELS: [SensitiveLabel, RegExp][] = [
  ['slur', /\b(slurs?|racist|nigg\w*|fag\w*|retard\w*|untouchables?)\b/i],
  ['offensive', /\b(offensive|derogatory|pejorative|insult\w*)\b/i],
  [
    'sexual',
    /\b(sex(ual(ly)?)?|intercourse|fuck\w*|cunt|penis|vagina|vulva|testic\w*|scrotum|masturbat\w*|orgasm|erection|semen|prostitut\w*|whores?|sluts?|rap(e|es|ed|ing|ist|ists)|p(a)?edophil\w*)\b/i,
  ],
  ['vulgar', /\b(shit\w*|piss\w*|arse|ass(hole)?|bastard|bitch\w*|damn|crap)\b/i],
];

/** Words that are only a clitic, however they are tagged. */
export const BARE_CLITICS = new Set(['ال', 'لل']);
// Grammar words: not what makes a dialect recognisable, unless they express a core concept.
export const FUNCTION_POS = new Set(['article', 'det', 'prep', 'postp', 'conj', 'particle', 'pron', 'contraction']);

/** The labels a sense needs, from its Wiktionary tags and its glosses. Empty for ordinary senses. */
export function sensitiveLabels(sense: { glosses?: string[]; tags?: string[] }): SensitiveLabel[] {
  const labels = new Set<SensitiveLabel>();
  for (const t of sense.tags ?? []) if (TAG_LABELS[t]) labels.add(TAG_LABELS[t]);
  for (const g of sense.glosses ?? []) for (const [label, re] of GLOSS_LABELS) if (re.test(g)) labels.add(label);
  return [...labels].sort();
}

/**
 * Letters in a word, ignoring harakat, accents and tatweel. Spacing vowel signs count as letters:
 * in Devanagari हाँ ("yes") and की are written with one consonant plus a vowel sign.
 */
export const letterCount = (word: string) => [...word].filter((c) => /[\p{L}\p{Mc}]/u.test(c) && c !== 'ـ').length;

