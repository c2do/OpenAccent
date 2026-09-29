import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkReply } from '../../src/core/check.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { CURRENT_MEMORY_VERSION, FileMemoryStore, MemorySchema } from '../../src/core/memory/index.js';
import { CheckResultSchema } from '../../src/core/results.js';
import { fixtureBundle } from '../fixtures/bundle.js';
import { messyText, RUNS } from './arbitraries.js';

const dict = new Dictionary(fixtureBundle());
const DIALECTS = dict.bundle.dialects.map((d) => d.id);
const now = '2026-09-29T12:00:00.000Z';

// Real words from the fixture dictionary (with clitics and phrases), mixed into messy text, so
// checks actually find issues instead of only seeing noise.
const KNOWN = [
  ...dict.bundle.entries.flatMap((e) => [e.word, ...e.spellings]),
  'وهلّأ', 'فدلوقتي', 'بالحاكورة', 'للدار', "l'amour", "mom's", 'at the end of the day', 'كويس',
];
const reply = fc
  .array(fc.oneof(fc.constantFrom(...KNOWN), messyText), { maxLength: 12 })
  .chain((parts) => fc.array(fc.constantFrom(' ', '، ', '\n', '', '😀 ', '‏'), { minLength: parts.length, maxLength: parts.length }).map((seps) => parts.map((p, i) => p + seps[i]).join('')));

const memory = fc
  .record({
    corrections: fc.array(fc.record({ wrong: fc.oneof(fc.constantFrom(...KNOWN), messyText), right: fc.constantFrom('منيح', 'هسّا', 'ok') }), { maxLength: 3 }),
    words: fc.array(fc.record({ say: fc.oneof(fc.constantFrom(...KNOWN), messyText), instead_of: fc.option(fc.constantFrom(...KNOWN), { nil: undefined }) }), { maxLength: 3 }),
  })
  .map(({ corrections, words }) =>
    MemorySchema.parse({
      version: CURRENT_MEMORY_VERSION,
      corrections: corrections.filter((c) => c.wrong.length > 0).map((c, i) => ({ id: `c${i + 1}`, ...c, created_at: now })),
      words: words.filter((w) => w.say.length > 0).map((w, i) => ({ id: `w${i + 1}`, ...w, created_at: now })),
    }),
  );

describe('checkReply', () => {
  it('every issue points at exactly its text, in order, without overlaps, and matches the schema', () => {
    fc.assert(
      fc.property(reply, memory, fc.constantFrom(...DIALECTS), fc.constantFrom('chat', 'song', 'script') as fc.Arbitrary<'chat' | 'song' | 'script'>, (text, mem, dialect, purpose) => {
        const r = checkReply(dict, mem, text, dialect, { purpose });
        expect(CheckResultSchema.safeParse(r).error).toBeUndefined();
        let previousEnd = 0;
        for (const issue of r.issues) {
          expect(issue.text).toBe(text.slice(issue.start, issue.end));
          expect(issue.start).toBeGreaterThanOrEqual(previousEnd);
          previousEnd = issue.end;
        }
      }),
      { numRuns: RUNS },
    );
  });

  it('finds issues in these generated replies (the property above is not vacuous)', () => {
    const samples = fc.sample(reply, { numRuns: 200, seed: 42 });
    const withIssues = samples.filter((t) => checkReply(dict, MemorySchema.parse({ version: CURRENT_MEMORY_VERSION }), t, 'ar-ps-fallahi').issues.length > 0);
    expect(withIssues.length).toBeGreaterThan(20);
  });
});

describe('Dictionary.lookup', () => {
  it('never throws, and pages are consistent', () => {
    fc.assert(
      fc.property(fc.oneof(fc.constantFrom(...KNOWN), messyText), fc.constantFrom(undefined, ...DIALECTS), fc.integer({ min: 1, max: 5 }), (q, dialect, limit) => {
        const page = dict.lookup(q, { dialect, limit });
        expect(page.count).toBe(page.items.length);
        expect(page.count).toBeLessThanOrEqual(limit);
        expect(page.has_more).toBe(page.total > page.count);
        expect(new Set(page.items.map((m) => m.entry.id)).size).toBe(page.count);
      }),
      { numRuns: RUNS },
    );
  });
});

describe('FileMemoryStore', () => {
  it('whatever is remembered can be read back, and forgetting by id removes it', () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }), (says) => {
        const store = new FileMemoryStore(join(mkdtempSync(join(tmpdir(), 'oa-prop-')), 'memory.json'));
        const ids = says.map((say) => store.remember({ kind: 'word', say }).item.id);
        const read = store.read();
        for (const say of says) expect(read.words.some((w) => w.say === say)).toBe(true);
        store.forget({ ids });
        expect(store.read().words).toEqual([]);
      }),
      { numRuns: Math.min(RUNS, 100) },
    );
  });
});
