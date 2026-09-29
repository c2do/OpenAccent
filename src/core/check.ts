import type { BundledEntry } from './bundle.js';
import type { Dictionary } from './dictionary.js';
import { normalize } from './normalize.js';
import type { Memory } from './schema.js';

export type IssueKind = 'correction' | 'personal_word' | 'pronunciation' | 'other_dialect' | 'rare' | 'dated';

export interface ReplyIssue {
  /** The words as they appear in the reply. */
  text: string;
  kind: IssueKind;
  reason: string;
  suggestion?: string;
}

export interface CheckResult {
  dialect: string;
  issues: ReplyIssue[];
  verdict: string;
}

const MAX_NGRAM = 3;

/**
 * Word-level check of a draft reply against the user's dialect and personal memory.
 * Needs no conversation state and no model call. It cannot judge grammar or tone.
 */
export function checkReply(dict: Dictionary, memory: Memory, text: string, dialect: string): CheckResult {
  const branch = dict.branch(dialect);
  const script = dict.getDialect(dialect)?.script ?? 'arab';
  // Keep each word as written (for display) next to its normalized form (for matching).
  const pairs = text
    .split(/\s+/)
    .map((raw) => ({ raw: raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}\u064B-\u065F\u0670]+$/gu, ''), norm: normalize(raw, script) }))
    .filter((p) => p.norm && !p.norm.includes(' '));
  const words = pairs.map((p) => p.norm);
  const surface = (i: number, n: number) => pairs.slice(i, i + n).map((p) => p.raw).join(' ');
  const issues: ReplyIssue[] = [];
  const covered = new Array<boolean>(words.length).fill(false);

  const corrections = new Map(memory.corrections.map((c) => [normalize(c.wrong, script), c]));
  const replaced = new Map(
    memory.words.filter((w) => w.instead_of).map((w) => [normalize(w.instead_of!, script), w]),
  );
  const ownWords = new Set(memory.words.map((w) => normalize(w.say, script)));

  const bestSuggestion = (entries: BundledEntry[]) => {
    const own = entries.find((e) => ownWords.has(normalize(e.word, script)));
    const pick = own ?? entries.find((e) => e.familiarity === 'common') ?? entries[0];
    return pick?.word;
  };

  const inspect = (form: string): ReplyIssue | undefined => {
    const correction = corrections.get(form);
    if (correction) {
      return { text: form, kind: 'correction', reason: 'The user corrected this before.', suggestion: correction.right };
    }
    const personal = replaced.get(form);
    if (personal) {
      return { text: form, kind: 'personal_word', reason: `The user says "${personal.say}" instead.`, suggestion: personal.say };
    }
    if (ownWords.has(form)) return undefined;

    const entries = dict.findByForm(form, script);
    if (entries.length === 0) return undefined;
    const mine = entries.filter((e) => branch.includes(e.dialect));

    if (mine.length > 0) {
      // Written the way it's pronounced (e.g. تشيف for كيف)?
      const spoken = mine.find(
        (e) => e.pronunciation?.simple && normalize(e.pronunciation.simple, script) === form && normalize(e.word, script) !== form,
      );
      if (spoken) {
        return {
          text: form,
          kind: 'pronunciation',
          reason: 'This is how the word sounds; people write it differently.',
          suggestion: spoken.word,
        };
      }
      // In the dialect, but rare or old-fashioned?
      if (mine.every((e) => e.familiarity === 'rare' || e.familiarity === 'dated')) {
        const e = mine[0]!;
        const alternatives = e.related
          .map((id) => dict.getEntry(id))
          .filter((r): r is BundledEntry => Boolean(r) && branch.includes(r!.dialect) && r!.familiarity === 'common');
        return {
          text: form,
          kind: e.familiarity as 'rare' | 'dated',
          reason: e.familiarity === 'rare' ? 'People rarely say this.' : 'This sounds old-fashioned.',
          ...(alternatives[0] ? { suggestion: alternatives[0].word } : {}),
        };
      }
      return undefined;
    }

    // Only in other dialects. Flag it only when the user's dialect has its own word for it.
    for (const other of entries) {
      const equivalents = dict.equivalentsIn(other, dialect);
      if (equivalents.length > 0) {
        const name = dict.getDialect(other.dialect)?.name.en ?? other.dialect;
        return {
          text: form,
          kind: 'other_dialect',
          reason: `This is ${name}, not the user's dialect.`,
          ...(bestSuggestion(equivalents) ? { suggestion: bestSuggestion(equivalents)! } : {}),
        };
      }
    }
    return undefined;
  };

  // Longest phrases first, so "ولا إشي" is checked as one unit before its words.
  for (let n = MAX_NGRAM; n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      if (covered.slice(i, i + n).some(Boolean)) continue;
      const form = words.slice(i, i + n).join(' ');
      const known = n === 1 || dict.findByForm(form, script).length > 0 || corrections.has(form) || replaced.has(form);
      if (!known) continue;
      const found = inspect(form);
      if (found || n > 1) covered.fill(true, i, i + n);
      const issue = found && { ...found, text: surface(i, n) };
      if (issue && !issues.some((x) => x.text === issue.text)) issues.push(issue);
    }
  }

  const verdict =
    issues.length === 0
      ? 'OK: no dialect problems found at the word level.'
      : `${issues.length} word(s) to reconsider before sending.`;
  return { dialect, issues, verdict };
}
