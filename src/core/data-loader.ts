import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/**
 * Data layout:
 *
 *   data/countries/<cc>/country.yaml               one folder per country or territory
 *   data/countries/<cc>/<dialect-id>/dialect.yaml  a dialect spoken there
 *   data/countries/<cc>/<dialect-id>/guide.md      its guide (optional)
 *   data/countries/<cc>/<dialect-id>/entries/*.yaml
 *   data/languages/<dialect-id>/...                cross-border nodes (ar, ar-levantine, en, ...)
 *   data/sources.yaml
 */

export interface DataError {
  /** Path relative to the data root, e.g. "countries/eg/ar-eg/entries/izzayak.yaml". */
  file: string;
  message: string;
}

export interface RawFile {
  file: string;
  data: unknown;
}

export interface RawDialectFile extends RawFile {
  /** Folder name; must equal the dialect id. */
  folder: string;
  /** Country code when the dialect lives under countries/<cc>/. */
  country?: string;
  /** Guide markdown, if the folder has a guide.md. */
  guide?: string;
}

export interface RawEntryFile extends RawFile {
  /** The dialect folder the entry sits in. */
  folder: string;
  /** File name without extension; becomes the second half of the entry ID. */
  slug: string;
}

export interface RawData {
  countries: RawFile[];
  dialects: RawDialectFile[];
  entries: RawEntryFile[];
  sources: unknown;
  errors: DataError[];
}

const subdirs = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

const yamlFiles = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort() : [];

/** Reads every data file under a data root without validating it. YAML syntax errors are collected. */
export function loadRawData(root: string): RawData {
  const errors: DataError[] = [];
  const read = (file: string): RawFile | undefined => {
    try {
      return { file, data: parse(readFileSync(join(root, file), 'utf8')) };
    } catch (err) {
      errors.push({ file, message: `Invalid YAML: ${(err as Error).message.split('\n')[0]}` });
      return undefined;
    }
  };

  const countries: RawFile[] = [];
  const dialects: RawDialectFile[] = [];
  const entries: RawEntryFile[] = [];

  const loadDialectFolder = (rel: string, folder: string, country?: string) => {
    const dir = `${rel}/${folder}`;
    if (!existsSync(join(root, dir, 'dialect.yaml'))) {
      errors.push({ file: dir, message: 'Dialect folder has no dialect.yaml' });
      return;
    }
    const raw = read(`${dir}/dialect.yaml`);
    if (raw) {
      const guidePath = join(root, dir, 'guide.md');
      dialects.push({
        ...raw,
        folder,
        ...(country ? { country } : {}),
        ...(existsSync(guidePath) ? { guide: readFileSync(guidePath, 'utf8') } : {}),
      });
    }
    for (const f of yamlFiles(join(root, dir, 'entries'))) {
      const entry = read(`${dir}/entries/${f}`);
      if (entry) entries.push({ ...entry, folder, slug: f.replace(/\.yaml$/, '') });
    }
  };

  for (const cc of subdirs(join(root, 'countries'))) {
    if (existsSync(join(root, 'countries', cc, 'country.yaml'))) {
      const raw = read(`countries/${cc}/country.yaml`);
      if (raw) countries.push(raw);
    } else {
      errors.push({ file: `countries/${cc}`, message: 'Country folder has no country.yaml' });
    }
    for (const folder of subdirs(join(root, 'countries', cc))) loadDialectFolder(`countries/${cc}`, folder, cc);
  }
  for (const folder of subdirs(join(root, 'languages'))) loadDialectFolder('languages', folder);

  const sources = existsSync(join(root, 'sources.yaml')) ? read('sources.yaml')?.data : undefined;
  return { countries, dialects, entries, sources, errors };
}
