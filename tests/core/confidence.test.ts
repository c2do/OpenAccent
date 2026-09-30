import { describe, expect, it } from 'vitest';
import { attestationCounts, confidenceLabel, confidenceOf, independentSourcesOf, sourceGroups } from '../../src/core/confidence.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { EntrySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const entry = (raw: Record<string, unknown>) =>
  EntrySchema.parse({ word: 'دلوقتي', dialect: 'ar-eg', type: 'word', meanings: [{ en: 'now' }], status: 'draft', ...raw });
const wiktionary = { kind: 'dataset', name: 'wiktionary' };
// Attestations in the evidence ledger say how they were made.
const tatoeba = { name: 'tatoeba', method: 'parallel-corpus' as const, method_version: 2 };
const maknuune = { name: 'maknuune', method: 'dictionary-match' as const, method_version: 1 };

describe('confidenceOf', () => {
  it('ranks by who stands behind an entry', () => {
    expect(confidenceOf(entry({ status: 'verified', verified_by: ['rev'], source: wiktionary }))).toBe('verified');
    expect(confidenceOf(entry({ source: wiktionary, attested_by: [tatoeba] }))).toBe('high');
    expect(confidenceOf(entry({ source: wiktionary }))).toBe('medium');
    expect(confidenceOf(entry({ source: { kind: 'contributor' } }))).toBe('medium');
    expect(confidenceOf(entry({ source: { kind: 'ai-draft' } }))).toBe('low');
    expect(confidenceOf(entry({ status: 'disputed', source: wiktionary, attested_by: [tatoeba] }))).toBe('low');
  });

  it('counts each dataset once', () => {
    expect(confidenceOf(entry({ source: wiktionary, attested_by: [{ ...maknuune, name: 'wiktionary', ref: 'x' }] }))).toBe('medium');
  });

  it('says how many sources agree', () => {
    const e = entry({ source: wiktionary, attested_by: [tatoeba, maknuune] });
    expect(confidenceLabel(e)).toBe('✓ attested by 3 independent sources (not yet reviewed)');
    expect(confidenceLabel(entry({ source: wiktionary }))).toBe('⚠ unverified (one source)');
  });
});

describe('evidence that counts', () => {
  it('ignores attestations that do not say how they were made, and retired method versions', () => {
    expect(attestationCounts({ name: 'tatoeba' })).toBe(false);
    expect(attestationCounts({ ...tatoeba, method_version: 1 })).toBe(false); // parallel-corpus v1 was too loose
    expect(attestationCounts(tatoeba)).toBe(true);
    expect(confidenceOf(entry({ source: wiktionary, attested_by: [{ ...tatoeba, method_version: 1 }] }))).toBe('medium');
  });

  it('counts datasets in one independence group once', () => {
    const groups = sourceGroups({
      allowed: { lisan: { independence_group: 'birzeit-currasat' }, curras: { independence_group: 'birzeit-currasat' }, maknuune: { independence_group: 'maknuune' } },
    });
    const both = entry({ source: { kind: 'dataset', name: 'lisan' }, attested_by: [{ ...maknuune, name: 'curras' }] });
    expect(independentSourcesOf(both, groups)).toEqual(['birzeit-currasat']);
    expect(confidenceOf(both, groups)).toBe('medium');
    expect(confidenceOf({ ...both, attested_by: [...both.attested_by, maknuune] }, groups)).toBe('high');
  });

  it('uses the groups precomputed in the bundle', () => {
    const e = { ...entry({ source: wiktionary, attested_by: [tatoeba] }), independent_sources: ['wiktionary'] };
    expect(confidenceOf(e)).toBe('medium');
  });
});

describe('ranking by confidence', () => {
  it('puts words several sources agree on above single-source drafts', () => {
    const bundle = fixtureBundle();
    bundle.entries = bundle.entries.filter((e) => e.dialect !== 'ar-eg');
    bundle.entries.push(
      { id: 'ar-eg/a-single', ...entry({ word: 'هلقيتي', source: wiktionary }) },
      { id: 'ar-eg/b-double', ...entry({ word: 'دلوقتي', source: wiktionary, attested_by: [tatoeba] }) },
    );
    const ids = new Dictionary(bundle).express('now', { dialects: ['ar-eg'] })[0]!.items.map((m) => m.entry.id);
    expect(ids).toEqual(['ar-eg/b-double', 'ar-eg/a-single']);
  });
});
