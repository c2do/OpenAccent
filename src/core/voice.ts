import { createHash } from 'node:crypto';
import type { Dictionary } from './dictionary.js';
import { MEMORY_LIMITS, type Memory } from './memory/types.js';
import { languageOf } from './normalize.js';
import { detectScript } from './script.js';
import { readings, tokenize } from './tokenize.js';

export type Voice = Memory['voice'];

const EMOJI = /\p{Extended_Pictographic}/u;

/**
 * Learns from one of the user's own messages: which dialects their words come from, the dialect
 * words they use, and how they write (Latin letters, emoji, mixed scripts). Only counts are kept,
 * never the message. Returns the updated voice; the input is not changed.
 */
/** A short fingerprint of a message (whitespace-insensitive), for telling a repeat from a new message. */
export const messageFingerprint = (text: string) =>
  createHash('sha256').update(text.normalize('NFC').replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 12);

export function observeMessage(dict: Dictionary, memory: Memory, text: string, now: Date = new Date()): Voice {
  const voice: Voice = structuredClone(memory.voice);
  const tokens = tokenize(text);
  if (tokens.length === 0) return voice;
  // Observing is idempotent: a message already counted (a retried or repeated tool call) changes nothing.
  const fingerprint = messageFingerprint(text);
  if (voice.recent.includes(fingerprint)) return voice;
  voice.recent = [...voice.recent, fingerprint].slice(-MEMORY_LIMITS.items.voiceRecent);

  const primary = memory.profile.dialect;
  const home = primary ? dict.getDialect(primary)?.script : undefined;
  const scripts = tokens.map((t) => detectScript(t.surface)).filter((s) => s !== 'zyyy');
  const latinShare = scripts.filter((s) => s === 'latn').length / Math.max(1, scripts.length);

  voice.messages += 1;
  voice.words += tokens.length;
  if (home && home !== 'latn' && latinShare > 0.5) voice.latin += 1;
  if (EMOJI.test(text)) voice.emoji += 1;
  if (new Set(scripts).size > 1) voice.mixed += 1;

  // A word the dictionary files under one dialect alone is the user's own word (never flagged once
  // they use it). It counts toward their dialect mix only if it is diagnostic: listed under one
  // dialect may just mean nobody added it to the others yet (see Dictionary.isDiagnostic).
  const norm = primary ? dict.normalizer(primary) : dict.normalizer('ar');
  const language = primary ? languageOf(primary) : 'ar';
  for (const token of tokens) {
    const script = detectScript(token.surface);
    const forms = [token.surface, ...readings(token, script, language).map((r) => r.form)];
    for (const form of forms) {
      const entries = dict.findByForm(form, primary ?? 'ar');
      if (entries.length === 0) continue;
      const dialects = new Set(entries.map((e) => e.dialect));
      if (dialects.size === 1) {
        const dialect = [...dialects][0]!;
        if (entries.some((e) => dict.isDiagnostic(e))) voice.dialects[dialect] = (voice.dialects[dialect] ?? 0) + 1;
        const word = norm(form);
        const own = voice.own.find((o) => o.word === word && o.dialect === dialect);
        if (own) own.count += 1;
        else voice.own.push({ word, dialect, count: 1 });
      }
      break;
    }
  }

  voice.own.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  voice.own = voice.own.slice(0, MEMORY_LIMITS.items.voiceOwn);
  const dialects = Object.entries(voice.dialects).sort((a, b) => b[1] - a[1]).slice(0, MEMORY_LIMITS.items.voiceDialects);
  voice.dialects = Object.fromEntries(dialects);
  voice.updated_at = now.toISOString();
  return voice;
}

/** How many times the user has written this (normalized) word, in any dialect. */
export function timesUsed(voice: Voice, word: string): number {
  return voice.own.filter((o) => o.word === word).reduce((n, o) => n + o.count, 0);
}

/** Enough messages to say something about how the user writes. */
export const MIN_MESSAGES = 3;

/** A few lines for the briefing: how the user writes, learned from their messages. */
export function describeVoice(dict: Dictionary, voice: Voice): string[] {
  if (voice.messages < MIN_MESSAGES) return [];
  const total = Object.values(voice.dialects).reduce((a, b) => a + b, 0);
  const lines = [`## How the user writes (learned from ${voice.messages} messages)`];
  if (total > 0) {
    const mix = Object.entries(voice.dialects)
      .slice(0, 3)
      .map(([d, n]) => `${dict.getDialect(d)?.name.en ?? d} ${Math.round((n / total) * 100)}%`)
      .join(', ');
    lines.push(`- Dialect words they use: ${mix}. Match this mix; don't "correct" it to one dialect.`);
  }
  const top = voice.own.filter((o) => o.count >= 2).slice(0, 12).map((o) => o.word);
  if (top.length) lines.push(`- Words they use often: ${top.join('، ')}. Use these, not other dialects' words for the same thing.`);
  const avg = Math.round(voice.words / voice.messages);
  lines.push(`- Messages are ${avg <= 8 ? 'short' : avg <= 25 ? 'medium length' : 'long'} (about ${avg} words): reply at a similar length.`);
  const share = (n: number) => n / voice.messages;
  if (share(voice.latin) >= 0.5) lines.push('- They usually write in Latin letters (Arabizi): reply the same way unless they switch.');
  if (share(voice.emoji) >= 0.3) lines.push('- They use emoji: a few are fine.');
  else if (voice.messages >= 5 && voice.emoji === 0) lines.push("- They don't use emoji: don't add any.");
  if (share(voice.mixed) >= 0.3) lines.push('- They mix in words from another language (English terms, for example): that is natural for them.');
  return lines;
}
