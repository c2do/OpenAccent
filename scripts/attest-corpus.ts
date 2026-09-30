/**
 * Confirms entries from parallel corpora (method "parallel-corpus", version 2). For each entry:
 *
 *   occurrences = sentence pairs whose dialect side contains the word (clitics removed too)
 *   support     = those whose English side also contains one of the word's meanings (whole words)
 *   precision   = support / occurrences
 *   lift        = precision / P(meaning in any English sentence of the corpus)
 *
 * Co-occurrence alone (v1: support ≥ 2) confirms wrong pairings when a sentence has "ولد" and
 * "بيت" and the translation "boy" and "house". v2 also needs precision — judged by its Wilson
 * lower bound, so 2 of 2 is not treated as certain — and lift, so a meaning that is in every
 * translation anyway ("go", "be") confirms nothing. The corpus goes into the entry's
 * `attested_by` with the numbers (the evidence ledger). Like attest.ts, it never creates entries.
 *
 * Every run recomputes the corpus's attestations: a v1 one, or one that no longer passes, is removed.
 *
 *   tsx scripts/attest-corpus.ts --flores <flores200_dataset dir> [--tatoeba <dir>] [--dry-run]
 *        [--report <file.tsv>] [--run-id <id>] [--flores-revision <rev>] [--tatoeba-revision <rev>]
 *
 * The Tatoeba dir holds <code>_sentences.tsv for each dialect, eng_sentences.tsv and links.csv
 * (downloaded by .github/workflows/attest-corpora.yml). --report writes every entry's numbers
 * (and one supporting sentence pair) for checking the thresholds by hand.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
import { ATTESTATION_METHODS } from '../src/core/confidence.js';
import { normalize } from '../src/core/normalize.js';
import type { Attestation } from '../src/core/schema.js';
import { readings, tokenize } from '../src/core/tokenize.js';
import { glossParts } from './attest.js';

export const METHOD = 'parallel-corpus' as const;
export const METHOD_VERSION = ATTESTATION_METHODS[METHOD].current;

/**
 * Thresholds for v2. Checked by hand against a random sample of the --report output (see
 * docs/attestation.md); change them only with a new sample.
 */
export const THRESHOLDS = {
  /** Different sentence pairs with the word and its meaning. */
  minSupport: 2,
  /** Wilson lower bound (80% one-sided) of support / occurrences. */
  minPrecision: 0.2,
  /** How much likelier the meaning is next to the word than in any sentence. */
  minLift: 3,
};

export interface Pair {
  dialect: string;
  english: string;
}

export interface Corpus {
  name: string;
  ref: string;
  /** Which version of the corpus was read (checksum or export date), for the evidence ledger. */
  revision?: string;
  /** Dialect ID → sentence pairs. */
  pairs: Map<string, Pair[]>;
}

export interface Target {
  dialect: string;
  dir: string;
  flores?: string[];
  tatoeba?: string[];
  /** ISO 15924 script of the dialect's sentences (default arab). */
  script?: string;
}

/**
 * Where each dialect's entries live, and which corpus languages speak for it. German, Portuguese and
 * Hindi corpora are the standard language: they confirm that a word means what the entry says, not
 * that it is regional. English entries have no English translation to check against, so they are left out.
 */
export const TARGETS: Target[] = [
  { dialect: 'ar-eg', dir: 'countries/eg/ar-eg', flores: ['arz_Arab'], tatoeba: ['arz'] },
  { dialect: 'ar-levantine', dir: 'languages/ar-levantine', flores: ['apc_Arab', 'ajp_Arab'], tatoeba: ['apc', 'ajp'] },
  { dialect: 'ar-jo', dir: 'countries/jo/ar-jo', flores: ['ajp_Arab'], tatoeba: ['ajp'] },
  { dialect: 'ar-sa', dir: 'countries/sa/ar-sa', flores: ['ars_Arab'], tatoeba: ['afb'] },
  { dialect: 'ar-gulf', dir: 'languages/ar-gulf', tatoeba: ['afb'] },
  { dialect: 'ar-iq', dir: 'countries/iq/ar-iq', flores: ['acm_Arab'], tatoeba: ['acm'] },
  { dialect: 'ar-ma', dir: 'countries/ma/ar-ma', flores: ['ary_Arab'], tatoeba: ['ary'] },
  { dialect: 'ar-dz', dir: 'countries/dz/ar-dz', tatoeba: ['arq'] },
  { dialect: 'ar-tn', dir: 'countries/tn/ar-tn', flores: ['aeb_Arab'], tatoeba: ['aeb'] },
  { dialect: 'ar-sd', dir: 'countries/sd/ar-sd', tatoeba: ['apd'] },
  { dialect: 'de-de', dir: 'countries/de/de-de', flores: ['deu_Latn'], tatoeba: ['deu'], script: 'latn' },
  { dialect: 'pt-br', dir: 'countries/br/pt-br', flores: ['por_Latn'], tatoeba: ['por'], script: 'latn' },
  { dialect: 'hi-in', dir: 'countries/in/hi-in', flores: ['hin_Deva'], tatoeba: ['hin'], script: 'deva' },
];

const lines = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8').split('\n') : []);

/** FLORES-200: the same line number is the same sentence in every language (dev and devtest). */
export function readFlores(root: string): Corpus {
  const pairs = new Map<string, Pair[]>();
  for (const split of ['dev', 'devtest']) {
    const eng = lines(join(root, split, `eng_Latn.${split}`));
    for (const t of TARGETS) {
      for (const code of t.flores ?? []) {
        const dia = lines(join(root, split, `${code}.${split}`));
        const list = pairs.get(t.dialect) ?? [];
        dia.forEach((d, i) => d && eng[i] && list.push({ dialect: d, english: eng[i]! }));
        pairs.set(t.dialect, list);
      }
    }
  }
  return { name: 'flores', ref: 'https://github.com/facebookresearch/flores', pairs };
}

/** Tatoeba exports: sentences (id, lang, text) per language, and links (id, id) between translations. */
export function readTatoeba(root: string): Corpus {
  const sentences = (file: string) =>
    new Map(lines(file).map((l) => l.split('\t')).filter((c) => c.length >= 3).map((c) => [c[0]!, c[2]!] as const));
  const eng = sentences(join(root, 'eng_sentences.tsv'));
  const links = new Map<string, string[]>();
  for (const l of lines(join(root, 'links.csv'))) {
    const [a, b] = l.split('\t');
    if (a && b && eng.has(b)) links.set(a, [...(links.get(a) ?? []), b]);
  }
  const pairs = new Map<string, Pair[]>();
  for (const t of TARGETS) {
    const list: Pair[] = [];
    for (const code of t.tatoeba ?? []) {
      for (const [id, text] of sentences(join(root, `${code}_sentences.tsv`))) {
        for (const e of links.get(id) ?? []) list.push({ dialect: text, english: eng.get(e)! });
      }
    }
    pairs.set(t.dialect, list);
  }
  return { name: 'tatoeba', ref: 'https://tatoeba.org', pairs };
}

const ARABIC = { dialect: 'ar', script: 'arab' };

/** The search key for a word or sentence in the target's dialect. */
const keyFor = (t: { dialect: string; script?: string }) => (s: string) => normalize(s, { script: t.script ?? 'arab', dialect: t.dialect });

/** Normalized forms in a dialect sentence, with clitics removed too (وبالبيت → بيت). */
export function sentenceForms(text: string, target: { dialect: string; script?: string } = ARABIC): Set<string> {
  const key = keyFor(target);
  const language = target.dialect.split('-')[0]!;
  const out = new Set<string>();
  for (const t of tokenize(text)) {
    out.add(key(t.surface));
    for (const r of readings(t, target.script ?? 'arab', language)) out.add(key(r.form));
  }
  return out;
}

/** Whole-word (or whole-phrase) match in English, allowing -s/-es/-ed/-ing. */
const inEnglish = (english: string, part: string) =>
  english.includes(part) && new RegExp(`(^|[^a-z])${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es|ed|ing)?([^a-z]|$)`).test(english);

/** Lower bound of the Wilson score interval: how high the true rate surely is, given k of n. */
export function wilsonLow(k: number, n: number, z = 1.2816): number {
  if (n === 0) return 0;
  const p = k / n;
  const z2 = z * z;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return Math.max(0, (centre - margin) / (1 + z2 / n));
}

export interface PreparedPair {
  forms: Set<string>;
  english: string;
  /** The raw sentences, for the report. */
  raw?: Pair;
}

export interface CorpusEvidence {
  support: number;
  occurrences: number;
  precision: number;
  /** Wilson lower bound of the precision. */
  precisionLow: number;
  lift: number;
  /** One supporting pair, for checking by hand. */
  example?: Pair;
}

export const meaningParts = (glosses: string[]) => [...new Set(glosses.flatMap(glossParts).filter((p) => p.length > 2))];

/**
 * The numbers for one entry. `baseRate` is the share of all English sentences that carry one of
 * the meanings (computed by the caller once per set of meanings).
 */
export function corpusEvidence(keys: string[], parts: string[], pairs: PreparedPair[], baseRate: number): CorpusEvidence {
  let occurrences = 0;
  let support = 0;
  let example: Pair | undefined;
  for (const p of pairs) {
    if (!keys.some((k) => p.forms.has(k))) continue;
    occurrences++;
    if (parts.some((g) => inEnglish(p.english, g))) {
      support++;
      example ??= p.raw;
    }
  }
  const precision = occurrences ? support / occurrences : 0;
  const lift = baseRate > 0 ? precision / baseRate : 0;
  return { support, occurrences, precision, precisionLow: wilsonLow(support, occurrences), lift, ...(example ? { example } : {}) };
}

export const passes = (e: CorpusEvidence, t = THRESHOLDS) => e.support >= t.minSupport && e.precisionLow >= t.minPrecision && e.lift >= t.minLift;

/** Sentence pairs where the word appears and the translation carries one of its meanings (v1's only test). */
export function supportingPairs(words: string[], glosses: string[], pairs: PreparedPair[], target: { dialect: string; script?: string } = ARABIC): number {
  const parts = meaningParts(glosses);
  return parts.length ? corpusEvidence(words.map(keyFor(target)), parts, pairs, 1).support : 0;
}

export interface ReportRow {
  corpus: string;
  dialect: string;
  word: string;
  file: string;
  meanings: string;
  evidence: CorpusEvidence;
  /** added: newly attested; kept: attested again; removed: attested before, not any more; none. */
  decision: 'added' | 'kept' | 'removed' | 'none';
}

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits;

export function attestFromCorpus(
  dataRoot: string,
  corpus: Corpus,
  opts: { dryRun?: boolean; runId?: string; thresholds?: typeof THRESHOLDS; rows?: ReportRow[] } = {},
) {
  const report: { dialect: string; pairs: number; checked: number; confirmed: string[]; removed: string[] }[] = [];
  for (const t of TARGETS) {
    const raw = corpus.pairs.get(t.dialect) ?? [];
    const dir = join(dataRoot, t.dir, 'entries');
    const row = { dialect: t.dialect, pairs: raw.length, checked: 0, confirmed: [] as string[], removed: [] as string[] };
    report.push(row);
    // No sentences (the download failed, or the corpus has none for this dialect): leave the attestations alone.
    if (raw.length === 0 || !existsSync(dir)) continue;
    const pairs: PreparedPair[] = raw.map((p) => ({
      forms: sentenceForms(p.dialect, t),
      english: normalize(p.english, { script: 'latn', dialect: 'en' }),
      raw: p,
    }));
    const baseRates = new Map<string, number>();
    const baseRate = (parts: string[]) => {
      const key = parts.join('|');
      let rate = baseRates.get(key);
      if (rate === undefined) {
        rate = pairs.filter((p) => parts.some((g) => inEnglish(p.english, g))).length / pairs.length;
        baseRates.set(key, rate);
      }
      return rate;
    };
    const key = keyFor(t);
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml'))) {
      const file = join(dir, f);
      const doc = parseDocument(readFileSync(file, 'utf8'), { version: '1.1' });
      const e = doc.toJS() as { word: string; spellings?: string[]; meanings: { en?: string; sensitive?: string[] }[]; source?: { name?: string }; attested_by?: Attestation[] };
      row.checked++;
      if (e.source?.name === corpus.name) continue;
      const parts = meaningParts(e.meanings.filter((m) => m.en && !m.sensitive?.length).map((m) => m.en!));
      if (parts.length === 0) continue;
      const evidence = corpusEvidence([e.word, ...(e.spellings ?? [])].map(key), parts, pairs, baseRate(parts));
      const before = e.attested_by ?? [];
      const had = before.some((a) => a.name === corpus.name);
      const ok = passes(evidence, opts.thresholds);
      const decision = ok ? (had ? 'kept' : 'added') : had ? 'removed' : 'none';
      if (evidence.occurrences > 0 || had) {
        opts.rows?.push({ corpus: corpus.name, dialect: t.dialect, word: e.word, file: join(t.dir, 'entries', f), meanings: parts.join('; '), evidence, decision });
      }
      if (ok) row.confirmed.push(e.word);
      if (decision === 'removed') row.removed.push(e.word);
      if (decision === 'none' || opts.dryRun) continue;
      const after: Attestation[] = before.filter((a) => a.name !== corpus.name);
      if (ok) {
        after.push({
          name: corpus.name,
          ref: corpus.ref,
          method: METHOD,
          method_version: METHOD_VERSION,
          support: evidence.support,
          occurrences: evidence.occurrences,
          precision: round(evidence.precision, 3),
          lift: round(evidence.lift, 1),
          ...(opts.runId ? { run_id: opts.runId } : {}),
          ...(corpus.revision ? { source_revision: corpus.revision } : {}),
        });
      }
      if (after.length) doc.set('attested_by', after);
      else doc.delete('attested_by');
      writeFileSync(file, doc.toString());
    }
  }
  return report;
}

const tsvCell = (s: string | number) => String(s).replace(/[\t\n]/g, ' ');

/** The --report file: one line per entry the corpus has anything to say about. */
export function reportTsv(rows: ReportRow[]): string {
  const head = ['corpus', 'dialect', 'word', 'decision', 'support', 'occurrences', 'precision', 'precision_low', 'lift', 'meanings', 'example_dialect', 'example_english', 'file'];
  const lines = rows.map((r) =>
    [
      r.corpus, r.dialect, r.word, r.decision, r.evidence.support, r.evidence.occurrences,
      round(r.evidence.precision, 3), round(r.evidence.precisionLow, 3), round(r.evidence.lift, 1),
      r.meanings, r.evidence.example?.dialect ?? '', r.evidence.example?.english ?? '', r.file,
    ].map(tsvCell).join('\t'),
  );
  return [head.join('\t'), ...lines].join('\n') + '\n';
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataRoot = arg('data') ?? join(process.cwd(), 'data');
  const dryRun = process.argv.includes('--dry-run');
  const runId = arg('run-id');
  const corpora: Corpus[] = [];
  if (arg('flores')) corpora.push({ ...readFlores(arg('flores')!), ...(arg('flores-revision') ? { revision: arg('flores-revision')! } : {}) });
  if (arg('tatoeba')) corpora.push({ ...readTatoeba(arg('tatoeba')!), ...(arg('tatoeba-revision') ? { revision: arg('tatoeba-revision')! } : {}) });
  const rows: ReportRow[] = [];
  for (const c of corpora) {
    for (const r of attestFromCorpus(dataRoot, c, { dryRun, rows, ...(runId ? { runId } : {}) })) {
      if (r.pairs === 0) continue;
      const removed = r.removed.length ? `, ${r.removed.length} removed (${r.removed.slice(0, 8).join('، ')})` : '';
      console.log(`${c.name} ${r.dialect}: ${r.pairs} sentence pairs, ${r.confirmed.length} of ${r.checked} entries confirmed${removed}`);
    }
  }
  const out = arg('report');
  if (out) writeFileSync(out, reportTsv(rows));
}
