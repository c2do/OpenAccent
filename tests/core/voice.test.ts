import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBriefing } from '../../src/core/briefing.js';
import { checkReply } from '../../src/core/check.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { CURRENT_MEMORY_VERSION, FileMemoryStore, MemorySchema, type Memory } from '../../src/core/memory/index.js';
import { describeVoice, observeMessage } from '../../src/core/voice.js';
import { fixtureBundle } from '../fixtures/bundle.js';

// دلوقتي expresses "now", which two other dialects in the fixture say differently (هسّع, هلّأ): it is diagnostic.
const bundle = fixtureBundle();
bundle.entries = bundle.entries.map((e) => (e.id === 'ar-eg/dilwaqti' ? { ...e, concept: 'now' } : e));
const dict = new Dictionary(bundle);
const fallahi = (extra: Record<string, unknown> = {}) =>
  MemorySchema.parse({ version: CURRENT_MEMORY_VERSION, profile: { dialect: 'ar-ps-fallahi' }, ...extra });
const learn = (memory: Memory, ...messages: string[]) => {
  let m = memory;
  for (const text of messages) m = { ...m, voice: observeMessage(dict, m, text, new Date('2026-09-29T12:00:00Z')) };
  return m;
};

describe('observeMessage', () => {
  it('counts words the dictionary files under one dialect, including behind clitics', () => {
    const m = learn(fallahi(), 'هسّع بجيك', 'ودلوقتي؟ دلوقتي يا زلمة');
    expect(m.voice.messages).toBe(2);
    expect(m.voice.dialects).toMatchObject({ 'ar-eg': 2 });
    expect(m.voice.own.find((o) => o.dialect === 'ar-eg')).toMatchObject({ count: 2 });
  });

  it('notices Arabizi, emoji and mixed scripts', () => {
    const m = learn(fallahi(), 'shu el akhbar 😂', 'كيفك bro');
    expect(m.voice).toMatchObject({ messages: 2, latin: 1, emoji: 1, mixed: 1 });
  });

  it('keeps counts only, never the message, and leaves the input memory alone', () => {
    const before = fallahi();
    const m = learn(before, 'رسالة خاصة جداً فيها أسرار');
    expect(JSON.stringify(m.voice)).not.toContain('أسرار');
    expect(before.voice.messages).toBe(0);
  });
});

describe('diagnostic words, not scarcity', () => {
  it('counts a word toward the dialect mix only when other dialects say its concept differently', () => {
    const egyptian = dict.getEntry('ar-eg/dilwaqti')!;
    expect(dict.isDiagnostic(egyptian)).toBe(true);
    // قنّ is filed under Fallahi alone, but no other dialect has a word for it yet: that proves nothing.
    expect(dict.isDiagnostic(dict.getEntry('ar-ps-fallahi/qinn')!)).toBe(false);
    const m = learn(fallahi(), 'قنّ فاضي');
    expect(m.voice.dialects).toEqual({});
    expect(m.voice.own).toEqual([{ word: 'قن', dialect: 'ar-ps-fallahi', count: 1 }]); // still the user's own word
  });

  it('needs at least two contrasting dialects, and none using the same word', () => {
    const b = fixtureBundle(); // here دلوقتي has no concept, so "now" is only contrasted by Fallahi and Madani for each other
    const d = new Dictionary(b);
    expect(d.isDiagnostic(d.getEntry('ar-ps-madani/halla')!)).toBe(false); // only Fallahi to contrast with
    const shared = fixtureBundle();
    shared.entries = shared.entries.map((e) => (e.id === 'ar-eg/dilwaqti' ? { ...e, word: 'هلّأ', concept: 'now' } : e));
    const s = new Dictionary(shared);
    expect(s.isDiagnostic(s.getEntry('ar-ps-madani/halla')!)).toBe(false); // Egyptian says it with the same word
  });

  it('compares only dialects of the same language', () => {
    const b = fixtureBundle();
    b.entries = b.entries.map((e) => (e.id === 'fr-fr/amour' ? { ...e, word: 'maintenant', concept: 'now' } : e));
    const d = new Dictionary(b);
    expect(d.isDiagnostic(d.getEntry('fr-fr/amour')!)).toBe(false); // Arabic words for "now" say nothing about French
  });

  it('trusts a word a reviewer marked distinctive', () => {
    const b = fixtureBundle();
    b.entries = b.entries.map((e) => (e.id === 'ar-ps-fallahi/qinn' ? { ...e, distinctive: true } : e));
    expect(new Dictionary(b).isDiagnostic(b.entries.find((e) => e.id === 'ar-ps-fallahi/qinn')!)).toBe(true);
  });
});

describe('describeVoice', () => {
  it('says nothing until there are a few messages', () => {
    expect(describeVoice(dict, learn(fallahi(), 'هسّع').voice)).toEqual([]);
  });

  it('describes the dialect mix, the user’s words, length and habits', () => {
    const m = learn(fallahi(), 'دلوقتي بجيك 😂', 'هسّع وبس 😂', 'دلوقتي؟ 😂');
    const text = describeVoice(dict, m.voice).join('\n');
    expect(text).toMatch(/learned from 3 messages/);
    expect(text).toMatch(/Egyptian \d+%/);
    expect(text).toMatch(/Words they use often: دلوقتي/);
    expect(text).toMatch(/short/);
    expect(text).toMatch(/emoji/);
  });
});

describe('several dialects', () => {
  it('does not flag words from a dialect the user also speaks', () => {
    expect(checkReply(dict, fallahi(), 'دلوقتي بجيك', 'ar-ps-fallahi').issues).toHaveLength(1);
    const both = fallahi({ profile: { dialect: 'ar-ps-fallahi', dialects: ['ar-eg'] } });
    expect(checkReply(dict, both, 'دلوقتي بجيك', 'ar-ps-fallahi').issues).toEqual([]);
  });

  it('does not flag a word the user keeps writing themselves', () => {
    const m = learn(fallahi(), 'دلوقتي بجيك', 'دلوقتي خلص');
    expect(checkReply(dict, m, 'دلوقتي بجيك', 'ar-ps-fallahi').issues).toEqual([]);
  });

  it('shows the other dialects and the learned voice in the briefing', () => {
    const m = learn(fallahi({ profile: { dialect: 'ar-ps-fallahi', dialects: ['ar-eg'] } }), 'هسّع', 'دلوقتي', 'دلوقتي جاي');
    const { text } = buildBriefing(dict, m);
    expect(text).toMatch(/\*\*Also speaks:\*\* Egyptian/);
    expect(text).toMatch(/How the user writes/);
  });
});

describe('observing is idempotent', () => {
  it('counts the same message once, however often it is sent', () => {
    const once = learn(fallahi(), 'دلوقتي بجيك');
    const twice = learn(fallahi(), 'دلوقتي بجيك', 'دلوقتي  بجيك ');
    expect(twice.voice).toEqual(once.voice);
    expect(twice.voice.messages).toBe(1);
    expect(twice.voice.recent).toHaveLength(1);
    expect(twice.voice.recent[0]).not.toContain('دلوقتي'); // a fingerprint, never the text
  });

  it('keeps only the last fingerprints', () => {
    const m = learn(fallahi(), ...Array.from({ length: 60 }, (_, i) => `رسالة ${i}`));
    expect(m.voice.messages).toBe(60);
    expect(m.voice.recent).toHaveLength(50);
  });
});

describe('FileMemoryStore.observe', () => {
  it('saves what it learns, and forget({ voice }) clears it', () => {
    const store = new FileMemoryStore(join(mkdtempSync(join(tmpdir(), 'oa-voice-')), 'memory.json'), { dictionary: dict });
    store.remember({ kind: 'profile', dialect: 'ar-ps-fallahi' });
    store.observe('دلوقتي بجيك');
    expect(store.read().voice.dialects).toEqual({ 'ar-eg': 1 });
    store.forget({ voice: true });
    expect(store.read().voice.messages).toBe(0);
    expect(store.read().profile.dialect).toBe('ar-ps-fallahi');
  });

  it('dedupes other dialects and drops the main one from them', () => {
    const store = new FileMemoryStore(join(mkdtempSync(join(tmpdir(), 'oa-voice-')), 'memory.json'), { dictionary: dict });
    store.remember({ kind: 'profile', dialect: 'ar-ps-fallahi', dialects: ['ar-eg', 'ar-eg', 'ar-ps-fallahi'] });
    expect(store.read().profile.dialects).toEqual(['ar-eg']);
  });
});
