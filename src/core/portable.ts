import type { Dictionary } from './dictionary.js';
import { mergedGuide } from './guides.js';
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
function shortMistake(line: string): string {
  const text = line
    .replace(/^\s*-\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+([:;,.])/g, '$1');
  const first = text.split(/(?<=\.)\s/)[0] ?? text;
  return first.trim().replace(/\.$/, '');
}

export function buildPortablePrompt(dict: Dictionary, memory: Memory, dialectId: string, opts: PortableOptions = {}): string {
  const max = opts.maxChars ?? DEFAULT_MAX;
  const dialect = dict.getDialect(dialectId);
  if (!dialect) throw new Error(`Unknown dialect "${dialectId}"`);
  const plain = (t: string) => t.replace(/\s*\([^)]*\)/g, '').trim();
  const name = dialect.name.ar ? `${plain(dialect.name.en)} (${plain(dialect.name.ar)})` : plain(dialect.name.en);
  const region = memory.profile.region ? `, from ${memory.profile.region}` : '';

  // Parts in priority order; lower-priority parts are dropped or shortened first.
  const header = `Talk to me in ${name}${region}, the way people there actually write in chat. Stay in this dialect the whole conversation, don't mix in other dialects or formal language, and don't overdo slang.`;

  const personal = [
    ...memory.words.map((w) => `say "${w.say}"${w.instead_of ? ` (not "${w.instead_of}")` : ''}`),
    ...memory.corrections.map((c) => `"${c.right}" not "${c.wrong}"`),
    ...memory.style.map((s) => s.text),
  ];

  const core = dict
    .coreWords(dialectId)
    .map((c) => `${c.gloss.split(',')[0]} = ${c.entries.slice(0, 2).map((e) => e.word).join('/')}`);

  const guide = mergedGuide(dict, dialectId);
  const mistakes = (guide.sections['Common AI mistakes'] ?? [])
    .flatMap((part) => part.body.split('\n'))
    .filter((l) => l.trim().startsWith('-'))
    .map(shortMistake)
    .filter(Boolean);

  const sample = dict.samplesFor(dialectId, 1)[0];
  const example = sample ? `Example: "${sample.turns[0]?.text}" → "${sample.turns[1]?.text}"` : '';

  const assemble = (nCore: number, nMistakes: number, withExample: boolean) =>
    [
      header,
      personal.length ? `My own words (always use these): ${personal.join('; ')}.` : '',
      nCore ? `Everyday words: ${core.slice(0, nCore).join(', ')}.` : '',
      nMistakes ? `Avoid: ${mistakes.slice(0, nMistakes).join('; ')}.` : '',
      withExample ? example : '',
    ]
      .filter(Boolean)
      .join('\n');

  // Shrink until it fits: example first, then mistakes, then core words.
  let nCore = core.length;
  let nMistakes = Math.min(mistakes.length, 5);
  let withExample = Boolean(example);
  let text = assemble(nCore, nMistakes, withExample);
  while (text.length > max) {
    if (withExample) withExample = false;
    else if (nMistakes > 2) nMistakes--;
    else if (nCore > 5) nCore--;
    else if (nMistakes > 0) nMistakes--;
    else if (nCore > 0) nCore--;
    else break;
    text = assemble(nCore, nMistakes, withExample);
  }
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
