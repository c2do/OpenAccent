import { describe, expect, it } from 'vitest';
import { buildDialectCard } from '../../src/core/card.js';
import { checkReply } from '../../src/core/check.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { MemorySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const bundle = fixtureBundle();
bundle.guides = {
  'ar-ps-fallahi': `# Fallahi\n\n## Creative writing\n\nVillage life, not caricature.\n\n## Common AI mistakes\n\n- Mixing dialects.\n`,
};
bundle.samples.push({
  ...bundle.samples[0]!,
  id: 'ar-ps-fallahi/song-line',
  title: 'A song line',
  purpose: 'song',
  turns: [
    { from: 'user', text: 'يا زيتونة' },
    { from: 'reply', text: 'يا حاكورة الدار' },
  ],
});
const dict = new Dictionary(bundle);
const empty = MemorySchema.parse({ version: 1 });

describe('buildDialectCard', () => {
  it('includes purpose rules, core words, guide sections and examples', () => {
    const card = buildDialectCard(dict, 'ar-ps-fallahi', 'story');
    expect(card).toContain('# Dialect card: Fallahi');
    expect(card).toContain('## Writing for: story');
    expect(card).toContain('Give each character one dialect');
    expect(card).toContain('- now: هسّع ✓ / الحين');
    expect(card).toContain('## Creative writing\nVillage life, not caricature.');
    expect(card).toContain('## Common AI mistakes');
    expect(card).toMatch(/drafts that native speakers have not verified/);
  });

  it('prefers samples written for the same purpose', () => {
    const song = buildDialectCard(dict, 'ar-ps-fallahi', 'song');
    expect(song.indexOf('A song line')).toBeLessThan(song.indexOf('Where are you?'));
  });

  it('shows how words are said in scripts', () => {
    expect(buildDialectCard(dict, 'ar-ps-fallahi-tshaf', 'script')).toContain('كيف → said تشيف');
    expect(buildDialectCard(dict, 'ar-ps-fallahi-tshaf', 'story')).not.toContain('→ said');
  });

  it('rejects unknown dialects helpfully', () => {
    expect(() => buildDialectCard(dict, 'xx-yy')).toThrow(/openaccent_list_dialects/);
  });
});

describe('checkReply purposes', () => {
  it('lets scripts spell words as spoken', () => {
    expect(checkReply(dict, empty, 'تشيف حالك', 'ar-ps-fallahi-tshaf').issues).toHaveLength(1);
    expect(checkReply(dict, empty, 'تشيف حالك', 'ar-ps-fallahi-tshaf', { purpose: 'script' }).issues).toEqual([]);
  });

  it('lets songs and stories use rare words, but still flags other dialects', () => {
    expect(checkReply(dict, empty, 'delve', 'en-us-general').issues).toHaveLength(1);
    expect(checkReply(dict, empty, 'delve', 'en-us-general', { purpose: 'song' }).issues).toEqual([]);
    expect(checkReply(dict, empty, 'دلوقتي', 'ar-ps-fallahi', { purpose: 'song' }).issues[0]?.kind).toBe('other_dialect');
  });
});
