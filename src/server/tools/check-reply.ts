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
        'with a suggested swap for each, and where it is in the text (start/end string offsets). It checks words only, not grammar or tone.',
      inputSchema: z.object({
        text: z.string().min(1).describe('Your draft reply'),
        dialect: z.string().optional().describe('Dialect ID. Defaults to the user’s dialect.'),
        purpose: PurposeSchema.default('chat').describe('chat | story | song | script | game. Scripts may spell words as spoken; songs and stories may use old words.'),
      }),
      outputSchema: CheckResultSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ text, dialect, purpose }) =>
      guard(() => {
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
