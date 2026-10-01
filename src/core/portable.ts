import { confidenceOf } from './confidence.js';
import type { Dictionary } from './dictionary.js';
import { mergedGuide } from './guides.js';
import { displayName } from './names.js';
import type { Memory } from './schema.js';

/**
 * A short, self-contained instruction a user can paste into any AI's custom instructions
 * (Claude preferences, ChatGPT custom instructions, ...): no install, works on mobile.
 * It is built in priority order and trimmed to fit `maxChars` (ChatGPT allows 1500 per field).
 */
export interface PortableOptions {
  maxChars?: number;
}

const DEFAULT_MAX = 1500;

/** "- **Writing the pronunciation**: long text…" → "Writing the pronunciation: long text" (first sentence only). */
function shortBullet(line: string, maxLen = 140): string {
  const text = line
    .replace(/^\s*-\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+([:;,.])/g, '$1');
  const first = (text.split(/(?<=\.)\s/)[0] ?? text).trim().replace(/\.$/, '');
  return first.length > maxLen ? `${first.slice(0, maxLen - 1).trim()}…` : first;
}

const bullets = (bodies: { body: string }[] | undefined) =>
  (bodies ?? []).flatMap((part) => part.body.split('\n')).filter((l) => l.trim().startsWith('-'));

/**
 * What goes in, most important first (research on dialect generation, e.g. AL-QASIDA 2025, finds
 * that models understand dialects but drift into MSA, and that a few real examples help most):
 *   1. a conditional opener: dialect when the user writes in it or asks for it, not for every answer
 *   2. the user's own words
 *   3. how the dialect is built (markers from the guide), with a warning against MSA mid-sentence
 *   4. words AI slips in that are not this dialect, with what to say instead (dialect.yaml `avoid`)
 *   5. one real example
 *   6. a few words that give the dialect away, only ones native speakers verified
 * Words any model already knows (big, eat, drink) are left out: they spend the character budget and
 * teach nothing. When the text is too long, parts are trimmed from the bottom up.
 */
export function buildPortablePrompt(dict: Dictionary, memory: Memory, dialectId: string, opts: PortableOptions = {}): string {
  const max = opts.maxChars ?? DEFAULT_MAX;
  const dialect = dict.getDialect(dialectId);
  if (!dialect) throw new Error(`Unknown dialect "${dialectId}"`);
  const name = displayName(dialect);
  const region = memory.profile.region ? `, from ${memory.profile.region}` : '';

  const header =
    `When I write to you in ${name}${region}, or ask you to use it, reply the way people there actually write in chat. ` +
    `Stay in it for the whole conversation, don't drift into Modern Standard Arabic or other dialects mid-sentence, and don't overdo slang.`;

  const personal = [
    ...memory.words.map((w) => `say "${w.say}"${w.instead_of ? ` (not "${w.instead_of}")` : ''}`),
    ...memory.corrections.map((c) => `"${c.right}" not "${c.wrong}"`),
    ...memory.style.map((s) => s.text),
  ];

  const guide = mergedGuide(dict, dialectId);
  const markers = bullets(guide.sections['Grammar & markers']).map((l) => shortBullet(l)).filter(Boolean);

  // Hand-kept "not this dialect" words from the dialect and its ancestors; the guide's prose as a fallback.
  const seen = new Set<string>();
  const avoid = dict
    .branch(dialectId)
    .flatMap((d) => dict.getDialect(d)?.avoid ?? [])
    .filter((a) => !seen.has(a.word) && seen.add(a.word))
    .map((a) => (a.use[0] ? `${a.word} (say ${a.use[0]})` : a.word));
  const mistakes = avoid.length ? [] : bullets(guide.sections['Common AI mistakes']).map((l) => shortBullet(l)).filter(Boolean);

  const sample = dict.samplesFor(dialectId, 1)[0];
  const example = sample?.turns[1] ? `Example: "${sample.turns[0]?.text}" → "${sample.turns[1].text}"` : '';

  // Words that give the dialect away, verified by native speakers. Not drafts, even well-attested ones:
  // sources confirm that a word exists, not that it is the everyday word for the meaning (Egyptian
  // توبة is real, but it is not how you say "never"), and a learner can't tell the difference.
  const distinctive = dict
    .coreWords(dialectId)
    .map((c) => ({ gloss: c.gloss.split(',')[0]!, entry: c.entries.find((e) => confidenceOf(e) === 'verified' && dict.isDiagnostic(e)) }))
    .filter((c): c is { gloss: string; entry: NonNullable<typeof c.entry> } => Boolean(c.entry))
    .map((c) => `${c.gloss} = ${c.entry.word}`);

  const assemble = (nMarkers: number, nAvoid: number, withExample: boolean, nWords: number) =>
    [
      header,
      personal.length ? `My own words (always use these): ${personal.join('; ')}.` : '',
      nMarkers ? `How it works: ${markers.slice(0, nMarkers).join('; ')}.` : '',
      nAvoid && avoid.length ? `Never use: ${avoid.slice(0, nAvoid).join(', ')}.` : '',
      nAvoid && mistakes.length ? `Avoid: ${mistakes.slice(0, nAvoid).join('; ')}.` : '',
      withExample ? example : '',
      nWords ? `Words that sound like home: ${distinctive.slice(0, nWords).join(', ')}.` : '',
    ]
      .filter(Boolean)
      .join('\n');

  // Shrink from the bottom up: distinctive words, then avoid items and markers, the example last.
  let nMarkers = Math.min(markers.length, 4);
  let nAvoid = Math.min(Math.max(avoid.length, mistakes.length), 10);
  let withExample = Boolean(example);
  let nWords = Math.min(distinctive.length, 20);
  let text = assemble(nMarkers, nAvoid, withExample, nWords);
  while (text.length > max) {
    if (nWords > 0) nWords--;
    else if (nAvoid > 3) nAvoid--;
    else if (nMarkers > 2) nMarkers--;
    else if (withExample) withExample = false;
    else if (nAvoid > 0) nAvoid--;
    else if (nMarkers > 0) nMarkers--;
    else break;
    text = assemble(nMarkers, nAvoid, withExample, nWords);
  }
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
