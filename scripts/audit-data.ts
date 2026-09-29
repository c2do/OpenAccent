/**
 * Data quality report, per dialect: how much there is, how much is verified, how many core
 * concepts are covered, and entries that look wrong. Use it to review an import before merging.
 *
 *   npm run audit                      # every dialect
 *   npm run audit -- --dialects es-mx,fr-fr
 *   npm run audit -- --data <folder>   # e.g. a worktree of an import branch
 *   npm run audit -- --strict          # exit 1 when a blocking problem is found
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Bundle, BundledEntry } from '../src/core/bundle.js';
import { buildBundle } from './build-data.js';
import { conceptFor, conceptIndex, WAVE_1 } from './import-wiktextract.js';
import { BARE_CLITICS, FUNCTION_POS, letterCount, sensitiveLabels } from './quality.js';

export type FindingKind = 'unlabeled_sensitive' | 'too_short' | 'function_word' | 'concept_mismatch' | 'crowded_concept';

/** Findings that must never reach main in unreviewed data. */
export const BLOCKING: FindingKind[] = ['unlabeled_sensitive', 'too_short'];

export interface Finding {
  kind: FindingKind;
  entry: string;
  word: string;
  detail: string;
}

export interface DialectAudit {
  dialect: string;
  entries: number;
  verified: number;
  /** Distinct core concepts this dialect's own entries cover. */
  concepts: number;
  /** Entries with at least one meaning labelled vulgar, sexual, offensive or slur. */
  sensitive: number;
  findings: Finding[];
}

const MAX_PER_CONCEPT = 3;

/** Unreviewed entries: drafts from a dataset or an AI. Reviewed ones are a person's decision. */
const unreviewed = (e: BundledEntry) => e.status !== 'verified' && e.source.kind !== 'reviewer';

export function auditBundle(bundle: Bundle, dialects?: string[]): DialectAudit[] {
  const concepts = conceptIndex(bundle.concepts ?? {});
  const keepFunctionWords = new Set(WAVE_1.filter((c) => c.keepFunctionWords).map((c) => c.dialect));
  const ids = dialects ?? bundle.dialects.map((d) => d.id);

  return ids.map((dialect) => {
    const own = bundle.entries.filter((e) => e.dialect === dialect);
    const findings: Finding[] = [];
    const add = (kind: FindingKind, e: BundledEntry, detail: string) => findings.push({ kind, entry: e.id, word: e.word, detail });

    for (const e of own) {
      if (!unreviewed(e)) continue;
      for (const m of e.meanings) {
        const needed = sensitiveLabels({ glosses: [m.en, m.ar].filter((g): g is string => Boolean(g)) });
        if (needed.length > 0 && m.sensitive.length === 0) add('unlabeled_sensitive', e, `looks ${needed.join('/')}: ${(m.en ?? m.ar ?? '').slice(0, 100)}`);
      }
      if (letterCount(e.word) < 2 || BARE_CLITICS.has(e.word)) add('too_short', e, 'a single letter or a bare clitic');
      if (e.part_of_speech && FUNCTION_POS.has(e.part_of_speech) && !e.concept && !keepFunctionWords.has(dialect)) {
        add('function_word', e, `part of speech: ${e.part_of_speech}`);
      }
      // Only imported entries were linked by the importer's rules; hand-written ones may gloss differently ("he said").
      if (e.concept && e.source.kind === 'dataset') {
        const main = e.meanings.find((m) => m.en)?.en;
        const linked = main ? conceptFor(e.word, { glosses: [main] }, WAVE_1[0]!, concepts, e.part_of_speech) : undefined;
        if (linked !== e.concept) add('concept_mismatch', e, `concept "${e.concept}", main meaning "${main ?? '—'}"`);
      }
    }

    const perConcept = new Map<string, BundledEntry[]>();
    for (const e of own) if (e.concept) perConcept.set(e.concept, [...(perConcept.get(e.concept) ?? []), e]);
    for (const [concept, list] of perConcept) {
      const drafts = list.filter(unreviewed);
      if (list.length > MAX_PER_CONCEPT && drafts.length > 0) add('crowded_concept', drafts[0]!, `${list.length} entries for "${concept}"`);
    }

    return {
      dialect,
      entries: own.length,
      verified: own.filter((e) => e.status === 'verified').length,
      concepts: perConcept.size,
      sensitive: own.filter((e) => e.meanings.some((m) => m.sensitive.length > 0)).length,
      findings,
    };
  });
}

export function renderAudit(audits: DialectAudit[], totalConcepts: number): string {
  const count = (a: DialectAudit, k: FindingKind) => a.findings.filter((f) => f.kind === k).length;
  const lines = [
    '# Data audit',
    '',
    '| Dialect | Entries | Verified | Core concepts | Labelled sensitive | Unlabelled sensitive | Too short | Function words | Concept mismatch | Crowded concepts |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...audits
      .filter((a) => a.entries > 0)
      .map(
        (a) =>
          `| ${a.dialect} | ${a.entries} | ${a.verified} | ${a.concepts}/${totalConcepts} | ${a.sensitive} | ${count(a, 'unlabeled_sensitive')} | ${count(a, 'too_short')} | ${count(a, 'function_word')} | ${count(a, 'concept_mismatch')} | ${count(a, 'crowded_concept')} |`,
      ),
  ];
  for (const a of audits) {
    if (a.findings.length === 0) continue;
    lines.push('', `## ${a.dialect}`);
    for (const f of a.findings) lines.push(`- **${f.kind}** \`${f.entry}\` ${f.word}: ${f.detail}`);
  }
  return `${lines.join('\n')}\n`;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const bundle = buildBundle(arg('data') ?? join(process.cwd(), 'data'), { validate: false });
  const audits = auditBundle(bundle, arg('dialects')?.split(','));
  console.log(renderAudit(audits, Object.keys(bundle.concepts ?? {}).length));
  const blocking = audits.flatMap((a) => a.findings).filter((f) => BLOCKING.includes(f.kind));
  if (process.argv.includes('--strict') && blocking.length > 0) {
    console.error(`${blocking.length} blocking finding(s): ${BLOCKING.join(', ')}.`);
    process.exit(1);
  }
}
