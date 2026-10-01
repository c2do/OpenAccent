import { describe, expect, it } from 'vitest';
import { Dictionary } from '../../src/core/dictionary.js';
import { buildPortablePrompt } from '../../src/core/portable.js';
import { CURRENT_MEMORY_VERSION } from '../../src/core/memory/index.js';
import { MemorySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const bundle = fixtureBundle();
bundle.guides = {
  'ar-ps-fallahi': `# Fallahi\n\n## Grammar & markers\n\n- Future: رح ("رح أروح"). Some villages use راح.\n- Want: بدّ + suffix ("بدّي").\n\n## Common AI mistakes\n\n- **Writing the pronunciation**: "تشيف" in text. Write كيف.\n- **Gulf/Egyptian words**: دلوقتي، وايد.\n`,
};
// "now" is said differently in Egyptian, so هسّع (verified) gives Fallahi away.
bundle.entries = bundle.entries.map((e) => (e.id === 'ar-eg/dilwaqti' ? { ...e, concept: 'now' } : e));
const dict = new Dictionary(bundle);
const now = '2026-09-29T12:00:00.000Z';
const empty = MemorySchema.parse({ version: CURRENT_MEMORY_VERSION });

describe('buildPortablePrompt', () => {
  it('opens conditionally and gives markers, words to avoid, an example and verified words', () => {
    const text = buildPortablePrompt(dict, empty, 'ar-ps-fallahi');
    expect(text).toMatch(/^When I write to you in Fallahi, or ask you to use it/);
    expect(text).toContain("don't drift into Modern Standard Arabic");
    expect(text).toContain('How it works: Future: رح ("رح أروح"); Want: بدّ + suffix ("بدّي").');
    expect(text).toContain('Never use: دلوقتي (say هسّع), هلّأ (say هسّع).');
    expect(text).toContain('Example: "وينك؟" → "هسّع جاي"');
    expect(text).toContain('Words that sound like home: now = هسّع.');
  });

  it('falls back to the guide’s mistakes when the dialect has no avoid list', () => {
    const b = fixtureBundle();
    b.guides = bundle.guides;
    b.dialects = b.dialects.map((x) => (x.id === 'ar-ps-fallahi' ? { ...x, avoid: [] } : x));
    expect(buildPortablePrompt(new Dictionary(b), empty, 'ar-ps-fallahi')).toContain('Avoid: Writing the pronunciation: "تشيف" in text; Gulf/Egyptian words: دلوقتي، وايد.');
  });

  it('leaves out words nobody verified, however many sources list them', () => {
    // الحين is a Fallahi draft for "now": not in the prompt.
    expect(buildPortablePrompt(dict, empty, 'ar-ps-fallahi')).not.toContain('الحين');
  });

  it('puts the user’s own words first after the header', () => {
    const memory = MemorySchema.parse({
      version: CURRENT_MEMORY_VERSION,
      profile: { region: 'قرى رام الله' },
      words: [{ id: 'w1', say: 'هسّا', instead_of: 'هلأ', created_at: now }],
      corrections: [{ id: 'c1', wrong: 'كويس', right: 'منيح', created_at: now }],
    });
    const lines = buildPortablePrompt(dict, memory, 'ar-ps-fallahi').split('\n');
    expect(lines[0]).toContain('from قرى رام الله');
    expect(lines[1]).toBe('My own words (always use these): say "هسّا" (not "هلأ"); "منيح" not "كويس".');
  });

  it('fits the character limit by dropping the lowest-priority parts first', () => {
    const text = buildPortablePrompt(dict, empty, 'ar-ps-fallahi', { maxChars: 300 });
    expect(text.length).toBeLessThanOrEqual(300);
    expect(text).toContain('When I write to you in');
    expect(text).not.toContain('Example:');
  });

  it('rejects an unknown dialect', () => {
    expect(() => buildPortablePrompt(dict, empty, 'xx-yy')).toThrow(/Unknown dialect/);
  });
});
