import { z } from 'zod';

/**
 * Memory file format, version 1. FROZEN: never edit this file. Memory files written by
 * earlier OpenAccent releases must keep loading. To change the format, add v2.ts and a
 * migration (see migrate.ts).
 *
 * It depends on nothing but zod on purpose, so changes elsewhere (like the dialect ID rules)
 * cannot change what a version 1 file is.
 */

const timestamp = z.string().datetime();

export const MemoryV1Schema = z.object({
  version: z.literal(1, { error: 'Unsupported memory file version (this OpenAccent reads version 1)' }),
  profile: z
    .object({
      dialect: z
        .string()
        .regex(/^[a-z]{2,3}(-[a-z0-9]+)*$/, 'Dialect IDs are lowercase slugs like "ar-ps-fallahi"')
        .optional(),
      region: z.string().optional(),
      notes: z.string().optional(),
    })
    .default({}),
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
});

export type MemoryV1 = z.infer<typeof MemoryV1Schema>;
