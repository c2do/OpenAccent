import { describe, expect, it } from 'vitest';
import { CURRENT_MEMORY_VERSION } from '../../src/core/memory/index.js';
import { DialectSchema, EntrySchema, MemorySchema } from '../../src/core/schema.js';

const validEntry = {
  word: 'حاكورة',
  dialect: 'ar-ps-fallahi',
  type: 'word',
  spellings: ['حاكوره'],
  romanized: ['7akoura', 'hakoura'],
  meanings: [
    {
      ar: 'جنينة صغيرة جنب الدار',
      en: 'small garden next to the house',
      examples: [{ text: 'روحي اقطفي شوية نعنع من الحاكورة' }],
    },
  ],
  register: 'casual',
  status: 'draft',
  source: { kind: 'ai-draft' },
};

const validDialect = {
  id: 'ar-ps-fallahi',
  parent: 'ar-ps',
  name: { en: 'Palestinian Rural (Fallahi)', ar: 'فلسطيني فلاحي' },
  script: 'arab',
  codes: { bcp47: 'apc-PS-x-fallahi', glottocode: 'fell1238' },
  reviewers: ['c2do'],
  status: 'active',
};

describe('EntrySchema', () => {
  it('parses a valid fallahi entry and fills defaults', () => {
    const e = EntrySchema.parse(validEntry);
    expect(e.familiarity).toBe('common');
    expect(e.verified_by).toEqual([]);
    expect(e.related).toEqual([]);
    expect(e.source.license).toBe('CC-BY-SA-4.0');
  });

  it.each(['word', 'dialect', 'meanings'])('rejects a missing %s', (field) => {
    const { [field]: _omit, ...rest } = validEntry as Record<string, unknown>;
    expect(EntrySchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an empty meanings list', () => {
    expect(EntrySchema.safeParse({ ...validEntry, meanings: [] }).success).toBe(false);
  });

  it('rejects a meaning with neither ar nor en', () => {
    const r = EntrySchema.safeParse({ ...validEntry, meanings: [{ examples: [] }] });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid familiarity', () => {
    expect(EntrySchema.safeParse({ ...validEntry, familiarity: 'weird' }).success).toBe(false);
  });

  it('requires a dataset name when source.kind is dataset', () => {
    expect(EntrySchema.safeParse({ ...validEntry, source: { kind: 'dataset' } }).success).toBe(false);
    expect(
      EntrySchema.safeParse({ ...validEntry, source: { kind: 'dataset', name: 'maknuune', ref: '123' } }).success,
    ).toBe(true);
  });

  it('rejects malformed related IDs', () => {
    expect(EntrySchema.safeParse({ ...validEntry, related: ['not an id'] }).success).toBe(false);
    expect(EntrySchema.safeParse({ ...validEntry, related: ['ar-ps-madani/jneineh'] }).success).toBe(true);
  });
});

describe('DialectSchema', () => {
  it('parses a valid dialect', () => {
    const d = DialectSchema.parse(validDialect);
    expect(d.parent).toBe('ar-ps');
  });

  it('allows a root dialect without a parent', () => {
    const { parent: _p, ...root } = validDialect;
    expect(DialectSchema.parse({ ...root, id: 'ar' }).parent).toBeUndefined();
  });

  it('rejects a dialect without script', () => {
    const { script: _s, ...rest } = validDialect;
    expect(DialectSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects a malformed id', () => {
    expect(DialectSchema.safeParse({ ...validDialect, id: 'Ar PS' }).success).toBe(false);
  });

  it('normalizes the retired ISO code ajp to apc', () => {
    const d = DialectSchema.parse({ ...validDialect, codes: { bcp47: 'ajp-PS', iso639_3: 'ajp' } });
    expect(d.codes.bcp47).toBe('apc-PS');
    expect(d.codes.iso639_3).toBe('apc');
  });

  it('accepts optional sound rules as [from, to] pairs', () => {
    const d = DialectSchema.parse({ ...validDialect, sound_rules: [['تش', 'ك']] });
    expect(d.sound_rules).toEqual([['تش', 'ك']]);
  });
});

describe('MemorySchema', () => {
  it('parses an empty memory with defaults', () => {
    const m = MemorySchema.parse({ version: CURRENT_MEMORY_VERSION });
    expect(m).toEqual({ version: 2, profile: { dialects: [] }, words: [], corrections: [], style: [], voice: { messages: 0, words: 0, latin: 0, emoji: 0, mixed: 0, dialects: {}, own: [] } });
  });

  it('parses items', () => {
    const now = '2026-09-29T00:00:00.000Z';
    const m = MemorySchema.parse({
      version: CURRENT_MEMORY_VERSION,
      profile: { dialect: 'ar-ps-fallahi' },
      words: [{ id: 'w1', say: 'هسّا', instead_of: 'هلأ', created_at: now }],
      corrections: [{ id: 'c1', wrong: 'كويس', right: 'منيح', created_at: now }],
      style: [{ id: 's1', text: 'Prefers short replies', created_at: now }],
    });
    expect(m.corrections[0]?.right).toBe('منيح');
  });

  it('rejects an unknown version with a clear message', () => {
    const r = MemorySchema.safeParse({ version: 99 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('Unsupported memory file version');
  });
});
