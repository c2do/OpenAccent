import { readFileSync } from 'node:fs';
import type { Country, Dialect, Entry } from './schema.js';

export interface BundledDialect extends Dialect {
  /** Country code, for dialects filed under data/countries/<cc>/. */
  country?: string;
}

export interface BundledEntry extends Entry {
  /** `<dialect>/<slug>` */
  id: string;
}

/** The compiled dictionary (`dist/dictionary.json`), produced by scripts/build-data.ts. */
export interface Bundle {
  formatVersion: 1;
  builtAt: string;
  countries: Country[];
  dialects: BundledDialect[];
  entries: BundledEntry[];
  /** Dialect guide markdown, keyed by dialect ID. */
  guides: Record<string, string>;
}

export function readBundle(path: string): Bundle {
  const bundle = JSON.parse(readFileSync(path, 'utf8')) as Bundle;
  if (bundle.formatVersion !== 1) throw new Error(`Unsupported dictionary format ${bundle.formatVersion} in ${path}`);
  return bundle;
}
