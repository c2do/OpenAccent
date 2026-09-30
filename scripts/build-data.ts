import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadRawData } from '../src/core/data-loader.js';
import type { Bundle } from '../src/core/bundle.js';
import { independentSourcesOf, sourceGroups } from '../src/core/confidence.js';
import { ConceptSchema, CountrySchema, DialectSchema, EntrySchema, SampleSchema } from '../src/core/schema.js';
import { validateData } from './validate-data.js';

export type { Bundle, BundledEntry } from '../src/core/bundle.js';

/**
 * Validates a data root and compiles it into a single bundle. Throws if the data is invalid, unless
 * `validate` is false (the audit reads data that may break the rules): then files that don't parse
 * are left out.
 */
export function buildBundle(root: string, opts: { validate?: boolean } = {}): Bundle {
  const errors = opts.validate === false ? [] : validateData(root);
  if (errors.length > 0) {
    throw new Error(`Data is invalid:\n${errors.map((e) => `  ${e.file}: ${e.message}`).join('\n')}`);
  }
  const raw = loadRawData(root);
  // With validation off, keep only what parses; otherwise everything parses already.
  const parseAll = <T, F extends { data: unknown }>(files: F[], parse: (f: F) => T): T[] =>
    files.flatMap((f) => {
      try {
        return [parse(f)];
      } catch (err) {
        if (opts.validate === false) return [];
        throw err;
      }
    });

  const countries = raw.countries.map((f) => CountrySchema.parse(f.data)).sort((a, b) => a.code.localeCompare(b.code));
  const dialects = raw.dialects
    .map((f) => ({ ...DialectSchema.parse(f.data), ...(f.country ? { country: f.country } : {}) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const groups = sourceGroups(raw.sources);
  const entries = parseAll(raw.entries, (f) => {
    const entry = EntrySchema.parse(f.data);
    return { id: `${f.folder}/${f.slug}`, ...entry, independent_sources: independentSourcesOf(entry, groups) };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const samples = parseAll(raw.samples, (f) => ({ id: `${f.folder}/${f.slug}`, dialect: f.folder, ...SampleSchema.parse(f.data) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const concepts = Object.fromEntries(
    Object.entries((raw.concepts ?? {}) as Record<string, unknown>).map(([id, c]) => [id, ConceptSchema.parse(c)]),
  );
  const guides: Record<string, string> = {};
  for (const f of raw.dialects) if (f.guide) guides[f.folder] = f.guide;

  return { formatVersion: 1, builtAt: new Date().toISOString(), countries, dialects, entries, concepts, samples, guides };
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
    console.log(`✓ Built ${out}: ${bundle.countries.length} countries, ${bundle.dialects.length} dialects, ${bundle.entries.length} entries`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
