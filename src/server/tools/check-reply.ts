import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { checkReply } from '../../core/check.js';
import { PurposeSchema } from '../../core/schema.js';
import { CheckResultSchema } from '../../core/results.js';
import type { ServerContext } from '../context.js';
import { fail, guard, ok, resolveDialect } from '../respond.js';

export function registerCheckReply(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_check_reply',
    {
      title: 'Check a reply before sending it',
      description:
        'Call this before sending any text written in a dialect (replies, stories, songs, scripts). It flags words from other dialects, rare or ' +
        'old-fashioned words, words written the way they sound, and words the user corrected or replaced before, ' +
        'with a suggested swap for each, and where it is in the text (start/end string offsets). It checks words only, not grammar or tone. Pass the user’s last message as user_message so OpenAccent keeps learning how they speak.',
      inputSchema: z.object({
        text: z.string().min(1).describe('Your draft reply'),
        dialect: z.string().optional().describe('Dialect ID. Defaults to the user’s dialect.'),
        user_message: z
          .string()
          .max(4000)
          .optional()
          .describe(
            'The user’s last message, as they wrote it. OpenAccent learns how they speak from it (which dialects, their own words, how they write). Only counts are kept, never the message; sending the same message again does not count it twice.',
          ),
        purpose: PurposeSchema.default('chat').describe('chat | story | song | script | game. Scripts may spell words as spoken; songs and stories may use old words.'),
      }),
      outputSchema: CheckResultSchema,
      // Not read-only: with user_message it updates the voice profile in memory. Idempotent: the same
      // message sent again is recognized and not counted twice (see observeMessage).
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ text, dialect, user_message, purpose }) =>
      guard(() => {
        if (user_message) ctx.memory.observe(user_message);
        const d = resolveDialect(ctx, dialect);
        if (!d) return fail('No dialect given and the user has no profile yet. Pass "dialect" or call openaccent_get_briefing.');
        const result = checkReply(ctx.dictionary, ctx.memory.read(), text, d, { purpose });
        const lines = result.issues.map(
          (i) => `- **${i.text}** (${i.kind}): ${i.reason}${i.suggestion ? ` → use **${i.suggestion}**` : ''}`,
        );
        return ok(ctx, [result.verdict, ...lines].join('\n'), CheckResultSchema, { ...result });
      }),
  );
}
