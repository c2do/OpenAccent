import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadRawData } from '../src/core/data-loader.js';
import { DialectSchema, EntrySchema, type Dialect, type Entry } from '../src/core/schema.js';
import { validateData } from './validate-data.js';

export interface BundledEntry extends Entry {
  /** `<dialect>/<slug>` */
  id: string;
}

export interface Bundle {
  formatVersion: 1;
  builtAt: string;
  dialects: Dialect[];
  entries: BundledEntry[];
  /** Dialect guide markdown, keyed by dialect ID. */
  guides: Record<string, string>;
}

/** Validates a data root and compiles it into a single bundle. Throws if the data is invalid. */
export function buildBundle(root: string): Bundle {
  const errors = validateData(root);
  if (errors.length > 0) {
    throw new Error(`Data is invalid:\n${errors.map((e) => `  ${e.file}: ${e.message}`).join('\n')}`);
  }
  const raw = loadRawData(root);

  const dialects = raw.dialects.map((f) => DialectSchema.parse(f.data)).sort((a, b) => a.id.localeCompare(b.id));
  const entries = raw.entries
    .map((f) => ({ id: `${f.folder}/${f.slug}`, ...EntrySchema.parse(f.data) }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const guides: Record<string, string> = {};
  const guidesDir = join(root, 'guides');
  if (existsSync(guidesDir)) {
    for (const f of readdirSync(guidesDir).filter((n) => n.endsWith('.md')).sort()) {
      guides[f.replace(/\.md$/, '')] = readFileSync(join(guidesDir, f), 'utf8');
    }
  }

  return { formatVersion: 1, builtAt: new Date().toISOString(), dialects, entries, guides };
}

export function writeBundle(bundle: Bundle, outFile: string): void {
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(bundle));
}

// CLI: `npm run build:data`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? join(process.cwd(), 'data');
  const out = process.argv[3] ?? join(process.cwd(), 'dist/dictionary.json');
  try {
    const bundle = buildBundle(root);
    writeBundle(bundle, out);
    console.log(`✓ Built ${out}: ${bundle.dialects.length} dialects, ${bundle.entries.length} entries`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
