import { describe, expect, it } from 'vitest';
import { checkReply } from '../../src/core/check.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { CURRENT_MEMORY_VERSION } from '../../src/core/memory/index.js';
import { MemorySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const dict = new Dictionary(fixtureBundle());
const empty = MemorySchema.parse({ version: CURRENT_MEMORY_VERSION, profile: { dialect: 'ar-ps-fallahi' } });
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

  it('reports where each issue is in the reply', () => {
    const text = 'طيب، دلوقتي بجيك';
    const r = checkReply(dict, empty, text, 'ar-ps-fallahi');
    expect(r.issues).toEqual([expect.objectContaining({ text: 'دلوقتي', start: 5, end: 11 })]);
    expect(text.slice(r.issues[0]!.start, r.issues[0]!.end)).toBe('دلوقتي');
  });

  it('reports every occurrence, in order', () => {
    const r = checkReply(dict, empty, 'دلوقتي؟ آه دلوقتي', 'ar-ps-fallahi');
    expect(r.issues.map((i) => [i.start, i.end])).toEqual([[0, 6], [11, 17]]);
  });

  it('finds words behind Arabic clitics (و، ف، ب، ل، ك، ال)', () => {
    const text = 'وهلّأ بجيك';
    const r = checkReply(dict, empty, text, 'ar-ps-fallahi');
    expect(r.issues).toEqual([expect.objectContaining({ text: 'هلّأ', start: 1, end: 5, kind: 'other_dialect' })]);
    expect(checkReply(dict, empty, 'فدلوقتي', 'ar-ps-fallahi').issues[0]).toMatchObject({ text: 'دلوقتي', start: 1 });
  });

  it('prefers the whole word to a clitic reading', () => {
    // الحين is a fallahi word; it must not be read as ال + حين.
    const r = checkReply(dict, empty, 'الحين بجيك', 'ar-ps-fallahi');
    expect(r.issues).toEqual([]);
  });

  it('checks phrases as long as the longest one in the dictionary', () => {
    expect(dict.maxPhraseTokens).toBeGreaterThanOrEqual(6);
    const text = 'Well, at the end of the day, it works';
    const r = checkReply(dict, empty, text, 'en-us-general');
    expect(r.issues).toEqual([expect.objectContaining({ text: 'at the end of the day', kind: 'dated', start: 6, end: 27 })]);
  });

  it('checks long phrases from the user’s memory too', () => {
    const memory = MemorySchema.parse({
      ...empty,
      corrections: [{ id: 'c1', wrong: 'على قد ما بتقدر يا زلمة', right: 'قد ما بتقدر', created_at: now }],
    });
    const r = checkReply(dict, memory, 'اعمل على قد ما بتقدر يا زلمة', 'ar-ps-fallahi');
    expect(r.issues).toEqual([expect.objectContaining({ kind: 'correction', text: 'على قد ما بتقدر يا زلمة' })]);
  });

  it('flags a word that is vulgar or offensive in every sense, in chat', () => {
    const r = checkReply(dict, empty, 'يا شرموطة', 'ar-ps-fallahi');
    expect(r.issues).toEqual([expect.objectContaining({ text: 'شرموطة', kind: 'sensitive' })]);
    expect(r.issues[0]!.reason).toMatch(/offensive, sexual.*unless the user does/);
  });

  it('lets stories, songs and scripts swear, but never use a slur unprompted', () => {
    expect(checkReply(dict, empty, 'يا شرموطة', 'ar-ps-fallahi', { purpose: 'story' }).issues).toEqual([]);
    const slurDict = new Dictionary({
      ...fixtureBundle(),
      entries: [...fixtureBundle().entries, { ...fixtureBundle().entries[0]!, id: 'ar-eg/slur', dialect: 'ar-eg', word: 'عبد', spellings: [], meanings: [{ en: 'a slur', examples: [], sensitive: ['slur'] }] }],
    });
    expect(checkReply(slurDict, empty, 'عبد', 'ar-ps-fallahi', { purpose: 'song' }).issues[0]?.kind).toBe('sensitive');
  });
});
