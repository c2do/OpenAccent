/**
 * The shapes of everything OpenAccent returns, as Zod schemas. Core functions, MCP tools and
 * tests share them, so a type and its schema cannot drift apart.
 *
 * Objects are strict: a result with a field the schema doesn't describe is a bug, and the MCP
 * layer rejects it (see src/server/respond.ts).
 */
import { z } from 'zod';
import { ISSUE_FIELD_IDS } from './links.js';
import { MemorySchema } from './memory/types.js';
import { DialectIdSchema, PurposeSchema } from './schema.js';

// --- Building blocks ---------------------------------------------------------------------

const Localized = z.object({ en: z.string() }).catchall(z.string());
const Offset = z.number().int().nonnegative();

export const ProfileSchema = z.strictObject({
  dialect: z.string().optional(),
  region: z.string().optional(),
  notes: z.string().optional(),
});
export const WordItemSchema = MemorySchema.shape.words.unwrap().element.strict();
export const CorrectionItemSchema = MemorySchema.shape.corrections.unwrap().element.strict();
export const StyleItemSchema = MemorySchema.shape.style.unwrap().element.strict();
export const MemoryItemSchema = z.union([
  WordItemSchema,
  CorrectionItemSchema,
  StyleItemSchema,
  ProfileSchema.extend({ id: z.literal('profile') }),
]);

/** A dictionary entry as tools return it. */
export const EntryDataSchema = z.strictObject({
  id: z.string(),
  word: z.string(),
  dialect: DialectIdSchema,
  status: z.enum(['draft', 'verified', 'disputed']),
  familiarity: z.enum(['common', 'regional', 'rare', 'dated']),
  register: z.enum(['casual', 'neutral', 'formal', 'vulgar']),
  meanings: z.array(
    z.strictObject({
      ar: z.string().optional(),
      en: z.string().optional(),
      examples: z.array(z.strictObject({ text: z.string(), en: z.string().optional(), ar: z.string().optional() })),
    }),
  ),
  pronunciation: z.strictObject({ simple: z.string().optional(), ipa: z.string().optional() }).optional(),
  spellings: z.array(z.string()),
  romanized: z.array(z.string()),
  related: z.array(z.string()),
  notes: z.string().optional(),
});
export type EntryData = z.infer<typeof EntryDataSchema>;

export const MatchKindSchema = z.enum(['exact', 'normalized', 'fuzzy', 'romanized', 'sound', 'gloss']);

// --- check_reply -------------------------------------------------------------------------

export const IssueKindSchema = z.enum(['correction', 'personal_word', 'pronunciation', 'other_dialect', 'rare', 'dated']);
export type IssueKind = z.infer<typeof IssueKindSchema>;

export const ReplyIssueSchema = z
  .strictObject({
    /** The words as they appear in the reply: `text === reply.slice(start, end)`. */
    text: z.string(),
    /** Position in the reply, as JavaScript string indexes (UTF-16 code units). */
    start: Offset,
    end: Offset,
    kind: IssueKindSchema,
    reason: z.string(),
    suggestion: z.string().optional(),
  })
  .refine((i) => i.end > i.start, { message: 'An issue span must not be empty', path: ['end'] });
export type ReplyIssue = z.infer<typeof ReplyIssueSchema>;

export const CheckResultSchema = z.strictObject({
  dialect: DialectIdSchema,
  issues: z.array(ReplyIssueSchema),
  verdict: z.string(),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

// --- The other tools ---------------------------------------------------------------------

export const BriefingResultSchema = z.strictObject({
  onboarding: z.boolean(),
  dialect: DialectIdSchema.optional(),
  profile: ProfileSchema,
  words: z.array(WordItemSchema),
  corrections: z.array(CorrectionItemSchema),
  style: z.array(StyleItemSchema),
});
export type BriefingResult = z.infer<typeof BriefingResultSchema>;

export const LookupResultSchema = z.strictObject({
  query: z.string(),
  dialect: DialectIdSchema.optional(),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  has_more: z.boolean(),
  next_offset: z.number().int().nonnegative().optional(),
  items: z.array(EntryDataSchema.extend({ match: MatchKindSchema, inherited: z.boolean() })),
});
export type LookupResult = z.infer<typeof LookupResultSchema>;

export const ExpressResultSchema = z.strictObject({
  meaning: z.string(),
  results: z.array(
    z.strictObject({
      dialect: DialectIdSchema,
      total: z.number().int().nonnegative(),
      items: z.array(EntryDataSchema.extend({ inherited: z.boolean() })),
    }),
  ),
});
export type ExpressResult = z.infer<typeof ExpressResultSchema>;

export const DialectSummarySchema = z.strictObject({
  id: DialectIdSchema,
  parent: DialectIdSchema.optional(),
  name: Localized,
  script: z.string(),
  status: z.enum(['proposed', 'active']),
  entries: z.number().int().nonnegative(),
  verified: z.number().int().nonnegative(),
  verifiedPercent: z.number().min(0).max(100),
});
export type DialectSummary = z.infer<typeof DialectSummarySchema>;

export const ListDialectsResultSchema = z.strictObject({ dialects: z.array(DialectSummarySchema) });

export const RememberResultSchema = z.strictObject({ created: z.boolean(), item: MemoryItemSchema });

export const ForgetResultSchema = z.strictObject({ removed: z.array(MemoryItemSchema) });

export const SuggestionLinkSchema = z.strictObject({
  url: z.string().url(),
  /** Fields left out to keep the URL short enough. */
  dropped: z.array(z.enum(ISSUE_FIELD_IDS)),
  note: z.string(),
});
export type SuggestionLink = z.infer<typeof SuggestionLinkSchema>;

export const ExportPromptResultSchema = z.strictObject({
  text: z.string(),
  dialect: DialectIdSchema,
  chars: z.number().int().nonnegative(),
});

export const DialectCardResultSchema = z.strictObject({ dialect: DialectIdSchema, purpose: PurposeSchema });
