/**
 * Confirms entries from parallel corpora: a dialect sentence that contains the word, whose English
 * translation contains the word's meaning. When that happens in at least MIN_PAIRS different
 * sentence pairs, the corpus is added to the entry's `attested_by` (see scripts/attest.ts for
 * dictionary sources). Like attest.ts, it never creates entries.
 *
 *   tsx scripts/attest-corpus.ts --flores <flores200_dataset dir> [--tatoeba <dir>] [--dry-run]
 *
 * The Tatoeba dir holds <code>_sentences.tsv for each dialect, eng_sentences.tsv and links.csv
 * (downloaded by .github/workflows/attest-corpora.yml).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
import { normalize } from '../src/core/normalize.js';
import { readings, tokenize } from '../src/core/tokenize.js';
import { glossParts } from './attest.js';

export const MIN_PAIRS = 2;

export interface Pair {
  dialect: string;
  english: string;
}

export interface Corpus {
  name: string;
  ref: string;
  /** Dialect ID → sentence pairs. */
  pairs: Map<string, Pair[]>;
}

/** Where each dialect's entries live, and which corpus languages speak for it. */
export const TARGETS: { dialect: string; dir: string; flores?: string[]; tatoeba?: string[] }[] = [
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

const ar = (s: string) => normalize(s, 'arab');

/** Normalized forms in a dialect sentence, with clitics removed too (وبالبيت → بيت). */
export function sentenceForms(text: string): Set<string> {
  const out = new Set<string>();
  for (const t of tokenize(text)) {
    out.add(ar(t.surface));
    for (const r of readings(t, 'arab', 'ar')) out.add(ar(r.form));
  }
  return out;
}

/** Whole-word (or whole-phrase) match in English. */
const inEnglish = (english: string, part: string) =>
  new RegExp(`(^|[^a-z])${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es|ed|ing)?([^a-z]|$)`).test(english);

/** Sentence pairs where the word appears and the translation carries one of its meanings. */
export function supportingPairs(words: string[], glosses: string[], pairs: { forms: Set<string>; english: string }[]): number {
  const keys = words.map(ar);
  const parts = glosses.flatMap(glossParts).filter((p) => p.length > 2);
  if (parts.length === 0) return 0;
  return pairs.filter((p) => keys.some((k) => p.forms.has(k)) && parts.some((g) => inEnglish(p.english, g))).length;
}

export function attestFromCorpus(dataRoot: string, corpus: Corpus, opts: { dryRun?: boolean } = {}) {
  const report: { dialect: string; pairs: number; checked: number; confirmed: string[] }[] = [];
  for (const t of TARGETS) {
    const pairs = (corpus.pairs.get(t.dialect) ?? []).map((p) => ({
      forms: sentenceForms(p.dialect),
      english: normalize(p.english, { script: 'latn', dialect: 'en' }),
    }));
    const dir = join(dataRoot, t.dir, 'entries');
    const row = { dialect: t.dialect, pairs: pairs.length, checked: 0, confirmed: [] as string[] };
    report.push(row);
    if (pairs.length === 0 || !existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml'))) {
      const file = join(dir, f);
      const doc = parseDocument(readFileSync(file, 'utf8'), { version: '1.1' });
      const e = doc.toJS() as { word: string; spellings?: string[]; meanings: { en?: string; sensitive?: string[] }[]; source?: { name?: string }; attested_by?: { name: string }[] };
      row.checked++;
      if (e.source?.name === corpus.name || e.attested_by?.some((a) => a.name === corpus.name)) continue;
      const glosses = e.meanings.filter((m) => m.en && !m.sensitive?.length).map((m) => m.en!);
      const n = supportingPairs([e.word, ...(e.spellings ?? [])], glosses, pairs);
      if (n < MIN_PAIRS) continue;
      row.confirmed.push(e.word);
      if (opts.dryRun) continue;
      doc.set('attested_by', [...(e.attested_by ?? []), { name: corpus.name, ref: `${corpus.ref} (${n} sentence pairs)` }]);
      writeFileSync(file, doc.toString());
    }
  }
  return report;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataRoot = arg('data') ?? join(process.cwd(), 'data');
  const dryRun = process.argv.includes('--dry-run');
  const corpora: Corpus[] = [];
  if (arg('flores')) corpora.push(readFlores(arg('flores')!));
  if (arg('tatoeba')) corpora.push(readTatoeba(arg('tatoeba')!));
  for (const c of corpora) {
    for (const r of attestFromCorpus(dataRoot, c, { dryRun })) {
      if (r.pairs === 0) continue;
      console.log(`${c.name} ${r.dialect}: ${r.pairs} sentence pairs, ${r.confirmed.length} of ${r.checked} entries confirmed${r.confirmed.length ? ` (${r.confirmed.slice(0, 12).join('، ')})` : ''}`);
    }
  }
}
