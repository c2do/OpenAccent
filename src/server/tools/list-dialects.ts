import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { ListDialectsResultSchema } from '../../core/results.js';
import type { ServerContext } from '../context.js';
import { guard, ok } from '../respond.js';

export function registerListDialects(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_list_dialects',
    {
      title: 'List dialects',
      description:
        'List every dialect in the dictionary as a tree, with how many entries each has and how many are verified ' +
        'by native speakers. Use it to find dialect IDs.',
      inputSchema: z.object({}),
      outputSchema: ListDialectsResultSchema,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async () =>
      guard(() => {
        const list = ctx.dictionary.listDialects();
        const byParent = new Map<string | undefined, typeof list>();
        for (const d of list) byParent.set(d.parent, [...(byParent.get(d.parent) ?? []), d]);
        const lines: string[] = [];
        const walk = (parent: string | undefined, depth: number) => {
          for (const d of (byParent.get(parent) ?? []).sort((a, b) => a.id.localeCompare(b.id))) {
            const name = `${d.name.en}${d.name.ar ? ` (${d.name.ar})` : ''}`;
            const stats = d.entries ? `${d.entries} entries, ${d.verifiedPercent}% verified` : 'no entries yet';
            lines.push(`${'  '.repeat(depth)}- \`${d.id}\` ${name} · ${stats}${d.status === 'proposed' ? ' · proposed' : ''}`);
            walk(d.id, depth + 1);
          }
        };
        walk(undefined, 0);
        return ok(ctx, `Dialects:\n${lines.join('\n')}`, ListDialectsResultSchema, { dialects: list });
      }),
  );
}
