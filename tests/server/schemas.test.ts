import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { buildBriefing } from '../../src/core/briefing.js';
import { checkReply } from '../../src/core/check.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { MemorySchema } from '../../src/core/memory/index.js';
import {
  BriefingResultSchema,
  CheckResultSchema,
  DialectCardResultSchema,
  ExportPromptResultSchema,
  ExpressResultSchema,
  ForgetResultSchema,
  ListDialectsResultSchema,
  LookupResultSchema,
  RememberResultSchema,
  SuggestionLinkSchema,
} from '../../src/core/results.js';
import { ok } from '../../src/server/respond.js';
import { fixtureBundle } from '../fixtures/bundle.js';
import { connect, type Harness } from './harness.js';

// One server for the whole file: the calls below run in order and build on each other (profile first).
let h: Harness;
beforeAll(async () => {
  h = await connect();
});
afterAll(async () => h.close());

/** One call per tool, with the schema its result must match exactly. */
const CALLS: [tool: string, args: Record<string, unknown>, schema: z.ZodType][] = [
  ['openaccent_remember', { kind: 'profile', dialect: 'ar-ps-fallahi', region: 'Ramallah villages' }, RememberResultSchema],
  ['openaccent_remember', { kind: 'correction', wrong: 'كويس', right: 'منيح' }, RememberResultSchema],
  ['openaccent_get_briefing', {}, BriefingResultSchema],
  ['openaccent_lookup', { query: '7akoura' }, LookupResultSchema],
  ['openaccent_express', { meaning: 'now', dialects: ['ar-ps-fallahi', 'ar-eg'] }, ExpressResultSchema],
  ['openaccent_list_dialects', {}, ListDialectsResultSchema],
  ['openaccent_check_reply', { text: 'كويس، دلوقتي بجيك' }, CheckResultSchema],
  ['openaccent_suggest_entry', { word: 'هاض', meaning_en: 'this' }, SuggestionLinkSchema],
  ['openaccent_export_prompt', {}, ExportPromptResultSchema],
  ['openaccent_dialect_card', { dialect: 'ar-ps-fallahi', purpose: 'song' }, DialectCardResultSchema],
  ['openaccent_forget', { ids: ['c1'] }, ForgetResultSchema],
];

describe('tool results match their shared schemas exactly', () => {
  it('covers all 10 tools', async () => {
    const { tools } = await h.client.listTools();
    expect(new Set(CALLS.map((c) => c[0]))).toEqual(new Set(tools.map((t) => t.name)));
  });

  it.each(CALLS)('%s', async (tool, args, schema) => {
    const r = await h.call(tool, args);
    expect(r.isError, r.text).toBe(false);
    expect(schema.safeParse(r.data).error).toBeUndefined();
  });

  it('declares strict output schemas to clients', async () => {
    const { tools } = await h.client.listTools();
    for (const t of tools) {
      expect(t.outputSchema, t.name).toBeDefined();
      expect((t.outputSchema as { additionalProperties?: boolean }).additionalProperties, t.name).toBe(false);
    }
  });
});

describe('ok()', () => {
  const ctx = { dictionary: new Dictionary(fixtureBundle()), memory: { read: () => MemorySchema.parse({ version: 1 }), warnings: [] } };

  it('refuses a field the schema does not declare', () => {
    expect(() => ok(ctx as never, 'x', DialectCardResultSchema, { dialect: 'ar-ps', purpose: 'song', secret: 1 } as never)).toThrow();
  });
});

describe('core results match the shared schemas', () => {
  const dict = new Dictionary(fixtureBundle());
  const memory = MemorySchema.parse({ version: 1, profile: { dialect: 'ar-ps-fallahi' } });

  it('checkReply', () => {
    const r = checkReply(dict, memory, 'وهلّأ دلوقتي؟ at the end of the day', 'ar-ps-fallahi');
    expect(r.issues.length).toBeGreaterThan(0);
    expect(CheckResultSchema.parse(r)).toEqual(r);
  });

  it('buildBriefing, with and without a profile', () => {
    for (const m of [memory, MemorySchema.parse({ version: 1 })]) {
      const { text: _text, ...data } = buildBriefing(dict, m);
      expect(BriefingResultSchema.parse(data)).toEqual(data);
    }
  });

  it('listDialects', () => {
    expect(() => ListDialectsResultSchema.parse({ dialects: dict.listDialects() })).not.toThrow();
  });
});
