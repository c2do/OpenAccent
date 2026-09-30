import { z } from 'zod';

/** Dialect IDs are readable slugs: `ar`, `ar-ps`, `ar-ps-fallahi`, `en-us-general`. */
export const DialectIdSchema = z
  .string()
  .regex(/^[a-z]{2,3}(-[a-z0-9]+)*$/, 'Dialect IDs are lowercase slugs like "ar-ps-fallahi"');

/** Entry IDs are `<dialect-id>/<ascii-slug>`. */
export const EntryIdSchema = z
  .string()
  .regex(/^[a-z]{2,3}(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*$/, 'Entry IDs look like "ar-ps-fallahi/hakoura"');

/** Localized text keyed by language code; English is required so every contributor can read it. */
const LocalizedSchema = z.object({ en: z.string().min(1) }).catchall(z.string());

// ISO 639-3 retired `ajp` (South Levantine) into `apc` (Levantine) in 2023.
const fixRetiredCode = (code: string) => code.replace(/^ajp(?=-|$)/, 'apc');

export const DialectSchema = z.object({
  id: DialectIdSchema,
  parent: DialectIdSchema.optional(),
  name: LocalizedSchema,
  region: LocalizedSchema.optional(),
  /** ISO 15924 script code, lowercase (arab, latn, ...). Picks search normalization. */
  script: z.string().regex(/^[a-z]{4}$/, 'Script must be an ISO 15924 code like "arab" or "latn"'),
  codes: z
    .object({
      bcp47: z.string().transform(fixRetiredCode).optional(),
      iso639_3: z.string().transform(fixRetiredCode).optional(),
      glottocode: z.string().regex(/^[a-z0-9]{4}\d{4}$/).optional(),
    })
    .default({}),
  reviewers: z.array(z.string().min(1)).default([]),
  status: z.enum(['proposed', 'active']),
  /** Optional [spoken, written] pairs for search, e.g. [["تش", "ك"], ["ك", "ق"]] for fallahi. Never chained. */
  sound_rules: z.array(z.tuple([z.string().min(1), z.string()])).optional(),
});

export const CountrySchema = z.object({
  /** ISO 3166-1 alpha-2, lowercase. */
  code: z.string().regex(/^[a-z]{2}$/, 'Country codes are 2 lowercase letters (ISO 3166-1)'),
  name: LocalizedSchema,
  population: z.number().int().nonnegative().optional(),
  languages: z
    .array(
      z.object({
        code: z.string(),
        name: LocalizedSchema,
        percent: z.number().min(0).max(100),
        official: z.boolean().optional(),
      }),
    )
    .default([]),
});

const ExampleSchema = z.object({
  text: z.string().min(1),
  en: z.string().optional(),
  ar: z.string().optional(),
});

/**
 * Labels for meanings a model must never use on its own: the words stay in the dictionary (people
 * say them, and users ask what they mean), but OpenAccent keeps them out of briefings and flags
 * them in replies.
 */
export const SensitiveLabelSchema = z.enum(['vulgar', 'sexual', 'offensive', 'slur']);
export type SensitiveLabel = z.infer<typeof SensitiveLabelSchema>;

const MeaningSchema = z
  .object({
    ar: z.string().min(1).optional(),
    en: z.string().min(1).optional(),
    examples: z.array(ExampleSchema).default([]),
    sensitive: z.array(SensitiveLabelSchema).default([]),
  })
  .refine((m) => m.ar !== undefined || m.en !== undefined, {
    message: 'Each meaning needs at least an "ar" or an "en" gloss',
  });

const SourceSchema = z
  .object({
    kind: z.enum(['ai-draft', 'contributor', 'reviewer', 'dataset']),
    /** Dataset name as listed in data/sources.yaml, e.g. "maknuune". */
    name: z.string().min(1).optional(),
    ref: z.string().optional(),
    license: z.string().default('CC-BY-SA-4.0'),
  })
  .refine((s) => s.kind !== 'dataset' || s.name !== undefined, {
    message: 'source.name is required when source.kind is "dataset"',
    path: ['name'],
  });

/** Core concept IDs (data/concepts.yaml), e.g. "now", "how_are_you". */
export const ConceptIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/, 'Concept IDs are lowercase with underscores, like "how_are_you"');

export const ConceptSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1),
  category: z.string().min(1),
});

/**
 * How an attestation was produced. The version names the algorithm, so every attestation an old,
 * looser version made can be found, stopped from counting and recomputed (see ATTESTATION_METHODS).
 *   dictionary-match – another dictionary lists the same word with a shared meaning (scripts/attest.ts)
 *   parallel-corpus  – dialect sentences with the word translate to English with its meaning (scripts/attest-corpus.ts)
 */
export const AttestationMethodSchema = z.enum(['dictionary-match', 'parallel-corpus']);

/** One piece of evidence that another open dataset confirms an entry: an entry in the evidence ledger. */
export const AttestationSchema = z.object({
  /** Dataset name as listed in data/sources.yaml. */
  name: z.string().min(1),
  ref: z.string().optional(),
  method: AttestationMethodSchema.optional(),
  method_version: z.number().int().positive().optional(),
  /** parallel-corpus: sentence pairs where the word appears and the translation carries its meaning. */
  support: z.number().int().nonnegative().optional(),
  /** parallel-corpus: sentence pairs where the word appears at all. */
  occurrences: z.number().int().nonnegative().optional(),
  /** parallel-corpus: support / occurrences. */
  precision: z.number().min(0).max(1).optional(),
  /** parallel-corpus: P(meaning in translation | word in sentence) / P(meaning in translation). */
  lift: z.number().nonnegative().optional(),
  /** The run that produced it (a GitHub Actions run ID for workflow runs). */
  run_id: z.string().optional(),
  /** Which version of the dataset was read (a checksum or an export date). */
  source_revision: z.string().optional(),
});
export type Attestation = z.infer<typeof AttestationSchema>;

/** A dataset listed as allowed in data/sources.yaml. */
export const AllowedSourceSchema = z.object({
  title: z.string().min(1),
  license: z.string().min(1),
  url: z.string().url(),
  attribution: z.string().optional(),
  note: z.string().optional(),
  /**
   * Datasets derived from each other (or from a common origin) share a group, and count as one
   * source when they agree: two copies of Wiktionary are not two witnesses.
   */
  independence_group: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
});

export const EntrySchema = z.object({
  word: z.string().min(1),
  dialect: DialectIdSchema,
  type: z.enum(['word', 'phrase', 'expression', 'proverb']),
  spellings: z.array(z.string().min(1)).default([]),
  /** Other-script input people actually type (Arabizi for Arabic). */
  romanized: z.array(z.string().min(1)).default([]),
  pronunciation: z.object({ simple: z.string().optional(), ipa: z.string().optional() }).optional(),
  part_of_speech: z.string().optional(),
  meanings: z.array(MeaningSchema).min(1, 'An entry needs at least one meaning'),
  /** The core concept this word expresses in its dialect (see data/concepts.yaml). */
  concept: ConceptIdSchema.optional(),
  register: z.enum(['casual', 'neutral', 'formal', 'vulgar']).default('neutral'),
  familiarity: z.enum(['common', 'regional', 'rare', 'dated']).default('common'),
  regions: z.array(z.string()).default([]),
  related: z.array(EntryIdSchema).default([]),
  notes: z.string().default(''),
  status: z.enum(['draft', 'verified', 'disputed']),
  verified_by: z.array(z.string().min(1)).default([]),
  source: SourceSchema,
  /** Other open datasets that list the same word with the same meaning: more sources, more confidence. */
  attested_by: z.array(AttestationSchema).default([]),
  added_by: z.string().optional(),
});

/** What the text is for. Rules differ: a script spells words as they sound, a song may use old words. */
export const PurposeSchema = z.enum(['chat', 'story', 'song', 'script', 'game']);
export type Purpose = z.infer<typeof PurposeSchema>;

/** A short, natural exchange showing how people actually write in a dialect. */
export const SampleSchema = z.object({
  title: z.string().min(1),
  purpose: PurposeSchema.default('chat'),
  /** Who is talking and where, e.g. "two friends on WhatsApp". */
  context: z.string().optional(),
  turns: z
    .array(z.object({ from: z.enum(['user', 'reply']), text: z.string().min(1) }))
    .min(2, 'A sample needs at least two turns'),
  status: z.enum(['draft', 'verified', 'disputed']),
  verified_by: z.array(z.string().min(1)).default([]),
  source: SourceSchema,
  added_by: z.string().optional(),
});

// Personal memory has its own versioned formats: see src/core/memory/.
export { MemorySchema, type Memory } from './memory/types.js';

export type Dialect = z.infer<typeof DialectSchema>;
export type Country = z.infer<typeof CountrySchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type Sample = z.infer<typeof SampleSchema>;
export type Entry = z.infer<typeof EntrySchema>;
