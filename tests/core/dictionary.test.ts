import { describe, expect, it } from 'vitest';
import { Dictionary } from '../../src/core/dictionary.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const dict = new Dictionary(fixtureBundle());
const ids = (page: { items: { entry: { id: string } }[] }) => page.items.map((m) => m.entry.id);

describe('Dictionary.lookup', () => {
  it('finds an exact word', () => {
    const r = dict.lookup('حاكورة', { dialect: 'ar-ps-fallahi' });
    expect(ids(r)[0]).toBe('ar-ps-fallahi/hakoura');
    expect(r.items[0]?.match).toBe('exact');
  });

  it('finds a word through normalization and spellings', () => {
    expect(ids(dict.lookup('حاكوره', { dialect: 'ar-ps-fallahi' }))[0]).toBe('ar-ps-fallahi/hakoura');
    expect(ids(dict.lookup('هسا', { dialect: 'ar-ps-fallahi' }))[0]).toBe('ar-ps-fallahi/hassa');
  });

  it('finds a word from its Arabizi form', () => {
    expect(ids(dict.lookup('7akoura', { dialect: 'ar-ps-fallahi' }))[0]).toBe('ar-ps-fallahi/hakoura');
  });

  it('finds a word from Arabizi candidates even without a listed romanization', () => {
    expect(ids(dict.lookup('zalameh', { dialect: 'ar-ps-fallahi' }))).toContain('ar-ps-fallahi/zalameh');
  });

  it('finds a written word from how it sounds (spoken → written rules)', () => {
    // قنّ has no listed spellings; fallahi says it كنّ.
    const r = dict.lookup('كنّ', { dialect: 'ar-ps-fallahi' });
    expect(ids(r)).toEqual(['ar-ps-fallahi/qinn']);
    expect(r.items[0]?.match).toBe('sound');
  });

  it('adds up sound rules along the branch (tshaf gets its own rule and fallahi’s)', () => {
    expect(ids(dict.lookup('تشيف', { dialect: 'ar-ps-fallahi-tshaf' }))).toEqual(['ar-ps-fallahi-tshaf/kif']);
    expect(ids(dict.lookup('كنّ', { dialect: 'ar-ps-fallahi-tshaf' }))).toEqual(['ar-ps-fallahi/qinn']);
    expect(ids(dict.lookup('كنّ', { dialect: 'ar-ps-fallahi-kaf' }))).toEqual(['ar-ps-fallahi/qinn']);
  });

  it('keeps tshaf words out of the kaf branch', () => {
    expect(ids(dict.lookup('تشيف', { dialect: 'ar-ps-fallahi-kaf' }))).toEqual([]);
  });

  it('never chains sound rules: تشال is not قال', () => {
    expect(ids(dict.lookup('تشال', { dialect: 'ar-ps-fallahi-tshaf' }))).toEqual([]);
    expect(ids(dict.lookup('تشنّ', { dialect: 'ar-ps-fallahi-tshaf' }))).toEqual([]);
  });

  it('inherits entries from parent dialects', () => {
    const r = dict.lookup('منيح', { dialect: 'ar-ps-fallahi' });
    expect(ids(r)).toEqual(['ar-ps/manih']);
    expect(r.items[0]?.inherited).toBe(true);
  });

  it('lets a child entry override the parent entry for the same word', () => {
    expect(ids(dict.lookup('زلمة', { dialect: 'ar-ps-fallahi' }))).toEqual(['ar-ps-fallahi/zalameh']);
    expect(ids(dict.lookup('زلمة', { dialect: 'ar-ps-madani' }))).toEqual(['ar-ps/zalameh']);
  });

  it('does not search sibling dialects when a dialect is given', () => {
    expect(ids(dict.lookup('هلّأ', { dialect: 'ar-ps-fallahi' }))).toEqual([]);
  });

  it('searches everything when no dialect is given', () => {
    expect(ids(dict.lookup('هلّأ'))).toEqual(['ar-ps-madani/halla']);
  });

  it('ranks verified above draft and exact above fuzzy', () => {
    const r = dict.lookup('now', { dialect: 'ar-ps-fallahi' });
    expect(ids(r)[0]).toBe('ar-ps-fallahi/hassa');
  });

  it('works for English with Latin normalization', () => {
    expect(ids(dict.lookup('Y’ALL', { dialect: 'en-us-south' }))).toEqual(['en-us-south/yall']);
    expect(ids(dict.lookup('colour', { dialect: 'en-us-general' }))).toEqual(['en-us-general/color']);
  });

  it('paginates', () => {
    const all = dict.lookup('now');
    const page = dict.lookup('now', { limit: 2, offset: 0 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(all.total);
    expect(page.has_more).toBe(true);
    expect(page.next_offset).toBe(2);
    const last = dict.lookup('now', { limit: 2, offset: all.total - 1 });
    expect(last.has_more).toBe(false);
  });

  it('throws a helpful error for an unknown dialect', () => {
    expect(() => dict.lookup('x', { dialect: 'ar-ps-falahi' })).toThrow(/Unknown dialect "ar-ps-falahi".*ar-ps-fallahi/);
  });
});

describe('Dictionary.express', () => {
  it('returns words for a meaning in one dialect', () => {
    const r = dict.express('now', { dialects: ['ar-ps-fallahi'] });
    expect(r).toHaveLength(1);
    expect(r[0]?.dialect).toBe('ar-ps-fallahi');
    expect(ids(r[0]!)).toEqual(['ar-ps-fallahi/hassa', 'ar-ps-fallahi/ilhin']);
  });

  it('accepts Arabic meanings', () => {
    const r = dict.express('الآن', { dialects: ['ar-ps-madani'] });
    // Both are linked to the "now" concept, which الآن names.
    expect(ids(r[0]!)).toEqual(['ar-ps-madani/halla', 'ar-ps-madani/hassa-madani']);
  });

  it('groups results when comparing dialects', () => {
    const r = dict.express('now', { dialects: ['ar-ps-fallahi', 'ar-ps-madani', 'ar-eg'] });
    expect(r.map((g) => g.dialect)).toEqual(['ar-ps-fallahi', 'ar-ps-madani', 'ar-eg']);
    expect(ids(r[2]!)).toEqual(['ar-eg/dilwaqti']);
  });

  it('matches gloss words, not substrings', () => {
    // "now" must not match "know" or "snow".
    const r = dict.express('you all', { dialects: ['en-us-general', 'en-us-south'] });
    expect(ids(r[0]!)).toEqual(['en-us-general/you-guys']);
    expect(ids(r[1]!)).toEqual(['en-us-south/yall']);
  });
});

describe('core concepts and samples', () => {
  it('finds a concept by id or gloss', () => {
    expect(dict.findConcept('now')).toBe('now');
    expect(dict.findConcept('الآن')).toBe('now');
    expect(dict.findConcept('how')).toBe('how');
    expect(dict.findConcept('banana')).toBeUndefined();
  });

  it('express puts concept-linked entries first, even without a matching gloss', () => {
    const r = dict.express('now', { dialects: ['ar-ps-madani'] });
    expect(ids(r[0]!)).toEqual(['ar-ps-madani/halla', 'ar-ps-madani/hassa-madani']);
  });

  it('lists how a dialect says each core concept', () => {
    const core = dict.coreWords('ar-ps-fallahi');
    expect(core.map((c) => c.concept)).toEqual(['now']);
    expect(core[0]?.entries.map((e) => e.word)).toEqual(['هسّع', 'الحين']);
    expect(dict.coreWords('ar-ps-fallahi-tshaf').map((c) => c.concept)).toEqual(['now', 'how']);
  });

  it('returns samples from the dialect branch', () => {
    expect(dict.samplesFor('ar-ps-fallahi-kaf').map((x) => x.id)).toEqual(['ar-ps-fallahi/where-are-you']);
    expect(dict.samplesFor('ar-eg')).toEqual([]);
  });
});

describe('Dictionary.listDialects', () => {
  it('returns every dialect with counts and verified share', () => {
    const list = dict.listDialects();
    const fallahi = list.find((x) => x.id === 'ar-ps-fallahi');
    expect(fallahi).toMatchObject({ parent: 'ar-ps', entries: 6, verified: 1, script: 'arab' });
    expect(fallahi?.verifiedPercent).toBe(17);
    expect(list.map((x) => x.id)).toContain('en-us-south');
  });
});

describe('Dictionary.branch', () => {
  it('lists a dialect and its ancestors, nearest first', () => {
    expect(dict.branch('ar-ps-fallahi-kaf')).toEqual(['ar-ps-fallahi-kaf', 'ar-ps-fallahi', 'ar-ps', 'ar']);
  });
});
