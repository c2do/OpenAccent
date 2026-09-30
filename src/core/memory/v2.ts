import { z } from 'zod';

/**
 * Memory file format, version 2. FROZEN once released: never edit this file. To change the
 * format, add v3.ts and a migration (see migrate.ts).
 *
 * New in version 2: `profile.dialects` (other dialects the user speaks) and `voice` (what
 * OpenAccent has learned from the user's own messages: counts only, never the messages).
 *
 * It depends on nothing but zod on purpose, so changes elsewhere cannot change what a version 2 file is.
 */

const timestamp = z.string().datetime();
const DIALECT_ID = z.string().regex(/^[a-z]{2,3}(-[a-z0-9]+)*$/, 'Dialect IDs are lowercase slugs like "ar-ps-fallahi"');
const count = z.number().int().nonnegative();

export const MemoryV2Schema = z.object({
  version: z.literal(2, { error: 'Unsupported memory file version (expected version 2)' }),
  profile: z
    .object({
      dialect: DIALECT_ID.optional(),
      /** Other dialects the user speaks too: their words are never flagged as mistakes. */
      dialects: z.array(DIALECT_ID).default([]),
      region: z.string().optional(),
      notes: z.string().optional(),
    })
    .prefault({}),
  words: z
    .array(
      z.object({
        id: z.string(),
        say: z.string().min(1),
        instead_of: z.string().optional(),
        meaning: z.string().optional(),
        created_at: timestamp,
      }),
    )
    .default([]),
  corrections: z
    .array(
      z.object({
        id: z.string(),
        wrong: z.string().min(1),
        right: z.string().min(1),
        context: z.string().optional(),
        created_at: timestamp,
      }),
    )
    .default([]),
  style: z.array(z.object({ id: z.string(), text: z.string().min(1), created_at: timestamp })).default([]),
  voice: z
    .object({
      /** Messages observed. */
      messages: count.default(0),
      /** Words seen in those messages. */
      words: count.default(0),
      /** Messages written mostly in Latin letters by someone whose dialect is not (Arabizi, for Arabic). */
      latin: count.default(0),
      /** Messages with at least one emoji. */
      emoji: count.default(0),
      /** Messages that switch scripts (Arabic with English words, for example). */
      mixed: count.default(0),
      /** Dialect ID → words the user wrote that the dictionary files only under that dialect. */
      dialects: z.record(z.string(), count).default({}),
      /** Dialect words the user writes, most frequent first. */
      own: z.array(z.object({ word: z.string().min(1), dialect: z.string(), count })).default([]),
      /**
       * Short fingerprints of the last messages observed, so the same message sent twice (a retried
       * tool call) is counted once. A fingerprint, not the message: the text itself is never stored.
       */
      recent: z.array(z.string()).default([]),
      updated_at: timestamp.optional(),
    })
    .prefault({}),
});

export type MemoryV2 = z.infer<typeof MemoryV2Schema>;
