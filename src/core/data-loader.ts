import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export interface DataError {
  /** Path relative to the data root, e.g. "entries/ar-ps/hakoura.yaml". */
  file: string;
  message: string;
}

export interface RawFile {
  file: string;
  data: unknown;
}

export interface RawEntryFile extends RawFile {
  /** The dialect folder the file sits in. */
  folder: string;
  /** File name without extension; becomes the second half of the entry ID. */
  slug: string;
}

export interface RawData {
  dialects: RawFile[];
  entries: RawEntryFile[];
  sources: unknown;
  errors: DataError[];
}

const yamlFiles = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort() : [];

/** Reads every YAML file under a data root without validating it. YAML syntax errors are collected. */
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

  const dialects = yamlFiles(join(root, 'dialects'))
    .map((f) => read(`dialects/${f}`))
    .filter((f): f is RawFile => f !== undefined);

  const entriesDir = join(root, 'entries');
  const folders = existsSync(entriesDir)
    ? readdirSync(entriesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];
  const entries: RawEntryFile[] = [];
  for (const folder of folders) {
    for (const f of yamlFiles(join(entriesDir, folder))) {
      const raw = read(`entries/${folder}/${f}`);
      if (raw) entries.push({ ...raw, folder, slug: f.replace(/\.yaml$/, '') });
    }
  }

  const sources = existsSync(join(root, 'sources.yaml')) ? read('sources.yaml')?.data : undefined;

  return { dialects, entries, sources, errors };
}
