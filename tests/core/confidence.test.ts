import { describe, expect, it } from 'vitest';
import { confidenceLabel, confidenceOf } from '../../src/core/confidence.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { EntrySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const entry = (raw: Record<string, unknown>) =>
  EntrySchema.parse({ word: 'دلوقتي', dialect: 'ar-eg', type: 'word', meanings: [{ en: 'now' }], status: 'draft', ...raw });
const wiktionary = { kind: 'dataset', name: 'wiktionary' };

describe('confidenceOf', () => {
  it('ranks by who stands behind an entry', () => {
    expect(confidenceOf(entry({ status: 'verified', verified_by: ['rev'], source: wiktionary }))).toBe('verified');
    expect(confidenceOf(entry({ source: wiktionary, attested_by: [{ name: 'tatoeba' }] }))).toBe('high');
    expect(confidenceOf(entry({ source: wiktionary }))).toBe('medium');
    expect(confidenceOf(entry({ source: { kind: 'contributor' } }))).toBe('medium');
    expect(confidenceOf(entry({ source: { kind: 'ai-draft' } }))).toBe('low');
    expect(confidenceOf(entry({ status: 'disputed', source: wiktionary, attested_by: [{ name: 'tatoeba' }] }))).toBe('low');
  });

  it('counts each dataset once', () => {
    expect(confidenceOf(entry({ source: wiktionary, attested_by: [{ name: 'wiktionary', ref: 'x' }] }))).toBe('medium');
  });

  it('says how many sources agree', () => {
    const e = entry({ source: wiktionary, attested_by: [{ name: 'tatoeba' }, { name: 'wikidata' }] });
    expect(confidenceLabel(e)).toBe('✓ attested by 3 independent sources (not yet reviewed)');
    expect(confidenceLabel(entry({ source: wiktionary }))).toBe('⚠ unverified (one source)');
  });
});

describe('ranking by confidence', () => {
  it('puts words several sources agree on above single-source drafts', () => {
    const bundle = fixtureBundle();
    bundle.entries = bundle.entries.filter((e) => e.dialect !== 'ar-eg');
    bundle.entries.push(
      { id: 'ar-eg/a-single', ...entry({ word: 'هلقيتي', source: wiktionary }) },
      { id: 'ar-eg/b-double', ...entry({ word: 'دلوقتي', source: wiktionary, attested_by: [{ name: 'tatoeba' }] }) },
    );
    const ids = new Dictionary(bundle).express('now', { dialects: ['ar-eg'] })[0]!.items.map((m) => m.entry.id);
    expect(ids).toEqual(['ar-eg/b-double', 'ar-eg/a-single']);
  });
});
