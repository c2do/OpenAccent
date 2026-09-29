import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Dictionary } from '../dictionary.js';
import { observeMessage } from '../voice.js';
import { MemoryVersionError, migrateMemory, type MigrationResult } from './migrate.js';
import {
  CURRENT_MEMORY_VERSION,
  MEMORY_LIMITS,
  MemorySchema,
  type CorrectionItem,
  type ForgetInput,
  type Memory,
  type MemoryItem,
  type MemoryStore,
  type RememberInput,
  type StyleItem,
  type WordItem,
} from './types.js';

/** Something to remember is too long, or a list is full. */
export class MemoryLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryLimitError';
  }
}

/** How long to wait for another process that is writing memory, and when its lock counts as abandoned. */
const LOCK_WAIT_MS = 5_000;
const LOCK_STALE_MS = 10_000;
const LOCK_RETRY_MS = 15;

const sleep = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export function resolveMemoryPath(env: Record<string, string | undefined> = process.env): string {
  return env.OPENACCENT_MEMORY_PATH || join(homedir(), '.openaccent', 'memory.json');
}

const empty = (): Memory => MemorySchema.parse({ version: CURRENT_MEMORY_VERSION });

const nextId = (prefix: string, items: { id: string }[]) =>
  `${prefix}${Math.max(0, ...items.map((i) => Number(i.id.slice(prefix.length)) || 0)) + 1}`;

function checkLimits(input: RememberInput): void {
  for (const [field, value] of Object.entries(input)) {
    const max = MEMORY_LIMITS.chars[field as keyof typeof MEMORY_LIMITS.chars];
    if (max !== undefined && typeof value === 'string' && value.length > max) {
      throw new MemoryLimitError(`"${field}" is ${value.length} characters; memory keeps at most ${max}. Save something shorter.`);
    }
  }
}

function checkRoom(list: 'words' | 'corrections' | 'style', memory: Memory): void {
  const max = MEMORY_LIMITS.items[list];
  if (memory[list].length >= max) {
    throw new MemoryLimitError(`Memory already has ${max} ${list}, the most it keeps. Forget some first (openaccent_forget).`);
  }
}

/**
 * Memory as a human-readable JSON file.
 *
 * - Older file versions are migrated on read (the original is backed up on the first write).
 * - A file from a newer OpenAccent is never overwritten: memory is read-only until the user updates.
 * - Every change is read-modify-write under a lock file, so two processes (Claude Desktop and the
 *   CLI, say) cannot lose each other's changes, and each write is an atomic rename.
 */
export class FileMemoryStore implements MemoryStore {
  readonly warnings: string[] = [];

  private readonly now: () => Date;
  private readonly migrate: (raw: unknown) => MigrationResult;
  /** Needed to learn from the user's messages (which words belong to which dialect). */
  private readonly dictionary?: Dictionary;

  constructor(
    readonly path: string,
    opts: {
      now?: () => Date;
      /** Replaceable in tests, to exercise migrations. */
      migrate?: (raw: unknown) => MigrationResult;
      dictionary?: Dictionary;
    } = {},
  ) {
    this.now = opts.now ?? (() => new Date());
    this.migrate = opts.migrate ?? migrateMemory;
    this.dictionary = opts.dictionary;
  }

  /** Set when the file comes from a newer OpenAccent: memory is read-only so the file is never overwritten. */
  private blocked?: string;
  /** Set when the file was upgraded from an older version: the original is backed up before the first write. */
  private migratedFrom?: number;

  read(): Memory {
    if (!existsSync(this.path)) return empty();
    try {
      const { memory, from, migrated } = this.migrate(JSON.parse(readFileSync(this.path, 'utf8')));
      this.blocked = undefined;
      this.migratedFrom = migrated ? from : undefined;
      return memory;
    } catch (err) {
      if (err instanceof MemoryVersionError && err.newer) {
        this.blocked = err.message;
        this.warn(`${err.message} Memory is read-only until then.`);
        return empty();
      }
      const backup = `${this.path}.bak-${this.now().toISOString().replace(/[:.]/g, '-')}`;
      renameSync(this.path, backup);
      this.warn(
        `Memory file could not be read (${(err as Error).message.split('\n')[0]}). It was backed up to ${backup} and memory started empty.`,
      );
      return empty();
    }
  }

  remember(input: RememberInput): { item: MemoryItem; created: boolean } {
    checkLimits(input);
    return this.withLock(() => this.rememberLocked(input));
  }

  private rememberLocked(input: RememberInput): { item: MemoryItem; created: boolean } {
    const memory = this.read();
    const created_at = this.now().toISOString();
    let result: { item: MemoryItem; created: boolean };

    switch (input.kind) {
      case 'profile': {
        const { kind: _kind, ...fields } = input;
        if (fields.dialects) {
          fields.dialects = [...new Set(fields.dialects)].filter((d) => d !== (fields.dialect ?? memory.profile.dialect));
          if (fields.dialects.length > MEMORY_LIMITS.items.dialects) {
            throw new MemoryLimitError(`Memory keeps at most ${MEMORY_LIMITS.items.dialects} other dialects.`);
          }
        }
        memory.profile = { ...memory.profile, ...fields };
        result = { item: { id: 'profile', ...memory.profile }, created: false };
        break;
      }
      case 'word': {
        const existing = memory.words.find((w) => w.say === input.say && w.instead_of === input.instead_of);
        if (existing) {
          if (input.meaning) existing.meaning = input.meaning;
          result = { item: existing, created: false };
        } else {
          checkRoom('words', memory);
          const { kind: _kind, ...fields } = input;
          const item: WordItem = { id: nextId('w', memory.words), ...fields, created_at };
          memory.words.push(item);
          result = { item, created: true };
        }
        break;
      }
      case 'correction': {
        // One correction per wrong word: a newer right word replaces the old one.
        const existing = memory.corrections.find((c) => c.wrong === input.wrong);
        if (existing) {
          existing.right = input.right;
          if (input.context) existing.context = input.context;
          result = { item: existing, created: false };
        } else {
          checkRoom('corrections', memory);
          const { kind: _kind, ...fields } = input;
          const item: CorrectionItem = { id: nextId('c', memory.corrections), ...fields, created_at };
          memory.corrections.push(item);
          result = { item, created: true };
        }
        break;
      }
      case 'style': {
        const existing = memory.style.find((s) => s.text === input.text);
        if (existing) {
          result = { item: existing, created: false };
        } else {
          checkRoom('style', memory);
          const item: StyleItem = { id: nextId('s', memory.style), text: input.text, created_at };
          memory.style.push(item);
          result = { item, created: true };
        }
        break;
      }
    }

    this.write(memory);
    return result;
  }

  observe(text: string): Memory['voice'] {
    if (!this.dictionary) return this.read().voice;
    const dict = this.dictionary;
    return this.withLock(() => {
      const memory = this.read();
      memory.voice = observeMessage(dict, memory, text, this.now());
      this.write(memory);
      return memory.voice;
    });
  }

  forget(input: ForgetInput): MemoryItem[] {
    return this.withLock(() => this.forgetLocked(input));
  }

  private forgetLocked(input: ForgetInput): MemoryItem[] {
    const memory = this.read();
    const removed: MemoryItem[] = [];
    const ids = new Set(input.ids ?? []);
    const text = input.text?.trim();
    const hit = (item: { id: string }, fields: (string | undefined)[]) =>
      ids.has(item.id) || (text ? fields.some((f) => f?.includes(text)) : false);

    const keep = <T extends { id: string }>(items: T[], fields: (i: T) => (string | undefined)[]) =>
      items.filter((i) => {
        if (!hit(i, fields(i))) return true;
        removed.push(i as unknown as MemoryItem);
        return false;
      });

    memory.words = keep(memory.words, (w) => [w.say, w.instead_of, w.meaning]);
    memory.corrections = keep(memory.corrections, (c) => [c.wrong, c.right, c.context]);
    memory.style = keep(memory.style, (s) => [s.text]);
    const { dialect, dialects, region, notes } = memory.profile;
    const hasProfile = Boolean(dialect || region || notes || dialects.length);
    if ((input.profile || ids.has('profile')) && hasProfile) {
      removed.push({ id: 'profile', ...memory.profile });
      memory.profile = { dialects: [] };
    }

    const learned = memory.voice.messages > 0;
    if (input.voice && learned) memory.voice = MemorySchema.shape.voice.parse({});
    if (removed.length > 0 || (input.voice && learned)) this.write(memory);
    return removed;
  }

  private warn(message: string): void {
    if (!this.warnings.includes(message)) this.warnings.push(message);
  }

  /** Run a read-modify-write while holding `<path>.lock`, so concurrent writers take turns. */
  private withLock<T>(fn: () => T): T {
    mkdirSync(dirname(this.path), { recursive: true });
    const lock = `${this.path}.lock`;
    const deadline = Date.now() + LOCK_WAIT_MS;
    let fd: number | undefined;
    while (fd === undefined) {
      try {
        fd = openSync(lock, 'wx');
        writeSync(fd, String(process.pid));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
        try {
          // A writer that crashed leaves its lock behind; an old lock is taken over.
          if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS) {
            unlinkSync(lock);
            continue;
          }
        } catch {
          continue; // The lock was released between our open and stat: try again.
        }
        if (Date.now() > deadline) throw new Error(`Memory is busy: another OpenAccent process holds ${lock}. Try again.`);
        sleep(LOCK_RETRY_MS);
      }
    }
    try {
      return fn();
    } finally {
      closeSync(fd);
      try {
        unlinkSync(lock);
      } catch {
        // Already gone (taken over as stale): nothing to release.
      }
    }
  }

  private write(memory: Memory): void {
    if (this.blocked) throw new Error(this.blocked);
    mkdirSync(dirname(this.path), { recursive: true });
    if (this.migratedFrom !== undefined) {
      // Keep the file as the older release wrote it, in case the user goes back to that release.
      const backup = `${this.path}.v${this.migratedFrom}.bak`;
      if (!existsSync(backup)) copyFileSync(this.path, backup);
      this.migratedFrom = undefined;
    }
    const tmp = `${this.path}.tmp-${process.pid}`;
    writeFileSync(tmp, `${JSON.stringify(memory, null, 2)}\n`);
    renameSync(tmp, this.path);
  }
}
