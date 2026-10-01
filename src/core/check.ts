export type { CheckResult, IssueKind, ReplyIssue } from './results.js';
import type { BundledEntry } from './bundle.js';
import { isFullySensitive } from './dictionary.js';
import type { Dictionary } from './dictionary.js';
import { languageOf } from './normalize.js';
import type { CheckResult, ReplyIssue } from './results.js';
import type { Memory, Purpose } from './schema.js';
import { readings, tokenize } from './tokenize.js';

/**
 * Word-level check of a draft reply against the user's dialect and personal memory.
 * Needs no conversation state and no model call. It cannot judge grammar or tone.
 */
export function checkReply(
  dict: Dictionary,
  memory: Memory,
  text: string,
  dialect: string,
  opts: { purpose?: Purpose } = {},
): CheckResult {
  const purpose = opts.purpose ?? 'chat';
  // Someone who speaks several dialects: words from any of them are theirs, not mistakes.
  const also = dialect === memory.profile.dialect ? memory.profile.dialects.filter((d) => dict.getDialect(d)) : [];
  const branch = [...new Set([dialect, ...also].flatMap((d) => dict.branch(d)))];
  const norm = dict.normalizer(dialect);
  const script = dict.getDialect(dialect)?.script ?? 'arab';
  const language = languageOf(dialect);
  const tokens = tokenize(text)
    .map((t) => ({ ...t, norm: norm(t.surface) }))
    .filter((t) => t.norm && !t.norm.includes(' '));
  const issues: ReplyIssue[] = [];
  const covered = new Array<boolean>(tokens.length).fill(false);

  const corrections = new Map(memory.corrections.map((c) => [norm(c.wrong), c]));
  const replaced = new Map(
    memory.words.filter((w) => w.instead_of).map((w) => [norm(w.instead_of!), w]),
  );
  const ownWords = new Set(memory.words.map((w) => norm(w.say)));
  // Words the user keeps writing themselves are theirs too (learned from their messages).
  for (const o of memory.voice.own) if (o.count >= 2) ownWords.add(o.word);
  // Hand-kept "not this dialect" markers of the user's dialect and its ancestors (see DialectSchema.avoid),
  // minus words from dialects the user also speaks.
  const avoid = new Map<string, { word: string; from: string; use: string[] }>();
  for (const d of dict.branch(dialect)) {
    for (const a of dict.getDialect(d)?.avoid ?? []) {
      const key = norm(a.word);
      if (!branch.includes(a.from) && !avoid.has(key)) avoid.set(key, a);
    }
  }
  const known = (form: string) =>
    corrections.has(form) || replaced.has(form) || ownWords.has(form) || avoid.has(form) || dict.findByForm(form, dialect).length > 0;
  const sourceName = (from: string) => (from === 'msa' ? 'Modern Standard Arabic' : (dict.getDialect(from)?.name.en ?? from));

  const bestSuggestion = (entries: BundledEntry[]) => {
    const own = entries.find((e) => ownWords.has(norm(e.word)));
    const pick = own ?? entries.find((e) => e.familiarity === 'common') ?? entries[0];
    return pick?.word;
  };

  const inspect = (form: string): Omit<ReplyIssue, 'start' | 'end'> | undefined => {
    const correction = corrections.get(form);
    if (correction) {
      return { text: form, kind: 'correction', reason: 'The user corrected this before.', suggestion: correction.right };
    }
    const personal = replaced.get(form);
    if (personal) {
      return { text: form, kind: 'personal_word', reason: `The user says "${personal.say}" instead.`, suggestion: personal.say };
    }
    if (ownWords.has(form)) return undefined;

    const entries = dict.findByForm(form, dialect);
    // The user's dialect, its ancestors, and its sub-dialects (a Jordanian word is Levantine too).
    const mine = entries.filter((e) => branch.includes(e.dialect) || dict.branch(e.dialect).includes(dialect));
    const avoided = avoid.get(form);
    if (avoided && mine.length === 0) {
      const use = avoided.use.find((u) => ownWords.has(norm(u))) ?? avoided.use[0];
      return {
        text: form,
        kind: 'other_dialect',
        reason: `This is ${sourceName(avoided.from)}, not the user's dialect.`,
        ...(use ? { suggestion: use } : {}),
      };
    }
    if (entries.length === 0) return undefined;

    // Vulgar or offensive in every sense? Stories, songs and scripts may swear; nothing uses a slur unprompted.
    const relevant = mine.length > 0 ? mine : entries;
    if (relevant.every(isFullySensitive)) {
      const labels = [...new Set(relevant.flatMap((e) => e.meanings.flatMap((m) => m.sensitive)))].sort();
      const creative = purpose === 'story' || purpose === 'song' || purpose === 'script';
      if (!creative || labels.includes('slur')) {
        return {
          text: form,
          kind: 'sensitive',
          reason: `This word is ${labels.join(', ')}. Don't use it unless the user does.`,
        };
      }
    }
    const writtenInBranch = mine.some((e) => norm(e.word) === form);

    // Written the way it's pronounced (e.g. تشيف for كيف)? Wrong in any dialect's writing.
    const spoken = entries.find(
      (e) => e.pronunciation?.simple && norm(e.pronunciation.simple) === form && norm(e.word) !== form,
    );
    // Scripts are written to be spoken, so spelling words the way they sound is the point there.
    if (spoken && !writtenInBranch && purpose !== 'script') {
      const ownSound = branch.includes(spoken.dialect);
      return {
        text: form,
        kind: 'pronunciation',
        reason: ownSound
          ? 'This is how the word sounds; people write it differently.'
          : `This is how ${dict.getDialect(spoken.dialect)?.name.en ?? spoken.dialect} speakers say it, not the user's dialect, and it is written differently anyway.`,
        suggestion: spoken.word,
      };
    }

    if (mine.length > 0) {
      // In the dialect, but rare or old-fashioned?
      // Songs and stories may reach for old or rare words on purpose; chat and scripts should not.
      const allowOld = purpose === 'song' || purpose === 'story';
      if (!allowOld && mine.every((e) => e.familiarity === 'rare' || e.familiarity === 'dated')) {
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

    // Only in other dialects. The dictionary is incomplete, so that alone proves nothing (بس, والله,
    // الحين are said almost everywhere). Flag it only when native speakers verified both sides: a word
    // that gives its dialect away, and the user's dialect's own word for the same concept.
    for (const other of entries) {
      if (other.status !== 'verified' || !other.concept || !dict.isDiagnostic(other)) continue;
      const equivalents = dict
        .equivalentsIn(other, dialect)
        .filter((e) => e.status === 'verified' && e.concept === other.concept);
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

  // Look as far as the longest phrase the dictionary or the user's memory knows.
  const wordsIn = (s: string) => s.split(' ').length;
  const maxTokens = Math.max(dict.maxPhraseTokens, ...[...corrections.keys(), ...replaced.keys(), ...ownWords].map(wordsIn));

  // Longest phrases first, so "ولا إشي" is checked as one unit before its words.
  for (let n = Math.min(maxTokens, tokens.length); n >= 1; n--) {
    for (let i = 0; i + n <= tokens.length; i++) {
      if (covered.slice(i, i + n).some(Boolean)) continue;
      const first = tokens[i]!;
      const last = tokens[i + n - 1]!;
      const rest = tokens.slice(i + 1, i + n).map((t) => t.norm);
      // The words as written, then the first word without its clitics (وبالحاكورة → حاكورة).
      const candidates = [
        { form: [first.norm, ...rest].join(' '), start: first.start, end: last.end },
        ...readings(first, script, language)
          .filter((r) => n === 1 || r.end === first.end)
          .map((r) => ({ form: [norm(r.form), ...rest].join(' '), start: r.start, end: n === 1 ? r.end : last.end })),
      ];
      const match = candidates.find((c) => c.form && known(c.form));
      // A single word the dictionary doesn't know may still be a word the user corrected: nothing to check.
      if (!match) continue;
      covered.fill(true, i, i + n);
      const found = inspect(match.form);
      if (found) issues.push({ ...found, text: text.slice(match.start, match.end), start: match.start, end: match.end });
    }
  }
  issues.sort((a, b) => a.start - b.start);

  const verdict =
    issues.length === 0
      ? 'OK: no dialect problems found at the word level.'
      : `${issues.length} word(s) to reconsider before sending.`;
  return { dialect, issues, verdict };
}
