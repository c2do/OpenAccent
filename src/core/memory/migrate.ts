import { CURRENT_MEMORY_VERSION, MemorySchema, type Memory } from './types.js';

/**
 * Upgrades memory files written by older releases, one version at a time.
 *
 * To change the memory format:
 *   1. Add `vN.ts` with the new schema (copy the previous one and change it). Old `v*.ts` files never change.
 *   2. Point `current.ts` at it and bump CURRENT_MEMORY_VERSION.
 *   3. Add `MIGRATIONS[N - 1]`: a pure function from a valid version N-1 document to a version N document.
 *   4. Add a version N-1 file to tests/fixtures/memory/ if none covers what changed.
 * Every file in tests/fixtures/memory/ must keep loading.
 */

/** `MIGRATIONS[n]` turns a version n document into a version n + 1 document. */
export type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;
export const MIGRATIONS: Record<number, Migration> = {
  // v2 adds profile.dialects and voice; both default to empty, so the rest carries over as is.
  1: (doc) => doc,
};

export class MemoryVersionError extends Error {
  constructor(
    message: string,
    /** True when the file comes from a newer OpenAccent: it must be left untouched, not backed up or overwritten. */
    readonly newer: boolean,
  ) {
    super(message);
    this.name = 'MemoryVersionError';
  }
}

export interface MigrationResult {
  memory: Memory;
  /** The version the file was written in. */
  from: number;
  migrated: boolean;
}

export function migrateMemory(
  raw: unknown,
  opts: { migrations?: Record<number, Migration>; current?: number; parse?: (doc: unknown) => Memory } = {},
): MigrationResult {
  const migrations = opts.migrations ?? MIGRATIONS;
  const current = opts.current ?? CURRENT_MEMORY_VERSION;
  const parse = opts.parse ?? ((doc: unknown) => MemorySchema.parse(doc));

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new MemoryVersionError('Memory file is not a JSON object.', false);
  }
  const from = (raw as { version?: unknown }).version;
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) {
    throw new MemoryVersionError('Memory file has no valid "version".', false);
  }
  if (from > current) {
    throw new MemoryVersionError(
      `Memory file is version ${from}, written by a newer OpenAccent (this one reads up to version ${current}). Update OpenAccent; the file was left untouched.`,
      true,
    );
  }

  let doc = raw as Record<string, unknown>;
  for (let v = from; v < current; v++) {
    const step = migrations[v];
    if (!step) throw new MemoryVersionError(`No migration from memory version ${v} to ${v + 1}.`, false);
    doc = { ...step(doc), version: v + 1 };
  }
  return { memory: parse(doc), from, migrated: from < current };
}
