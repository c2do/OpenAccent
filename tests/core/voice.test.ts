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

const dict = new Dictionary(fixtureBundle());
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
    const m = learn(fallahi({ profile: { dialect: 'ar-ps-fallahi', dialects: ['ar-eg'] } }), 'هسّع', 'دلوقتي', 'دلوقتي');
    const { text } = buildBriefing(dict, m);
    expect(text).toMatch(/\*\*Also speaks:\*\* Egyptian/);
    expect(text).toMatch(/How the user writes/);
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
