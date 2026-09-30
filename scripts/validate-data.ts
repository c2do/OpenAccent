import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { z } from 'zod';
import { loadRawData, type DataError } from '../src/core/data-loader.js';
import { BARE_CLITICS, letterCount, sensitiveLabels } from './quality.js';
import { ATTESTATION_METHODS } from '../src/core/confidence.js';
import { AllowedSourceSchema, ConceptSchema, CountrySchema, DialectSchema, EntrySchema, SampleSchema, type Dialect, type Entry } from '../src/core/schema.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const describeIssues = (error: z.ZodError) =>
  error.issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message)).join('; ');

/** Validates a data root (dialects, entries, sources). Returns every problem found; empty means valid. */
export function validateData(root: string): DataError[] {
  const raw = loadRawData(root);
  const errors: DataError[] = [...raw.errors];

  if (raw.dialects.length === 0 && raw.errors.length === 0) {
    return [{ file: 'dialects', message: 'No dialect files found — is this the data folder?' }];
  }

  // Countries
  for (const { file, data } of raw.countries) {
    const parsed = CountrySchema.safeParse(data);
    if (!parsed.success) {
      errors.push({ file, message: describeIssues(parsed.error) });
      continue;
    }
    const expected = file.split('/')[1];
    if (parsed.data.code !== expected) {
      errors.push({ file, message: `Country code "${parsed.data.code}" does not match folder name "${expected}"` });
    }
  }

  // Dialects
  const dialects = new Map<string, { file: string; dialect: Dialect }>();
  for (const { file, data, folder } of raw.dialects) {
    const parsed = DialectSchema.safeParse(data);
    if (!parsed.success) {
      errors.push({ file, message: describeIssues(parsed.error) });
      continue;
    }
    if (parsed.data.id !== folder) {
      errors.push({ file, message: `Dialect id "${parsed.data.id}" does not match folder name "${folder}"` });
    }
    const dup = dialects.get(parsed.data.id);
    if (dup) {
      errors.push({ file, message: `Dialect "${parsed.data.id}" is defined twice (also in ${dup.file})` });
      continue;
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
  for (const [name, s] of Object.entries(sources.allowed ?? {})) {
    const parsed = AllowedSourceSchema.safeParse(s);
    if (!parsed.success) errors.push({ file: 'sources.yaml', message: `allowed.${name}: ${describeIssues(parsed.error)}` });
  }
  const blocked = new Set(Object.keys(sources.blocked ?? {}));

  // Concepts
  const concepts = new Set<string>();
  if (raw.concepts !== undefined) {
    if (typeof raw.concepts !== 'object' || raw.concepts === null) {
      errors.push({ file: 'concepts.yaml', message: 'Must be a mapping of concept id → { en, ar, category }' });
    } else {
      for (const [id, value] of Object.entries(raw.concepts as Record<string, unknown>)) {
        const parsed = ConceptSchema.safeParse(value);
        if (!parsed.success) errors.push({ file: 'concepts.yaml', message: `${id}: ${describeIssues(parsed.error)}` });
        else if (!/^[a-z][a-z0-9_]*$/.test(id)) errors.push({ file: 'concepts.yaml', message: `Bad concept id "${id}"` });
        else concepts.add(id);
      }
    }
  }

  /** Reviewer rules shared by entries and samples. */
  const checkVerification = (file: string, dialectId: string, item: { status: string; verified_by: string[] }) => {
    if (item.status === 'verified' && item.verified_by.length === 0) {
      errors.push({ file, message: 'status is "verified" but verified_by is empty' });
    }
    const owner = dialects.get(dialectId);
    for (const who of item.verified_by) {
      if (owner && !owner.dialect.reviewers.includes(who)) {
        errors.push({ file, message: `"${who}" is not a reviewer of ${dialectId}` });
      }
    }
  };

  // Samples
  for (const { file, data, folder, slug } of raw.samples) {
    if (!SLUG.test(slug)) {
      errors.push({ file, message: 'File name must be a lowercase ASCII slug like "asking-directions"' });
      continue;
    }
    const parsed = SampleSchema.safeParse(data);
    if (!parsed.success) {
      errors.push({ file, message: describeIssues(parsed.error) });
      continue;
    }
    checkVerification(file, folder, parsed.data);
  }

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
    checkVerification(file, entry.dialect, entry);
    if (entry.concept && raw.concepts !== undefined && !concepts.has(entry.concept)) {
      errors.push({ file, message: `Unknown concept "${entry.concept}" (see data/concepts.yaml)` });
    }
    if (entry.source.kind === 'dataset' && entry.source.name) {
      if (blocked.has(entry.source.name)) {
        errors.push({ file, message: `Dataset "${entry.source.name}" is blocked (see data/sources.yaml)` });
      } else if (!allowed.has(entry.source.name)) {
        errors.push({ file, message: `Dataset "${entry.source.name}" is not listed in data/sources.yaml` });
      }
    }
    entry.attested_by.forEach((a, i) => {
      if (blocked.has(a.name)) errors.push({ file, message: `attested_by: dataset "${a.name}" is blocked (see data/sources.yaml)` });
      else if (!allowed.has(a.name)) errors.push({ file, message: `attested_by: dataset "${a.name}" is not listed in data/sources.yaml` });
      // The evidence ledger: an attestation must say how it was made, so a method version found too loose can be recomputed.
      if (!a.method || !a.method_version) {
        errors.push({ file, message: `attested_by.${i}: "method" and "method_version" are required (see ATTESTATION_METHODS in src/core/confidence.ts)` });
      } else if (a.method_version > ATTESTATION_METHODS[a.method].current) {
        errors.push({ file, message: `attested_by.${i}: ${a.method} has no version ${a.method_version} yet` });
      }
    });
    // Imported drafts nobody has reviewed: every offensive or sexual meaning must be labelled (so models
    // never use it on their own), and a single letter is never a word.
    if (entry.source.kind === 'dataset' && entry.status !== 'verified') {
      entry.meanings.forEach((m, i) => {
        const needed = sensitiveLabels({ glosses: [m.en, m.ar].filter((g): g is string => Boolean(g)) });
        if (needed.length > 0 && m.sensitive.length === 0) {
          errors.push({ file, message: `meanings.${i} looks ${needed.join('/')} but has no "sensitive" label` });
        }
      });
      if (letterCount(entry.word) < 2 || BARE_CLITICS.has(entry.word)) {
        errors.push({ file, message: 'Imported draft is a single letter or a bare clitic' });
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
