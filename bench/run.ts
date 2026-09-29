/**
 * Performance budgets on a synthetic dictionary (default 100,000 entries).
 *
 *   npm run bench                  # report
 *   npm run bench -- --size 20000  # smaller dictionary
 *   npm run bench -- --strict      # exit 1 when a budget is missed
 */
import { performance } from 'node:perf_hooks';
import { checkReply } from '../src/core/check.js';
import { Dictionary } from '../src/core/dictionary.js';
import { CURRENT_MEMORY_VERSION } from '../src/core/memory/index.js';
import { MemorySchema } from '../src/core/schema.js';
import { syntheticBundle } from '../tests/fixtures/synthetic.js';

export const BUDGETS_MS = { startup: 300, lookupP95: 10, expressP95: 10, checkReplyP95: 25 };

function percentile(xs: number[], p: number): number {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!;
}

function time<T>(fn: () => T): number {
  const t = performance.now();
  fn();
  return performance.now() - t;
}

export function runBench(size: number) {
  const bundle = syntheticBundle(size);
  let dict!: Dictionary;
  const startup = time(() => (dict = new Dictionary(bundle)));

  const sample = bundle.entries.filter((_, i) => i % Math.max(1, Math.floor(size / 300)) === 0);
  const queries = sample.flatMap((e) => [e.word, e.word.toUpperCase(), e.meanings[0]?.en?.split(' ')[0] ?? 'x', `${e.word}zz`]);
  const dialects = [undefined, 'ar-ps-fallahi-kaf', 'en-us-general', 'es-mx'];
  const lookups = queries.map((q, i) => time(() => dict.lookup(q, { dialect: dialects[i % dialects.length] })));
  const expresses = sample.slice(0, 200).map((e) => time(() => dict.express(e.meanings[0]?.en ?? 'x', { dialects: ['ar-ps-fallahi-kaf', 'en-us-general'] })));

  const memory = MemorySchema.parse({ version: CURRENT_MEMORY_VERSION, profile: { dialect: 'ar-ps-fallahi-kaf' } });
  const arabic = bundle.entries.filter((e) => e.dialect.startsWith('ar')).map((e) => e.word);
  const replies = Array.from({ length: 50 }, (_, r) => Array.from({ length: 50 }, (_, i) => arabic[(r * 50 + i * 7) % arabic.length]).join(' '));
  const checks = replies.map((text) => time(() => checkReply(dict, memory, text, 'ar-ps-fallahi-kaf')));

  return {
    size,
    startup,
    lookupP50: percentile(lookups, 50),
    lookupP95: percentile(lookups, 95),
    expressP95: percentile(expresses, 95),
    checkReplyP95: percentile(checks, 95),
  };
}

function main() {
  const i = process.argv.indexOf('--size');
  const size = i >= 0 ? Number(process.argv[i + 1]) : 100_000;
  const r = runBench(size);
  const row = (name: string, ms: number, budget?: number) =>
    `${name.padEnd(16)} ${ms.toFixed(2).padStart(9)} ms${budget ? `   budget ${budget} ms ${ms <= budget ? '✓' : '✗'}` : ''}`;
  console.log(`Synthetic dictionary: ${r.size.toLocaleString('en')} entries\n`);
  console.log(row('startup', r.startup, BUDGETS_MS.startup));
  console.log(row('lookup p50', r.lookupP50));
  console.log(row('lookup p95', r.lookupP95, BUDGETS_MS.lookupP95));
  console.log(row('express p95', r.expressP95, BUDGETS_MS.expressP95));
  console.log(row('check_reply p95', r.checkReplyP95, BUDGETS_MS.checkReplyP95));
  const missed = (Object.keys(BUDGETS_MS) as (keyof typeof BUDGETS_MS)[]).filter((k) => r[k] > BUDGETS_MS[k]);
  if (missed.length && process.argv.includes('--strict')) {
    console.error(`\nOver budget: ${missed.join(', ')}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
