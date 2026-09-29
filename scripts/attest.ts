/**
 * Adds a second (third, ...) source to entries that other open datasets confirm: same written word,
 * same meaning. Confirmed entries get `attested_by`, which raises their confidence (see
 * src/core/confidence.ts). Nothing new is created: a source that is noisy on its own (UniMorph mixes
 * in MSA) can still confirm what another source says.
 *
 *   git clone https://github.com/unimorph/arz && git clone https://github.com/unimorph/afb
 *   git clone https://github.com/CAMeL-Lab/maknuune_lexicon
 *   git clone -b doda_v1 https://github.com/darija-open-dataset/dataset doda
 *   tsx scripts/attest.ts --unimorph-arz arz/arz.gloss --unimorph-afb afb/afb.gloss \
 *     --maknuune maknuune_lexicon/maknuune_dict/letter_sections --doda doda [--dry-run]
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
import { normalize } from '../src/core/normalize.js';
import { arabiziCandidates } from '../src/core/romanize.js';

/** One word from a source dataset. `keys` are its written forms, normalized as Arabic. */
export interface SourceWord {
  keys: string[];
  glosses: string[];
  ref?: string;
}

export interface AttestSource {
  name: string;
  /** Dialect folders (under data/) whose entries this source can confirm. */
  dialects: string[];
  words: SourceWord[];
}

const ar = (s: string) => normalize(s, 'arab');
const STOP = /^(to|a|an|the|be|one's|someone|something|sth|sb)\s+/;

/** Gloss parts, normalized: "to go; to leave (a place)" → ["go", "leave"]. */
export function glossParts(gloss: string): string[] {
  return gloss
    .replace(/\([^)]*\)/g, ' ')
    .split(/[;,/]|\bor\b/)
    .map((p) => {
      let s = normalize(p, { script: 'latn', dialect: 'en' });
      for (let i = 0; i < 3 && STOP.test(s); i++) s = s.replace(STOP, '');
      return s;
    })
    .filter((p) => p.length > 1);
}

/** Same meaning: the two share a whole gloss part. */
export function sameMeaning(a: string[], b: string[]): boolean {
  const parts = new Set(a.flatMap(glossParts));
  return b.flatMap(glossParts).some((p) => parts.has(p));
}

// --- Source readers -----------------------------------------------------------------------

/** UniMorph `*.gloss`: "lemma<TAB>POS<TAB>gloss". */
export function readUnimorph(text: string, repo: string): SourceWord[] {
  return text
    .split('\n')
    .map((line) => line.split('\t'))
    .filter((cols) => cols.length >= 3 && cols[0] && cols[2])
    .map(([lemma, , gloss]) => ({ keys: [ar(lemma!)], glosses: [gloss!], ref: `https://github.com/unimorph/${repo}` }));
}

/** Maknuune letter sections (LaTeX): headword, then numbered English senses before the first "•". */
export function readMaknuune(tex: string): SourceWord[] {
  const out: SourceWord[] = [];
  for (const line of tex.split('\n')) {
    if (!line.includes('{\\setlength\\topsep{0pt}\\textbf{\\foreignlanguage{arabic}{')) continue;
    const head = /\\textbf\{\\foreignlanguage\{arabic\}\{([^}]+)\}\}/.exec(line)?.[1];
    if (!head) continue;
    const main = line.split('$\\bullet$')[0]!;
    const glosses = [...main.matchAll(/\\textbf\{\d+\.\}~([^\\]+)/g)].map((m) => m[1]!.trim()).filter(Boolean);
    if (glosses.length) out.push({ keys: [ar(head)], glosses, ref: 'https://github.com/CAMeL-Lab/maknuune_lexicon' });
  }
  return out;
}

/** DODa v1 CSVs: Arabizi spellings (n1…n4 or darija) and an English gloss (eng). */
export function readDodaCsv(csv: string): SourceWord[] {
  const rows = csv.split('\n').filter(Boolean).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
  const [header, ...body] = rows;
  if (!header) return [];
  const eng = header.indexOf('eng');
  const spellings = header.map((h, i) => (/^n\d$|^darija$/.test(h) ? i : -1)).filter((i) => i >= 0);
  if (eng < 0 || spellings.length === 0) return [];
  return body
    .filter((r) => r[eng])
    .map((r) => ({
      // Arabizi → the Arabic spellings it could stand for (بزاف from "bzaf").
      keys: [...new Set(spellings.flatMap((i) => (r[i] ? arabiziCandidates(r[i]!) : [])))],
      glosses: [r[eng]!],
      ref: 'https://github.com/darija-open-dataset/dataset/tree/doda_v1',
    }))
    .filter((w) => w.keys.length > 0);
}

// --- Applying -----------------------------------------------------------------------------

const DIALECT_DIRS: Record<string, string> = {
  'ar-eg': 'countries/eg/ar-eg',
  'ar-sa': 'countries/sa/ar-sa',
  'ar-gulf': 'languages/ar-gulf',
  'ar-levantine': 'languages/ar-levantine',
  'ar-jo': 'countries/jo/ar-jo',
  'ar-ps': 'countries/ps/ar-ps',
  'ar-ps-fallahi': 'countries/ps/ar-ps-fallahi',
  'ar-ma': 'countries/ma/ar-ma',
};

export interface AttestResult {
  source: string;
  checked: number;
  confirmed: { file: string; word: string }[];
}

/** Adds `attested_by` to every entry in the source's dialects that one of its words confirms. */
export function attest(dataRoot: string, source: AttestSource, opts: { dryRun?: boolean } = {}): AttestResult {
  const byKey = new Map<string, SourceWord[]>();
  for (const w of source.words) for (const k of w.keys) byKey.set(k, [...(byKey.get(k) ?? []), w]);
  const result: AttestResult = { source: source.name, checked: 0, confirmed: [] };

  for (const dialect of source.dialects) {
    const dir = join(dataRoot, DIALECT_DIRS[dialect] ?? '', 'entries');
    if (!DIALECT_DIRS[dialect] || !existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml'))) {
      const file = join(dir, f);
      const doc = parseDocument(readFileSync(file, 'utf8'), { version: '1.1' });
      const entry = doc.toJS() as {
        word: string;
        spellings?: string[];
        meanings: { en?: string }[];
        source?: { name?: string };
        attested_by?: { name: string }[];
      };
      result.checked++;
      if (entry.source?.name === source.name || entry.attested_by?.some((a) => a.name === source.name)) continue;
      const glosses = entry.meanings.flatMap((m) => (m.en ? [m.en] : []));
      const keys = [entry.word, ...(entry.spellings ?? [])].map(ar);
      const match = keys.flatMap((k) => byKey.get(k) ?? []).find((w) => sameMeaning(glosses, w.glosses));
      if (!match) continue;
      result.confirmed.push({ file, word: entry.word });
      if (opts.dryRun) continue;
      const list = (entry.attested_by ?? []).concat({ name: source.name, ...(match.ref ? { ref: match.ref } : {}) } as { name: string });
      doc.set('attested_by', list);
      writeFileSync(file, doc.toString());
    }
  }
  return result;
}

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataRoot = arg('data') ?? join(process.cwd(), 'data');
  const dryRun = process.argv.includes('--dry-run');
  const sources: AttestSource[] = [];
  const arz = arg('unimorph-arz');
  if (arz) sources.push({ name: 'unimorph', dialects: ['ar-eg'], words: readUnimorph(readFileSync(arz, 'utf8'), 'arz') });
  const afb = arg('unimorph-afb');
  if (afb) sources.push({ name: 'unimorph', dialects: ['ar-gulf', 'ar-sa'], words: readUnimorph(readFileSync(afb, 'utf8'), 'afb') });
  const mk = arg('maknuune');
  if (mk) {
    const words = walk(mk).filter((f) => f.endsWith('.tex')).flatMap((f) => readMaknuune(readFileSync(f, 'utf8')));
    sources.push({ name: 'maknuune', dialects: ['ar-levantine', 'ar-jo', 'ar-ps', 'ar-ps-fallahi'], words });
  }
  const doda = arg('doda');
  if (doda) {
    const words = walk(doda).filter((f) => f.endsWith('.csv')).flatMap((f) => readDodaCsv(readFileSync(f, 'utf8')));
    sources.push({ name: 'doda-v1', dialects: ['ar-ma'], words });
  }
  for (const s of sources) {
    const r = attest(dataRoot, s, { dryRun });
    console.log(`${s.name} (${s.words.length} words → ${s.dialects.join(', ')}): ${r.confirmed.length} of ${r.checked} entries confirmed`);
    for (const c of r.confirmed.slice(0, 15)) console.log(`  ${c.word}  ${c.file.replace(dataRoot + '/', '')}`);
  }
}
