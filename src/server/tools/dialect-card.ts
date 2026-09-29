import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { buildDialectCard } from '../../core/card.js';
import { PurposeSchema } from '../../core/schema.js';
import { DialectCardResultSchema } from '../../core/results.js';
import type { ServerContext } from '../context.js';
import { guard, ok } from '../respond.js';

export function registerDialectCard(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_dialect_card',
    {
      title: 'Get a dialect card for writing',
      description:
        'Call this before writing a story, song, script, game dialogue or any text where a character (or the text) ' +
        'speaks a dialect. Returns how that dialect sounds and is written, its everyday words, common AI mistakes and ' +
        'examples, with rules for the kind of writing. Works for any dialect, independent of the user’s own. Call it ' +
        'once per dialect when characters come from different places.',
      inputSchema: z.object({
        dialect: z.string().describe('Dialect ID, e.g. "ar-eg", "es-mx", "en-gb". See openaccent_list_dialects.'),
        purpose: PurposeSchema.default('story').describe('chat | story | song | script | game'),
      }),
      outputSchema: DialectCardResultSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ dialect, purpose }) =>
      guard(() => ok(ctx, buildDialectCard(ctx.dictionary, dialect, purpose), DialectCardResultSchema, { dialect, purpose })),
  );
}
