/**
 * Measures whether OpenAccent makes Claude speak a dialect better.
 *
 * For every prompt in evals/prompts/<dialect>.yaml, Claude answers twice:
 *   baseline    – no system prompt
 *   openaccent  – the OpenAccent briefing for a user of that dialect as the system prompt
 * Each reply is scored automatically at the word level (check_reply + core words), and all
 * replies are saved so native speakers can judge them.
 *
 *   tsx scripts/eval.ts --dialects ar-ps-fallahi-kaf,es-mx [--model claude-opus-5-5] [--effort low]
 *   tsx scripts/eval.ts --dry-run                 # show what would run, no API calls
 *   tsx scripts/eval.ts --score evals/results/<run>.json   # re-score saved replies (e.g. after data changes)
 *
 * Needs ANTHROPIC_API_KEY (or another Anthropic credential) unless --dry-run or --score.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { parse } from 'yaml';
import { z } from 'zod';
import { buildBriefing } from '../src/core/briefing.js';
import { checkReply } from '../src/core/check.js';
import { Dictionary } from '../src/core/dictionary.js';
import { MemorySchema } from '../src/core/schema.js';
import { buildBundle } from './build-data.js';

export const EvalSetSchema = z.object({
  dialect: z.string(),
  /** What a native speaker would expect, shown to human judges. */
  notes: z.string().optional(),
  prompts: z.array(z.object({ id: z.string(), text: z.string().min(1) })).min(1),
});
export type EvalSet = z.infer<typeof EvalSetSchema>;

export type Condition = 'baseline' | 'openaccent';

export interface ReplyScore {
  /** Words from another dialect that the user's dialect has its own word for. */
  otherDialect: number;
  /** Words written the way they sound. */
  pronunciation: number;
  /** Rare or dated words. */
  rareOrDated: number;
  /** How many of the dialect's core words appear (a sign the reply is actually in the dialect). */
  coreWordsUsed: number;
}

export interface ReplyRecord {
  dialect: string;
  promptId: string;
  prompt: string;
  condition: Condition;
  reply: string;
  score: ReplyScore;
}

/** Word-level score of one reply against a dialect. */
export function scoreReply(dict: Dictionary, dialect: string, reply: string): ReplyScore {
  const memory = MemorySchema.parse({ version: 1, profile: { dialect } });
  const { issues } = checkReply(dict, memory, reply, dialect);
  const norm = dict.normalizer(dialect);
  const text = ` ${norm(reply)} `;
  const coreForms = dict
    .coreWords(dialect)
    .flatMap((c) => c.entries.flatMap((e) => [e.word, ...e.spellings]))
    .map(norm)
    .filter(Boolean);
  const coreWordsUsed = new Set(coreForms.filter((f) => text.includes(` ${f} `))).size;
  return {
    otherDialect: issues.filter((i) => i.kind === 'other_dialect').length,
    pronunciation: issues.filter((i) => i.kind === 'pronunciation').length,
    rareOrDated: issues.filter((i) => i.kind === 'rare' || i.kind === 'dated').length,
    coreWordsUsed,
  };
}

export interface ConditionSummary {
  replies: number;
  /** Share of replies with at least one other-dialect word. */
  mixingRate: number;
  avgOtherDialect: number;
  avgPronunciation: number;
  /** Share of replies that use at least one core word of the dialect. */
  coreWordRate: number;
}

export function summarize(records: ReplyRecord[]): Record<string, Record<Condition, ConditionSummary>> {
  const out: Record<string, Record<Condition, ConditionSummary>> = {};
  const dialects = [...new Set(records.map((r) => r.dialect))];
  for (const dialect of dialects) {
    const byCondition = {} as Record<Condition, ConditionSummary>;
    for (const condition of ['baseline', 'openaccent'] as const) {
      const rs = records.filter((r) => r.dialect === dialect && r.condition === condition);
      const n = rs.length || 1;
      const sum = (f: (s: ReplyScore) => number) => rs.reduce((a, r) => a + f(r.score), 0);
      byCondition[condition] = {
        replies: rs.length,
        mixingRate: rs.filter((r) => r.score.otherDialect > 0).length / n,
        avgOtherDialect: sum((s) => s.otherDialect) / n,
        avgPronunciation: sum((s) => s.pronunciation) / n,
        coreWordRate: rs.filter((r) => r.score.coreWordsUsed > 0).length / n,
      };
    }
    out[dialect] = byCondition;
  }
  return out;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function renderReport(records: ReplyRecord[], meta: { model: string; effort: string; date: string }): string {
  const summary = summarize(records);
  const lines = [
    `# OpenAccent eval — ${meta.date}`,
    '',
    `Model: \`${meta.model}\` · effort: \`${meta.effort}\` · ${records.length} replies`,
    '',
    'Automatic, word-level scores (lower mixing is better, higher core-word use is better).',
    'They cannot judge grammar or tone: native speakers should read the replies below.',
    '',
    '| Dialect | Condition | Mixing rate | Other-dialect words / reply | Written-as-pronounced / reply | Uses core words |',
    '|---|---|---|---|---|---|',
  ];
  for (const [dialect, byCondition] of Object.entries(summary)) {
    for (const [condition, s] of Object.entries(byCondition)) {
      lines.push(
        `| ${dialect} | ${condition} | ${pct(s.mixingRate)} | ${s.avgOtherDialect.toFixed(2)} | ${s.avgPronunciation.toFixed(2)} | ${pct(s.coreWordRate)} |`,
      );
    }
  }
  lines.push('', '## Replies (for human judging)');
  for (const dialect of Object.keys(summary)) {
    lines.push('', `### ${dialect}`);
    const prompts = [...new Set(records.filter((r) => r.dialect === dialect).map((r) => r.promptId))];
    for (const id of prompts) {
      const rs = records.filter((r) => r.dialect === dialect && r.promptId === id);
      lines.push('', `**${id}** — ${rs[0]?.prompt}`);
      for (const r of rs) lines.push(`- _${r.condition}_: ${r.reply.replace(/\n+/g, ' ')}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function loadEvalSets(dir: string, wanted?: string[]): EvalSet[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => EvalSetSchema.parse(parse(readFileSync(join(dir, f), 'utf8'))))
    .filter((s) => !wanted || wanted.includes(s.dialect));
}

/** The system prompt a user of this dialect would get from OpenAccent. */
export function openAccentSystem(dict: Dictionary, dialect: string): string {
  return buildBriefing(dict, MemorySchema.parse({ version: 1, profile: { dialect } })).text;
}

async function ask(client: Anthropic, model: string, effort: string, prompt: string, system?: string): Promise<string> {
  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: effort as 'low' | 'medium' | 'high' | 'xhigh' | 'max' },
    ...(system ? { system } : {}),
    messages: [{ role: 'user', content: prompt }],
  });
  if (response.stop_reason === 'refusal') return '[refused]';
  return response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const dict = new Dictionary(buildBundle(join(process.cwd(), 'data')));
  const model = arg('model') ?? 'claude-opus-5-5';
  const effort = arg('effort') ?? 'low'; // chat-style replies; see the claude-api guidance on effort
  const date = new Date().toISOString().slice(0, 10);
  const outDir = join(process.cwd(), 'evals', 'results');

  const scoreFile = arg('score');
  if (scoreFile) {
    const saved = JSON.parse(readFileSync(scoreFile, 'utf8')) as { model: string; effort: string; records: ReplyRecord[] };
    const records = saved.records.map((r) => ({ ...r, score: scoreReply(dict, r.dialect, r.reply) }));
    console.log(renderReport(records, { model: saved.model, effort: saved.effort, date }));
    return;
  }

  const wanted = arg('dialects')?.split(',').map((s) => s.trim());
  const sets = loadEvalSets(join(process.cwd(), 'evals', 'prompts'), wanted);
  const calls = sets.reduce((n, s) => n + s.prompts.length * 2, 0);
  if (process.argv.includes('--dry-run')) {
    console.log(`${sets.length} dialect(s), ${calls} API calls with ${model} (effort ${effort}).`);
    for (const s of sets) {
      console.log(`\n== ${s.dialect}: ${s.prompts.length} prompts; system prompt is ${openAccentSystem(dict, s.dialect).length} characters`);
    }
    return;
  }

  const client = new Anthropic();
  const records: ReplyRecord[] = [];
  for (const set of sets) {
    const system = openAccentSystem(dict, set.dialect);
    for (const p of set.prompts) {
      for (const condition of ['baseline', 'openaccent'] as const) {
        const reply = await ask(client, model, effort, p.text, condition === 'openaccent' ? system : undefined);
        records.push({ dialect: set.dialect, promptId: p.id, prompt: p.text, condition, reply, score: scoreReply(dict, set.dialect, reply) });
        console.error(`${set.dialect} ${p.id} ${condition}: done`);
      }
    }
  }
  mkdirSync(outDir, { recursive: true });
  const base = join(outDir, `${date}-${model}`);
  writeFileSync(`${base}.json`, JSON.stringify({ model, effort, date, records }, null, 2));
  writeFileSync(`${base}.md`, renderReport(records, { model, effort, date }));
  console.log(`Wrote ${base}.md and ${base}.json`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    if (err instanceof Anthropic.AuthenticationError) console.error('No valid Anthropic credential: set ANTHROPIC_API_KEY.');
    else if (err instanceof Anthropic.RateLimitError) console.error('Rate limited: try again later or with fewer dialects.');
    else if (err instanceof Anthropic.APIError) console.error(`API error ${err.status}: ${err.message}`);
    else console.error((err as Error).message);
    process.exit(1);
  });
}
