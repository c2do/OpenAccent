import { describe, expect, it } from 'vitest';
import { checkReply } from '../../src/core/check.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { MemorySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const dict = new Dictionary(fixtureBundle());
const empty = MemorySchema.parse({ version: 1, profile: { dialect: 'ar-ps-fallahi' } });
const now = '2026-09-29T12:00:00.000Z';

describe('checkReply', () => {
  it('flags a word from another dialect when the user’s dialect has its own word', () => {
    const r = checkReply(dict, empty, 'دلوقتي بجيك', 'ar-ps-fallahi');
    expect(r.issues).toEqual([
      expect.objectContaining({ text: 'دلوقتي', kind: 'other_dialect', suggestion: 'هسّع' }),
    ]);
  });

  it('suggests the user’s own word when they have one', () => {
    const memory = MemorySchema.parse({
      ...empty,
      words: [{ id: 'w1', say: 'الحين', meaning: 'now', created_at: now }],
    });
    const r = checkReply(dict, memory, 'هلّأ بجيك', 'ar-ps-fallahi');
    expect(r.issues[0]).toMatchObject({ kind: 'other_dialect', suggestion: 'الحين' });
  });

  it('does not flag shared words in the user’s branch', () => {
    const r = checkReply(dict, empty, 'زلمة منيح', 'ar-ps-fallahi');
    expect(r.issues).toEqual([]);
    expect(r.verdict).toMatch(/^OK/);
  });

  it('flags words the user corrected, and words they replaced', () => {
    const memory = MemorySchema.parse({
      ...empty,
      words: [{ id: 'w1', say: 'هسّا', instead_of: 'هسّع', created_at: now }],
      corrections: [{ id: 'c1', wrong: 'كويس', right: 'منيح', created_at: now }],
    });
    const r = checkReply(dict, memory, 'كويس، هسّع بجيك', 'ar-ps-fallahi');
    // Words are reported as written, not in their normalized search form.
    expect(r.issues).toEqual([
      expect.objectContaining({ text: 'كويس', kind: 'correction', suggestion: 'منيح' }),
      expect.objectContaining({ text: 'هسّع', kind: 'personal_word', suggestion: 'هسّا' }),
    ]);
  });

  it('flags writing a word the way it is pronounced, in the speaker’s own dialect', () => {
    const r = checkReply(dict, empty, 'تشيف حالك', 'ar-ps-fallahi-tshaf');
    expect(r.issues[0]).toMatchObject({ text: 'تشيف', kind: 'pronunciation', suggestion: 'كيف' });
    expect(r.issues[0]?.reason).toMatch(/how the word sounds/);
  });

  it('flags another variety’s pronunciation for a kaf speaker', () => {
    const r = checkReply(dict, empty, 'تشيف حالك', 'ar-ps-fallahi-kaf');
    expect(r.issues[0]).toMatchObject({ text: 'تشيف', kind: 'pronunciation', suggestion: 'كيف' });
    expect(r.issues[0]?.reason).toMatch(/Fallahi tshaf speakers/);
  });

  it('flags rare words and suggests a common alternative (English)', () => {
    const r = checkReply(dict, empty, "Let's delve into it", 'en-us-general');
    expect(r.issues).toEqual([expect.objectContaining({ text: 'delve', kind: 'rare', suggestion: 'dig into' })]);
  });

  it('checks multi-word phrases as one unit', () => {
    const r = checkReply(dict, empty, 'hey you guys', 'en-us-south');
    expect(r.issues[0]).toMatchObject({ text: 'you guys', kind: 'other_dialect', suggestion: "y'all" });
  });
});
