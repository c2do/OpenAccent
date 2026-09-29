import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { ExpressResultSchema } from '../../core/results.js';
import type { ServerContext } from '../context.js';
import { entryData, formatMatch } from '../format.js';
import { fail, guard, ok, resolveDialect } from '../respond.js';

export function registerExpress(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_express',
    {
      title: 'How to say something in a dialect',
      description:
        'Find how to say a meaning in a dialect (e.g. "now" in rural Palestinian), or compare several dialects. ' +
        'Give the meaning in English or Arabic. If the user has their own word for it, prefer that (see the briefing).',
      inputSchema: z.object({
        meaning: z.string().min(1).describe('The meaning, e.g. "now", "you all", "الآن"'),
        dialects: z
          .array(z.string())
          .max(10)
          .optional()
          .describe('Dialect IDs to answer for. Defaults to the user’s dialect. Pass several to compare.'),
        limit: z.number().int().min(1).max(50).default(10).describe('Max results per dialect'),
      }),
      outputSchema: ExpressResultSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ meaning, dialects, limit }) =>
      guard(() => {
        const own = resolveDialect(ctx, undefined);
        const targets = dialects?.length ? dialects : own ? [own] : [];
        if (targets.length === 0) {
          return fail('No dialect given and the user has no profile yet. Pass "dialects" or call openaccent_get_briefing.');
        }
        const groups = ctx.dictionary.express(meaning, { dialects: targets, limit });
        const text = groups
          .map((g) => {
            const name = ctx.dictionary.getDialect(g.dialect)?.name.en ?? g.dialect;
            const body = g.items.length ? g.items.map(formatMatch).join('\n\n') : '_No entries yet._';
            return `## ${name} (\`${g.dialect}\`)\n\n${body}`;
          })
          .join('\n\n');
        return ok(ctx, `Ways to say "${meaning}":\n\n${text}`, ExpressResultSchema, {
          meaning,
          results: groups.map((g) => ({
            dialect: g.dialect,
            total: g.total,
            items: g.items.map((m) => ({ ...entryData(m.entry), inherited: m.inherited })),
          })),
        });
      }),
  );
}
