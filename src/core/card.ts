import type { Dictionary } from './dictionary.js';
import { mergedGuide } from './guides.js';
import type { Purpose } from './schema.js';

/**
 * A "dialect card": everything a writer needs to voice a character in a dialect — independent
 * of the user's own profile, so one story can have characters from five countries.
 */
const PURPOSE_RULES: Record<Purpose, string[]> = {
  chat: [
    'Write the way people from here write in chat: their words, their spelling, their rhythm.',
    'Stay in this dialect for the whole conversation, and don’t overdo slang.',
  ],
  story: [
    'Narration may stay in the story’s main language; dialogue is in the character’s dialect.',
    'Give each character one dialect and keep it in every line. Two characters from different places should sound different.',
    'Dialect is identity, not a joke: no caricature, no stuffing every line with slang.',
    'Older or rare words are fine when they fit the character (e.g. a grandmother).',
  ],
  song: [
    'Rhyme and rhythm with the dialect’s own words; never borrow another dialect’s word for a rhyme.',
    'Poetic, older and rare words are welcome if they belong to this dialect.',
    'Keep the pronoun and verb forms of the dialect consistent across verses.',
  ],
  script: [
    'Lines are written to be spoken: spell words the way they are said (the "pronounced" forms below) so actors or voice engines say them right.',
    'Keep each character’s dialect and register the same across every scene.',
    'Short, natural lines; people interrupt, repeat and use fillers.',
  ],
  game: [
    'Each NPC has one dialect and keeps the same words for the same things in every line (players notice).',
    'Keep lines short; use the dialect’s greetings, reactions and fillers for flavour.',
    'No caricature: regional speech should feel like home to players from that place.',
  ],
};

export function buildDialectCard(dict: Dictionary, dialectId: string, purpose: Purpose = 'story'): string {
  const dialect = dict.getDialect(dialectId);
  if (!dialect) throw new Error(`Unknown dialect "${dialectId}". Use openaccent_list_dialects to see all dialects.`);
  const lines: string[] = [];
  lines.push(`# Dialect card: ${dialect.name.en}${dialect.name.ar ? ` (${dialect.name.ar})` : ''} — \`${dialect.id}\``);
  if (dialect.region) lines.push(`Where: ${dialect.region.en}`);
  lines.push('', `## Writing for: ${purpose}`, ...PURPOSE_RULES[purpose].map((r) => `- ${r}`));

  const core = dict.coreWords(dialect.id).slice(0, 60);
  if (core.length) {
    lines.push('', '## Core words');
    for (const c of core) {
      const words = c.entries.slice(0, 3).map((e) => {
        const said = purpose === 'script' && e.pronunciation?.simple ? ` → said ${e.pronunciation.simple}` : '';
        return `${e.word}${said}${e.status === 'verified' ? ' ✓' : ''}${e.register === 'vulgar' ? ' (vulgar)' : ''}`;
      });
      lines.push(`- ${c.gloss}: ${words.join(' / ')}`);
    }
  }

  const guide = mergedGuide(dict, dialect.id);
  const wanted = ['Pronunciation', 'Creative writing', 'Common AI mistakes', 'Grammar & markers'];
  for (const heading of wanted) {
    const parts = guide.sections[heading];
    if (!parts?.length) continue;
    lines.push('', `## ${heading}`);
    for (const p of parts) lines.push(parts.length > 1 ? `_(${p.dialect})_\n${p.body}` : p.body);
  }

  const samples = dict.samplesFor(dialect.id, 3, purpose);
  if (samples.length) {
    lines.push('', '## Examples');
    for (const s of samples) {
      lines.push('', `**${s.title}**${s.status === 'verified' ? ' ✓' : ' _(draft)_'}`);
      for (const t of s.turns) lines.push(`> ${t.from === 'user' ? 'A' : 'B'}: ${t.text}`);
    }
  }
  if (guide.guides.some((g) => g.status === 'draft') || core.some((c) => c.entries.some((e) => e.status !== 'verified'))) {
    lines.push('', '_Parts of this card are drafts that native speakers have not verified yet._');
  }
  lines.push('', 'Check lines with openaccent_check_reply (pass this dialect and purpose) before finalising.');
  return lines.join('\n');
}
