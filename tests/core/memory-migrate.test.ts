import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import {
  CURRENT_MEMORY_VERSION,
  FileMemoryStore,
  MEMORY_LIMITS,
  MemoryLimitError,
  MemorySchema,
  MemoryVersionError,
  migrateMemory,
  type Memory,
} from '../../src/core/memory/index.js';

const fixtures = join(__dirname, '..', 'fixtures', 'memory');
const tmpFile = () => join(mkdtempSync(join(tmpdir(), 'oa-mem-')), 'memory.json');

describe('migrateMemory', () => {
  it('loads every memory file an earlier release could have written', () => {
    const files = readdirSync(fixtures).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const { memory } = migrateMemory(JSON.parse(readFileSync(join(fixtures, f), 'utf8')));
      expect(memory.version).toBe(CURRENT_MEMORY_VERSION);
    }
  });

  it('does nothing to a current file', () => {
    const r = migrateMemory({ version: CURRENT_MEMORY_VERSION });
    expect(r).toMatchObject({ from: CURRENT_MEMORY_VERSION, migrated: false });
  });

  it('runs every step in order up to the current version', () => {
    // A pretend future: v1 → v2 renames profile.region to profile.place, v2 → v3 adds a list.
    const migrations = {
      1: (d: Record<string, unknown>) => {
        const { region, ...profile } = (d.profile ?? {}) as Record<string, unknown>;
        return { ...d, profile: { ...profile, place: region } };
      },
      2: (d: Record<string, unknown>) => ({ ...d, scopes: [] }),
    };
    const r = migrateMemory(
      { version: 1, profile: { region: 'Ramallah' } },
      { migrations, current: 3, parse: (doc) => doc as unknown as Memory },
    );
    expect(r).toMatchObject({ from: 1, migrated: true, memory: { version: 3, profile: { place: 'Ramallah' }, scopes: [] } });
  });

  it('fails clearly when a step is missing', () => {
    expect(() => migrateMemory({ version: 1 }, { migrations: {}, current: 2 })).toThrow(/No migration from memory version 1 to 2/);
  });

  it('refuses files from a newer release without calling them corrupt', () => {
    try {
      migrateMemory({ version: CURRENT_MEMORY_VERSION + 1 });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(MemoryVersionError);
      expect((err as MemoryVersionError).newer).toBe(true);
      expect((err as Error).message).toMatch(/newer OpenAccent/);
    }
  });

  it('rejects files without a valid version', () => {
    for (const raw of [null, [], 'x', {}, { version: '1' }, { version: 0 }, { version: 1.5 }]) {
      expect(() => migrateMemory(raw)).toThrow(MemoryVersionError);
    }
  });
});

describe('FileMemoryStore and versions', () => {
  it('leaves a newer file untouched and becomes read-only', () => {
    const path = tmpFile();
    const newer = `${JSON.stringify({ version: CURRENT_MEMORY_VERSION + 1, words: [{ fancy: true }] })}\n`;
    writeFileSync(path, newer);
    const store = new FileMemoryStore(path);
    expect(store.read().words).toEqual([]);
    expect(store.warnings[0]).toMatch(/newer OpenAccent.*read-only/);
    expect(() => store.remember({ kind: 'word', say: 'هسّا' })).toThrow(/newer OpenAccent/);
    expect(readFileSync(path, 'utf8')).toBe(newer);
    expect(readdirSync(join(path, '..')).filter((f) => f.includes('.bak'))).toEqual([]);
  });

  it('backs up the original once before writing a migrated file', () => {
    const path = tmpFile();
    const original = JSON.stringify({ version: 0, sayings: ['هسّا'] });
    writeFileSync(path, original);
    const fromV0 = (raw: unknown) => {
      const doc = raw as { version: number; sayings?: string[] };
      if (doc.version !== 0) return migrateMemory(raw);
      const memory = MemorySchema.parse({
        version: CURRENT_MEMORY_VERSION,
        words: (doc.sayings ?? []).map((say, i) => ({ id: `w${i + 1}`, say, created_at: '2026-09-29T12:00:00.000Z' })),
      });
      return { memory, from: 0, migrated: true };
    };
    const store = new FileMemoryStore(path, { now: () => new Date('2026-09-30T00:00:00Z'), migrate: fromV0 });
    expect(store.read().words.map((w) => w.say)).toEqual(['هسّا']);
    store.remember({ kind: 'style', text: 'short replies' });
    expect(readFileSync(`${path}.v0.bak`, 'utf8')).toBe(original);
    const saved = JSON.parse(readFileSync(path, 'utf8'));
    expect(saved).toMatchObject({ version: CURRENT_MEMORY_VERSION, words: [{ say: 'هسّا' }], style: [{ text: 'short replies' }] });
  });
});

describe('FileMemoryStore limits', () => {
  it('rejects fields that are too long', () => {
    const store = new FileMemoryStore(tmpFile());
    const long = 'x'.repeat(MEMORY_LIMITS.chars.say + 1);
    expect(() => store.remember({ kind: 'word', say: long })).toThrow(MemoryLimitError);
    expect(() => store.remember({ kind: 'profile', notes: 'x'.repeat(MEMORY_LIMITS.chars.notes + 1) })).toThrow(/at most 2000/);
    expect(existsSync(store.path)).toBe(false);
  });

  it('rejects new items when a list is full, but still updates existing ones', () => {
    const path = tmpFile();
    const style = Array.from({ length: MEMORY_LIMITS.items.style }, (_, i) => ({
      id: `s${i + 1}`,
      text: `note ${i}`,
      created_at: '2026-09-29T12:00:00.000Z',
    }));
    writeFileSync(path, JSON.stringify({ version: 1, style }));
    const store = new FileMemoryStore(path);
    expect(() => store.remember({ kind: 'style', text: 'one more' })).toThrow(/Forget some first/);
    expect(store.remember({ kind: 'style', text: 'note 3' }).created).toBe(false);
  });

  it('still reads files that break today’s limits', () => {
    const path = tmpFile();
    writeFileSync(path, JSON.stringify({ version: 1, profile: { notes: 'x'.repeat(5000) } }));
    expect(new FileMemoryStore(path).read().profile.notes).toHaveLength(5000);
  });
});

describe('FileMemoryStore with several processes', () => {
  it('loses no change when processes write at the same time', { timeout: 60_000 }, async () => {
    const path = tmpFile();
    const writer = join(__dirname, '..', 'fixtures', 'memory-writer.ts');
    const run = promisify(execFile);
    const processes = 4;
    const each = 25;
    await Promise.all(
      Array.from({ length: processes }, (_, p) => run(process.execPath, ['--import', 'tsx', writer, path, `p${p}`, String(each)])),
    );
    const memory = MemorySchema.parse(JSON.parse(readFileSync(path, 'utf8')));
    expect(memory.words).toHaveLength(processes * each);
    expect(new Set(memory.words.map((w) => w.id)).size).toBe(processes * each);
    expect(existsSync(`${path}.lock`)).toBe(false);
  });
});
