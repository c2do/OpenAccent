import { MemoryV1Schema, type MemoryV1 } from './v1.js';

/** The memory format this release reads and writes. */
export const CURRENT_MEMORY_VERSION = 1;

export const MemorySchema = MemoryV1Schema;
export type Memory = MemoryV1;

type Profile = Memory['profile'];
export type WordItem = Memory['words'][number];
export type CorrectionItem = Memory['corrections'][number];
export type StyleItem = Memory['style'][number];

/**
 * Size limits for new memory. Memory goes into the model's context on every conversation, so it
 * has to stay small. They apply when something is remembered, never when a file is read, so a
 * file written before a limit existed still loads.
 */
export const MEMORY_LIMITS = {
  /** Characters per field. */
  chars: { dialect: 64, region: 200, notes: 2000, say: 200, instead_of: 200, meaning: 300, wrong: 300, right: 300, context: 500, text: 1000 },
  /** Items per list. */
  items: { words: 500, corrections: 500, style: 50 },
} as const;

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
