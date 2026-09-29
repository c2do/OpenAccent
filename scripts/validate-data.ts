import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { z } from 'zod';
import { loadRawData, type DataError } from '../src/core/data-loader.js';
import { DialectSchema, EntrySchema, type Dialect, type Entry } from '../src/core/schema.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const describeIssues = (error: z.ZodError) =>
  error.issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message)).join('; ');

/** Validates a data root (dialects, entries, sources). Returns every problem found; empty means valid. */
export function validateData(root: string): DataError[] {
  const raw = loadRawData(root);
  const errors: DataError[] = [...raw.errors];

  // Dialects
  const dialects = new Map<string, { file: string; dialect: Dialect }>();
  for (const { file, data } of raw.dialects) {
    const parsed = DialectSchema.safeParse(data);
    if (!parsed.success) {
      errors.push({ file, message: describeIssues(parsed.error) });
      continue;
    }
    const expected = file.replace(/^dialects\//, '').replace(/\.yaml$/, '');
    if (parsed.data.id !== expected) {
      errors.push({ file, message: `Dialect id "${parsed.data.id}" does not match file name "${expected}"` });
    }
    dialects.set(parsed.data.id, { file, dialect: parsed.data });
  }
  for (const { file, dialect } of dialects.values()) {
    if (dialect.parent && !dialects.has(dialect.parent)) {
      errors.push({ file, message: `Unknown parent dialect "${dialect.parent}"` });
    }
    // Walk up the tree; revisiting a node means a cycle.
    const seen = new Set([dialect.id]);
    for (let p = dialect.parent; p; p = dialects.get(p)?.dialect.parent) {
      if (seen.has(p)) {
        errors.push({ file, message: `Dialect tree has a cycle through "${dialect.id}"` });
        break;
      }
      seen.add(p);
    }
  }

  // Sources
  const sources = (raw.sources ?? {}) as { allowed?: Record<string, unknown>; blocked?: Record<string, unknown> };
  const allowed = new Set(Object.keys(sources.allowed ?? {}));
  const blocked = new Set(Object.keys(sources.blocked ?? {}));

  // Entries
  const entries: { file: string; id: string; entry: Entry }[] = [];
  for (const { file, data, folder, slug } of raw.entries) {
    if (!SLUG.test(slug)) {
      errors.push({ file, message: 'File name must be a lowercase ASCII slug like "hakoura" or "kif-halak"' });
      continue;
    }
    const parsed = EntrySchema.safeParse(data);
    if (!parsed.success) {
      errors.push({ file, message: describeIssues(parsed.error) });
      continue;
    }
    const entry = parsed.data;
    const owner = dialects.get(entry.dialect);
    if (!owner) {
      errors.push({ file, message: `Unknown dialect "${entry.dialect}"` });
    } else if (folder !== entry.dialect) {
      errors.push({ file, message: `Entry dialect "${entry.dialect}" is in folder "${folder}"` });
    }
    if (entry.status === 'verified' && entry.verified_by.length === 0) {
      errors.push({ file, message: 'status is "verified" but verified_by is empty' });
    }
    for (const who of entry.verified_by) {
      if (owner && !owner.dialect.reviewers.includes(who)) {
        errors.push({ file, message: `"${who}" is not a reviewer of ${entry.dialect}` });
      }
    }
    if (entry.source.kind === 'dataset' && entry.source.name) {
      if (blocked.has(entry.source.name)) {
        errors.push({ file, message: `Dataset "${entry.source.name}" is blocked (see data/sources.yaml)` });
      } else if (!allowed.has(entry.source.name)) {
        errors.push({ file, message: `Dataset "${entry.source.name}" is not listed in data/sources.yaml` });
      }
    }
    entries.push({ file, id: `${folder}/${slug}`, entry });
  }

  const ids = new Set(entries.map((e) => e.id));
  const wordsSeen = new Map<string, string>();
  for (const { file, entry } of entries) {
    const key = `${entry.dialect}\u0000${entry.word.trim()}`;
    const first = wordsSeen.get(key);
    if (first) {
      errors.push({ file, message: `Duplicate word "${entry.word}" in ${entry.dialect} (also in ${first})` });
    } else {
      wordsSeen.set(key, file);
    }
    for (const rel of entry.related) {
      if (!ids.has(rel)) errors.push({ file, message: `Unknown related entry "${rel}"` });
    }
  }

  return errors;
}

// CLI: `npm run validate`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? join(process.cwd(), 'data');
  const errors = validateData(root);
  if (errors.length === 0) {
    console.log('✓ Data is valid');
  } else {
    for (const e of errors) console.error(`✗ ${e.file}: ${e.message}`);
    console.error(`\n${errors.length} problem(s) found`);
    process.exit(1);
  }
}
