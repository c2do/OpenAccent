import type { BundledEntry } from '../core/bundle.js';
import type { Match } from '../core/dictionary.js';
import type { EntryData } from '../core/results.js';

const statusLabel = (e: BundledEntry) =>
  e.status === 'verified' ? '✓ verified' : e.status === 'disputed' ? '⚠ disputed' : '⚠ unverified (draft)';

/** Markdown for one entry, as the model will read it. */
export function formatEntry(e: BundledEntry, extra = ''): string {
  const lines = [`**${e.word}** — \`${e.id}\` · ${statusLabel(e)}${extra}`];
  for (const m of e.meanings) {
    const warning = m.sensitive.length ? ` ⚠ ${m.sensitive.join(', ')}: never use it unless the user does` : '';
    lines.push(`- ${[m.en, m.ar].filter(Boolean).join(' / ')}${warning}`);
    for (const ex of m.examples) lines.push(`  - e.g. ${ex.text}${ex.en ? ` (${ex.en})` : ''}`);
  }
  const facts = [
    e.pronunciation?.simple ? `pronounced: ${e.pronunciation.simple}` : '',
    e.familiarity !== 'common' ? `familiarity: ${e.familiarity}` : '',
    e.register !== 'neutral' ? `register: ${e.register}` : '',
  ].filter(Boolean);
  if (facts.length) lines.push(`- ${facts.join(' · ')}`);
  if (e.notes) lines.push(`- note: ${e.notes}`);
  return lines.join('\n');
}

export function formatMatch(m: Match): string {
  return formatEntry(m.entry, m.inherited ? ` · from ${m.entry.dialect}` : '');
}

/** Structured form of an entry for structuredContent. */
export function entryData(e: BundledEntry): EntryData {
  return {
    id: e.id,
    word: e.word,
    dialect: e.dialect,
    status: e.status,
    familiarity: e.familiarity,
    register: e.register,
    meanings: e.meanings,
    ...(e.pronunciation ? { pronunciation: e.pronunciation } : {}),
    spellings: e.spellings,
    romanized: e.romanized,
    related: e.related,
    ...(e.notes ? { notes: e.notes } : {}),
  };
}
