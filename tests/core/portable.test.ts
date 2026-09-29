import { describe, expect, it } from 'vitest';
import { Dictionary } from '../../src/core/dictionary.js';
import { buildPortablePrompt } from '../../src/core/portable.js';
import { MemorySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const bundle = fixtureBundle();
bundle.guides = {
  'ar-ps-fallahi': `# Fallahi\n\n## Common AI mistakes\n\n- **Writing the pronunciation**: "تشيف" in text. Write كيف.\n- **Gulf/Egyptian words**: دلوقتي، وايد.\n`,
};
const dict = new Dictionary(bundle);
const now = '2026-09-29T12:00:00.000Z';
const empty = MemorySchema.parse({ version: 1 });

describe('buildPortablePrompt', () => {
  it('names the dialect and includes core words, mistakes and an example', () => {
    const text = buildPortablePrompt(dict, empty, 'ar-ps-fallahi');
    expect(text).toContain('Talk to me in Fallahi');
    expect(text).toContain('Everyday words: now = هسّع/الحين');
    expect(text).toContain('Avoid: Writing the pronunciation: "تشيف" in text; Gulf/Egyptian words: دلوقتي، وايد');
    expect(text).toContain('Example: "وينك؟" → "هسّع جاي"');
  });

  it('puts the user’s own words first after the header', () => {
    const memory = MemorySchema.parse({
      version: 1,
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
    expect(text).toContain('Talk to me in');
    expect(text).not.toContain('Example:');
  });

  it('rejects an unknown dialect', () => {
    expect(() => buildPortablePrompt(dict, empty, 'xx-yy')).toThrow(/Unknown dialect/);
  });
});
