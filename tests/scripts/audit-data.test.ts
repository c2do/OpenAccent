import { describe, expect, it } from 'vitest';
import { auditBundle, BLOCKING, renderAudit } from '../../scripts/audit-data.js';
import { letterCount } from '../../scripts/quality.js';
import { EntrySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const imported = (id: string, raw: Record<string, unknown>) => ({
  id,
  ...EntrySchema.parse({
    dialect: id.split('/')[0],
    type: 'word',
    status: 'draft',
    source: { kind: 'dataset', name: 'wiktionary' },
    ...raw,
  }),
});

describe('auditBundle', () => {
  const bundle = fixtureBundle();
  bundle.concepts = { ...bundle.concepts, why: { en: 'why', ar: 'ليش', category: 'questions' } };
  bundle.entries.push(
    imported('ar-eg/kafta', { word: 'كفتا', meanings: [{ en: 'kofta' }], concept: 'why', part_of_speech: 'noun' }),
    imported('ar-eg/bi', { word: 'بِ', meanings: [{ en: 'with' }] }),
    imported('ar-eg/rude', { word: 'كلمة', meanings: [{ en: 'offensive term for a woman' }] }),
    imported('ar-eg/labelled', { word: 'كلمتين', meanings: [{ en: 'offensive term for a man', sensitive: ['offensive'] }] }),
    imported('ar-eg/fi', { word: 'في', meanings: [{ en: 'in' }], part_of_speech: 'prep' }),
    imported('en-us-general/upon', { word: 'upon', meanings: [{ en: 'on' }], part_of_speech: 'prep' }),
    imported('ar-eg/lesh', { word: 'ليه', meanings: [{ en: 'why' }], concept: 'why', part_of_speech: 'adv' }),
  );
  const [eg, us] = auditBundle(bundle, ['ar-eg', 'en-us-general']);
  const kinds = (entry: string) => [...eg!.findings, ...us!.findings].filter((f) => f.entry === entry).map((f) => f.kind);

  it('flags what the review of the first import found', () => {
    expect(kinds('ar-eg/kafta')).toEqual(['concept_mismatch']);
    expect(kinds('ar-eg/bi')).toEqual(['too_short']);
    expect(kinds('ar-eg/rude')).toEqual(['unlabeled_sensitive']);
    expect(kinds('ar-eg/labelled')).toEqual([]);
    expect(kinds('en-us-general/upon')).toEqual(['function_word']);
    // Arabic dialect imports keep grammar words on purpose (شو, هيك, في give a dialect away).
    expect(kinds('ar-eg/fi')).toEqual([]);
  });

  it('passes a correct import', () => {
    expect(kinds('ar-eg/lesh')).toEqual([]);
  });

  it('counts entries, verified entries and core concepts', () => {
    expect(eg).toMatchObject({ dialect: 'ar-eg', verified: 0 });
    expect(eg!.concepts).toBe(1);
    expect(eg!.sensitive).toBe(2); // the fixture’s شرموطة and ar-eg/labelled
  });

  it('renders a table and lists findings', () => {
    const md = renderAudit([eg!], Object.keys(bundle.concepts).length);
    expect(md).toContain('| ar-eg |');
    expect(md).toContain('**unlabeled_sensitive** `ar-eg/rude`');
    expect(BLOCKING).toEqual(['unlabeled_sensitive', 'too_short']);
  });
});

describe('letterCount', () => {
  it('ignores harakat and tatweel but counts Devanagari vowel signs', () => {
    expect(letterCount('بِ')).toBe(1);
    expect(letterCount('ـب')).toBe(1);
    expect(letterCount('وين')).toBe(3);
    expect(letterCount('हाँ')).toBe(2);
    expect(letterCount('की')).toBe(2);
  });
});
