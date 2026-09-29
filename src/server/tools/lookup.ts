import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { LookupResultSchema } from '../../core/results.js';
import type { ServerContext } from '../context.js';
import { entryData, formatMatch } from '../format.js';
import { guard, ok, resolveDialect } from '../respond.js';

export function registerLookup(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_lookup',
    {
      title: 'Look up a word in a dialect',
      description:
        'Find what a word or expression means in a dialect, with examples, pronunciation and whether native speakers ' +
        'verified it. Accepts Arabic script, Arabizi (7akoura, 3ashan), English, and words typed the way they sound. ' +
        'Searches the dialect and its parent dialects. Results marked "unverified" are drafts: do not present them as fact.',
      inputSchema: z.object({
        query: z.string().min(1).describe('The word or expression, e.g. "حاكورة", "7akoura", "y\'all"'),
        dialect: z
          .string()
          .optional()
          .describe('Dialect ID, e.g. "ar-ps-fallahi". Defaults to the user’s dialect. See openaccent_list_dialects.'),
        limit: z.number().int().min(1).max(50).default(10).describe('Max results (default 10)'),
        offset: z.number().int().min(0).default(0).describe('Skip this many results, for paging'),
      }),
      outputSchema: LookupResultSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ query, dialect, limit, offset }) =>
      guard(() => {
        const d = resolveDialect(ctx, dialect);
        const page = ctx.dictionary.lookup(query, { dialect: d, limit, offset });
        const scope = d ? `in \`${d}\` (and its parent dialects)` : 'in all dialects';
        const header =
          page.total === 0
            ? `No entries for "${query}" ${scope}. If you know this word, the user can add it with openaccent_suggest_entry.`
            : `${page.total} result(s) for "${query}" ${scope}${page.has_more ? `, showing ${page.offset + 1}–${page.offset + page.count}` : ''}:`;
        const text = [header, ...page.items.map(formatMatch)].join('\n\n');
        return ok(ctx, text, LookupResultSchema, {
          query,
          ...(d ? { dialect: d } : {}),
          total: page.total,
          offset: page.offset,
          has_more: page.has_more,
          ...(page.next_offset !== undefined ? { next_offset: page.next_offset } : {}),
          items: page.items.map((m) => ({ ...entryData(m.entry), match: m.match, inherited: m.inherited })),
        });
      }),
  );
}
