/**
 * Imports dialect entries from Wiktionary, via wiktextract's per-language JSONL (kaikki.org).
 * Wiktionary is CC BY-SA 4.0, like OpenAccent's data. Every imported entry is a draft that cites
 * its Wiktionary page, and waits for a native reviewer.
 *
 * Usage (one pass over one kaikki language file serves every dialect that draws on it):
 *   tsx scripts/import-wiktextract.ts --language "Spanish" --input kaikki-Spanish.jsonl [--input -]
 *        [--freq es_50k.txt] [--limit 150] [--dialects es-mx,es-es] [--data data]
 *   tsx scripts/import-wiktextract.ts --plan [--dialects ...]   # prints languages, URLs and frequency lists as JSON
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { stringify } from 'yaml';
import { loadRawData } from '../src/core/data-loader.js';
import { normalize } from '../src/core/normalize.js';
import { EntrySchema, type Entry } from '../src/core/schema.js';

export interface DialectImport {
  dialect: string;
  /** kaikki.org language names this dialect draws on. */
  languages: string[];
  /** Keep only senses tagged with one of these regions. Omit to keep every sense (dialect-specific files). */
  regionTags?: string[];
  /** FrequencyWords list code (content/2018/<code>/<code>_50k.txt), used to rank words. */
  freq?: string;
  script: string;
}

export const WAVE_1: DialectImport[] = [
  { dialect: 'en-us-general', languages: ['English'], regionTags: ['US'], freq: 'en', script: 'latn' },
  { dialect: 'en-gb', languages: ['English'], regionTags: ['UK', 'British'], freq: 'en', script: 'latn' },
  { dialect: 'en-in', languages: ['English'], regionTags: ['India', 'Indian-English'], freq: 'en', script: 'latn' },
  { dialect: 'es-mx', languages: ['Spanish'], regionTags: ['Mexico'], freq: 'es', script: 'latn' },
  { dialect: 'es-es', languages: ['Spanish'], regionTags: ['Spain'], freq: 'es', script: 'latn' },
  { dialect: 'pt-br', languages: ['Portuguese'], regionTags: ['Brazil'], freq: 'pt_br', script: 'latn' },
  { dialect: 'fr-fr', languages: ['French'], regionTags: ['France'], freq: 'fr', script: 'latn' },
  { dialect: 'de-de', languages: ['German'], regionTags: ['Germany'], freq: 'de', script: 'latn' },
  { dialect: 'tr-tr', languages: ['Turkish'], freq: 'tr', script: 'latn' },
  { dialect: 'hi-in', languages: ['Hindi'], freq: 'hi', script: 'deva' },
  { dialect: 'ar-eg', languages: ['Egyptian Arabic'], freq: 'ar', script: 'arab' },
  { dialect: 'ar-sa', languages: ['Gulf Arabic', 'Hijazi Arabic', 'Najdi Arabic'], freq: 'ar', script: 'arab' },
  { dialect: 'ar-sy', languages: ['North Levantine Arabic'], regionTags: ['Syria', 'Syrian'], freq: 'ar', script: 'arab' },
  { dialect: 'ar-lb', languages: ['North Levantine Arabic'], regionTags: ['Lebanon', 'Lebanese'], freq: 'ar', script: 'arab' },
  { dialect: 'ar-ma', languages: ['Moroccan Arabic'], freq: 'ar', script: 'arab' },
];

export const kaikkiUrl = (language: string) =>
  `https://kaikki.org/dictionary/${encodeURIComponent(language)}/kaikki.org-dictionary-${language.replace(/[^A-Za-z]/g, '')}.jsonl`;
export const frequencyUrl = (code: string) =>
  `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/${code}/${code}_50k.txt`;

// Parts of speech that are not dialect vocabulary.
const SKIP_POS = new Set(['name', 'character', 'symbol', 'prefix', 'suffix', 'infix', 'affix', 'letter', 'num', 'punct', 'romanization']);
// Senses we never import.
const SKIP_TAGS = new Set(['obsolete', 'archaic', 'historical', 'form-of', 'alt-of', 'misspelling', 'nonstandard-spelling']);

interface Sense {
  glosses?: string[];
  tags?: string[];
  form_of?: unknown;
  alt_of?: unknown;
  examples?: { text?: string; english?: string; translation?: string; type?: string }[];
}

interface KaikkiEntry {
  word: string;
  pos: string;
  lang?: string;
  senses?: Sense[];
  sounds?: { ipa?: string }[];
  forms?: { form: string; tags?: string[] }[];
}

interface Candidate {
  word: string;
  meanings: { en: string; examples: { text: string; en?: string }[] }[];
  tags: Set<string>;
  allRare: boolean;
  allDated: boolean;
  ipa?: string;
  romanized: Set<string>;
  pos: Set<string>;
  /** At least one selected sense is tagged colloquial/informal/slang. */
  everyday: boolean;
}

const REGISTER_ORDER = ['vulgar', 'casual', 'formal'] as const;
function registerFrom(tags: Set<string>): Entry['register'] {
  if (['vulgar', 'offensive', 'derogatory'].some((t) => tags.has(t))) return REGISTER_ORDER[0];
  if (['slang', 'colloquial', 'informal'].some((t) => tags.has(t))) return REGISTER_ORDER[1];
  if (tags.has('formal')) return REGISTER_ORDER[2];
  return 'neutral';
}

/** Selects the senses a dialect wants from one kaikki entry. */
export function selectSenses(entry: KaikkiEntry, cfg: DialectImport): Sense[] {
  if (SKIP_POS.has(entry.pos)) return [];
  return (entry.senses ?? []).filter((s) => {
    const tags = s.tags ?? [];
    if (!s.glosses?.length || s.form_of || s.alt_of) return false;
    if (tags.some((t) => SKIP_TAGS.has(t))) return false;
    if (cfg.regionTags && !tags.some((t) => cfg.regionTags!.includes(t))) return false;
    return true;
  });
}

/** Wiktionary sometimes stores notes like "ع (ʕa-) (alternative form)" as examples; keep real sentences only. */
export function isRealExample(text: string): boolean {
  if (/\((alternative|obsolete|dated|rare) form|\bform of\b/i.test(text)) return false;
  return text.trim().split(/\s+/).length >= 2;
}

// Senses tagged like this are everyday speech, which is what a dialect dictionary is for.
const EVERYDAY_TAGS = ['colloquial', 'informal', 'slang', 'familiar'];

/** Collects candidates per word from a stream of kaikki JSONL lines. */
export async function collect(lines: AsyncIterable<string> | Iterable<string>, cfgs: DialectImport[]) {
  const byDialect = new Map<string, Map<string, Candidate>>(cfgs.map((c) => [c.dialect, new Map()]));
  for await (const line of lines) {
    if (!line.trim()) continue;
    let entry: KaikkiEntry;
    try {
      entry = JSON.parse(line) as KaikkiEntry;
    } catch {
      continue; // a truncated last line, for example
    }
    if (!entry.word) continue;
    for (const cfg of cfgs) {
      if (entry.lang && !cfg.languages.includes(entry.lang)) continue;
      const senses = selectSenses(entry, cfg);
      if (senses.length === 0) continue;
      const map = byDialect.get(cfg.dialect)!;
      const c: Candidate = map.get(entry.word) ?? {
        word: entry.word,
        meanings: [],
        tags: new Set(),
        allRare: true,
        allDated: true,
        romanized: new Set(),
        pos: new Set(),
        everyday: false,
      };
      c.pos.add(entry.pos);
      c.ipa ??= entry.sounds?.find((s) => s.ipa)?.ipa;
      for (const f of entry.forms ?? []) if (f.tags?.includes('romanization')) c.romanized.add(f.form);
      for (const s of senses) {
        const tags = s.tags ?? [];
        tags.forEach((t) => c.tags.add(t));
        if (!tags.includes('rare')) c.allRare = false;
        if (!tags.includes('dated')) c.allDated = false;
        if (tags.some((t) => EVERYDAY_TAGS.includes(t))) c.everyday = true;
        const en = s.glosses!.join('; ');
        if (c.meanings.some((m) => m.en === en)) continue;
        // Only Wiktionary's own usage examples; quotations from books and papers are left out.
        const examples = (s.examples ?? [])
          .filter((e) => e.text && e.type !== 'quote' && e.text.length <= 200 && isRealExample(e.text))
          .slice(0, 2)
          .map((e) => ({ text: e.text!, ...((e.english ?? e.translation) ? { en: (e.english ?? e.translation)! } : {}) }));
        c.meanings.push({ en, examples });
      }
      map.set(entry.word, c);
    }
  }
  return byDialect;
}

/** Word → rank (0 = most frequent) from a FrequencyWords list ("word count" per line). */
export function readFrequency(text: string, script: string): Map<string, number> {
  const ranks = new Map<string, number>();
  text.split('\n').forEach((line, i) => {
    const word = line.split(' ')[0];
    if (word) {
      const key = normalize(word, script);
      if (!ranks.has(key)) ranks.set(key, i);
    }
  });
  return ranks;
}

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Turns ranked candidates into entries (and file slugs), skipping words the dialect already has. */
export function toEntries(
  candidates: Map<string, Candidate>,
  cfg: DialectImport,
  opts: { limit: number; ranks?: Map<string, number>; existingWords?: Set<string>; existingSlugs?: Set<string> },
): { slug: string; entry: Entry }[] {
  // Frequency of the word, with a boost for everyday senses: a common word whose regional sense is
  // obscure (e.g. Mexican "ante" = tapir) should not beat a slang word everyone uses there.
  const EVERYDAY_BOOST = 0.25;
  const rank = (w: string) => {
    const r = opts.ranks?.get(normalize(w, cfg.script)) ?? Number.MAX_SAFE_INTEGER;
    return candidates.get(w)?.everyday ? (r + 1) * EVERYDAY_BOOST : r + 1;
  };
  const existing = opts.existingWords ?? new Set<string>();
  const slugs = new Set(opts.existingSlugs ?? []);
  const sorted = [...candidates.values()]
    .filter((c) => !existing.has(normalize(c.word, cfg.script)))
    .sort((a, b) => rank(a.word) - rank(b.word) || a.word.localeCompare(b.word));

  const out: { slug: string; entry: Entry }[] = [];
  for (const c of sorted.slice(0, opts.limit)) {
    const romanized = [...c.romanized];
    let base = slugify(cfg.script === 'latn' ? c.word : (romanized[0] ?? '')) || `entry-${out.length + 1}`;
    let slug = base;
    for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
    slugs.add(slug);
    const language = cfg.languages[0]!;
    const entry = EntrySchema.parse({
      word: c.word,
      dialect: cfg.dialect,
      type: c.word.includes(' ') ? 'phrase' : 'word',
      romanized,
      ...(c.ipa ? { pronunciation: { ipa: c.ipa } } : {}),
      ...(c.pos.size === 1 ? { part_of_speech: [...c.pos][0] } : {}),
      meanings: c.meanings.slice(0, 4).map((m) => ({ en: m.en, examples: m.examples })),
      register: registerFrom(c.tags),
      familiarity: c.allDated ? 'dated' : c.allRare ? 'rare' : 'common',
      status: 'draft',
      source: {
        kind: 'dataset',
        name: 'wiktionary',
        ref: `https://en.wiktionary.org/wiki/${encodeURIComponent(c.word.replace(/ /g, '_'))}#${language.replace(/ /g, '_')}`,
        license: 'CC-BY-SA-4.0',
      },
      added_by: 'wiktionary-import',
    });
    out.push({ slug, entry });
  }
  return out;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const wanted = arg('dialects')?.split(',').map((s) => s.trim()).filter(Boolean);
  const cfgs = wanted ? WAVE_1.filter((c) => wanted.includes(c.dialect)) : WAVE_1;
  if (wanted && cfgs.length !== wanted.length) throw new Error(`Unknown dialect in --dialects ${wanted.join(',')}`);

  if (process.argv.includes('--plan')) {
    const languages = [...new Set(cfgs.flatMap((c) => c.languages))];
    console.log(
      JSON.stringify({
        languages: languages.map((l) => ({ language: l, url: kaikkiUrl(l), dialects: cfgs.filter((c) => c.languages.includes(l)).map((c) => c.dialect) })),
        frequency: [...new Set(cfgs.map((c) => c.freq).filter(Boolean))].map((f) => ({ code: f, url: frequencyUrl(f!) })),
      }),
    );
    return;
  }

  const language = arg('language');
  const input = arg('input');
  if (!language || !input) throw new Error('--language and --input are required (or use --plan)');
  const dataRoot = arg('data') ?? 'data';
  const limit = Number(arg('limit') ?? 150);
  const freqDir = arg('freq-dir');
  const mine = cfgs.filter((c) => c.languages.includes(language));
  if (mine.length === 0) throw new Error(`No selected dialect draws on "${language}"`);

  const stream = input === '-' ? process.stdin : createReadStream(input);
  const byDialect = await collect(createInterface({ input: stream, crlfDelay: Infinity }), mine);

  const raw = loadRawData(dataRoot);
  for (const cfg of mine) {
    const folder = raw.dialects.find((d) => d.folder === cfg.dialect);
    if (!folder) throw new Error(`No folder for dialect ${cfg.dialect}`);
    const dir = join(dataRoot, folder.file.replace(/\/dialect\.yaml$/, ''), 'entries');
    const own = raw.entries.filter((e) => e.folder === cfg.dialect);
    const existingWords = new Set(own.map((e) => normalize(String((e.data as { word?: string }).word ?? ''), cfg.script)));
    const freqFile = freqDir && cfg.freq ? join(freqDir, `${cfg.freq}_50k.txt`) : undefined;
    const ranks = freqFile && existsSync(freqFile) ? readFrequency(readFileSync(freqFile, 'utf8'), cfg.script) : undefined;
    // The limit is per dialect, across all its source languages and earlier runs.
    const alreadyImported = own.filter((e) => (e.data as { added_by?: string }).added_by === 'wiktionary-import').length;
    const entries = toEntries(byDialect.get(cfg.dialect)!, cfg, {
      limit: Math.max(0, limit - alreadyImported),
      ...(ranks ? { ranks } : {}),
      existingWords,
      existingSlugs: new Set(own.map((e) => e.slug)),
    });
    mkdirSync(dir, { recursive: true });
    for (const { slug, entry } of entries) writeFileSync(join(dir, `${slug}.yaml`), stringify(entry));
    console.log(`${cfg.dialect}: ${byDialect.get(cfg.dialect)!.size} candidates, wrote ${entries.length} entries${ranks ? '' : ' (no frequency list)'}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  });
}
