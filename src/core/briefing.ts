import type { Dictionary } from './dictionary.js';
import { mergedGuide } from './guides.js';
import type { Memory } from './schema.js';

export interface Briefing {
  onboarding: boolean;
  dialect?: string;
  profile: Memory['profile'];
  words: Memory['words'];
  corrections: Memory['corrections'];
  style: Memory['style'];
  /** Markdown for the model to read. */
  text: string;
}

function onboardingText(dict: Dictionary, problem?: string): string {
  const dialects = dict
    .listDialects()
    .filter((d) => d.entries > 0 || d.status === 'active')
    .map((d) => `- ${d.id}: ${d.name.en}${d.name.ar ? ` (${d.name.ar})` : ''}, ${d.entries} entries`)
    .join('\n');
  return [
    '# OpenAccent: no profile yet',
    problem ?? '',
    'Ask the user, in a short natural way, which dialect they speak and (optionally) their town or village.',
    'Then save it with `openaccent_remember` (kind: "profile", dialect: <id>, region: <text>), and call `openaccent_get_briefing` again.',
    '',
    'Dialects with data:',
    dialects,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

/** Everything the model should know at the start of a conversation, in one call. */
export function buildBriefing(dict: Dictionary, memory: Memory): Briefing {
  const base = {
    profile: memory.profile,
    words: memory.words,
    corrections: memory.corrections,
    style: memory.style,
  };
  const dialectId = memory.profile.dialect;
  if (!dialectId) return { ...base, onboarding: true, text: onboardingText(dict) };
  const dialect = dict.getDialect(dialectId);
  if (!dialect) {
    const problem = `The saved profile dialect "${dialectId}" is not in the dictionary anymore.`;
    return { ...base, onboarding: true, text: onboardingText(dict, problem) };
  }

  const lines: string[] = [];
  lines.push(`# Talking with this user`);
  lines.push(
    `**Dialect:** ${dialect.name.en}${dialect.name.ar ? ` (${dialect.name.ar})` : ''} — \`${dialect.id}\`${
      memory.profile.region ? ` · **Region:** ${memory.profile.region}` : ''
    }`,
  );
  if (memory.profile.notes) lines.push(`**Notes:** ${memory.profile.notes}`);
  lines.push('Stay in this dialect for the whole conversation. Tools default to it.');

  if (memory.words.length || memory.corrections.length || memory.style.length) {
    lines.push('', '## The user’s own words (these override the dictionary and the guide)');
    for (const w of memory.words) {
      lines.push(`- Says **${w.say}**${w.instead_of ? ` instead of ${w.instead_of}` : ''}${w.meaning ? ` (${w.meaning})` : ''}`);
    }
    for (const c of memory.corrections) {
      lines.push(`- Correction: ${c.wrong} → ${c.right}${c.context ? ` (${c.context})` : ''}`);
    }
    for (const s of memory.style) lines.push(`- Style: ${s.text}`);
  }

  const guide = mergedGuide(dict, dialect.id);
  if (guide.guides.length) {
    const drafts = guide.guides.filter((g) => g.status === 'draft').map((g) => g.dialect);
    lines.push('', '## Dialect guide');
    if (drafts.length) {
      lines.push(`_Parts of this guide are draft (not yet verified by native speakers): ${drafts.join(', ')}._`);
    }
    for (const [heading, parts] of Object.entries(guide.sections)) {
      lines.push('', `### ${heading}`);
      for (const p of parts) lines.push(parts.length > 1 ? `_(${p.dialect})_\n${p.body}` : p.body);
    }
  }

  lines.push(
    '',
    '## How to use OpenAccent',
    '- Unsure about a word? `openaccent_lookup` (word → meaning) or `openaccent_express` (meaning → word).',
    '- Before sending a reply in dialect, run `openaccent_check_reply` on it.',
    '- When the user corrects your dialect, save it with `openaccent_remember` right away.',
  );

  return { ...base, onboarding: false, dialect: dialect.id, text: lines.join('\n') };
}

/** One short line appended to every tool result, so the model knows the user even if it skipped the briefing. */
export function profileFooter(memory: Memory): string {
  const dialect = memory.profile.dialect;
  if (!dialect) return '👤 No OpenAccent profile yet: call openaccent_get_briefing.';
  const latest = memory.corrections
    .slice(-3)
    .reverse()
    .map((c) => `${c.wrong}→${c.right}`)
    .join(', ');
  const line = `👤 User dialect: ${dialect}${latest ? ` · corrections: ${latest}` : ''} · personal words override the dictionary`;
  return line.length < 200 ? line : `${line.slice(0, 196)}…`;
}
