import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { MemorySchema, type Memory } from './schema.js';

type Profile = Memory['profile'];
type WordItem = Memory['words'][number];
type CorrectionItem = Memory['corrections'][number];
type StyleItem = Memory['style'][number];

export type RememberInput =
  | ({ kind: 'profile' } & Profile)
  | { kind: 'word'; say: string; instead_of?: string; meaning?: string }
  | { kind: 'correction'; wrong: string; right: string; context?: string }
  | { kind: 'style'; text: string };

export type MemoryItem = WordItem | CorrectionItem | StyleItem | ({ id: 'profile' } & Profile);

export interface ForgetInput {
  ids?: string[];
  /** Removes words, corrections and style notes containing this text. */
  text?: string;
  profile?: boolean;
}

/** Where personal memory lives. The remote server (v0.3) will implement this per signed-in user. */
export interface MemoryStore {
  read(): Memory;
  remember(input: RememberInput): { item: MemoryItem; created: boolean };
  forget(input: ForgetInput): MemoryItem[];
  /** Problems met while loading (e.g. a corrupt file that was backed up). */
  readonly warnings: string[];
}

export function resolveMemoryPath(env: Record<string, string | undefined> = process.env): string {
  return env.OPENACCENT_MEMORY_PATH || join(homedir(), '.openaccent', 'memory.json');
}

const empty = (): Memory => MemorySchema.parse({ version: 1 });

const nextId = (prefix: string, items: { id: string }[]) =>
  `${prefix}${Math.max(0, ...items.map((i) => Number(i.id.slice(prefix.length)) || 0)) + 1}`;

/** Memory as a human-readable JSON file. Every change is read-modify-write with an atomic rename. */
export class FileMemoryStore implements MemoryStore {
  readonly warnings: string[] = [];

  constructor(
    readonly path: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(): Memory {
    if (!existsSync(this.path)) return empty();
    try {
      return MemorySchema.parse(JSON.parse(readFileSync(this.path, 'utf8')));
    } catch (err) {
      const backup = `${this.path}.bak-${this.now().toISOString().replace(/[:.]/g, '-')}`;
      renameSync(this.path, backup);
      this.warnings.push(
        `Memory file could not be read (${(err as Error).message.split('\n')[0]}). It was backed up to ${backup} and memory started empty.`,
      );
      return empty();
    }
  }

  remember(input: RememberInput): { item: MemoryItem; created: boolean } {
    const memory = this.read();
    const created_at = this.now().toISOString();
    let result: { item: MemoryItem; created: boolean };

    switch (input.kind) {
      case 'profile': {
        const { kind: _kind, ...fields } = input;
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

  forget(input: ForgetInput): MemoryItem[] {
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
    if ((input.profile || ids.has('profile')) && Object.keys(memory.profile).length > 0) {
      removed.push({ id: 'profile', ...memory.profile });
      memory.profile = {};
    }

    if (removed.length > 0) this.write(memory);
    return removed;
  }

  private write(memory: Memory): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp-${process.pid}`;
    writeFileSync(tmp, `${JSON.stringify(memory, null, 2)}\n`);
    renameSync(tmp, this.path);
  }
}
