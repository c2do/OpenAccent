import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { ForgetResultSchema } from '../../core/results.js';
import type { ServerContext } from '../context.js';
import { fail, guard, ok } from '../respond.js';

export function registerForget(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_forget',
    {
      title: 'Forget something from memory',
      description:
        'Delete items from the user’s personal memory, when they ask you to forget something. Pass item IDs ' +
        '(from the briefing, e.g. "c1", "w2"), a text to match, or profile=true to clear their profile.',
      inputSchema: z.object({
        ids: z.array(z.string()).optional().describe('Item IDs to delete, e.g. ["c1"]'),
        text: z.string().optional().describe('Delete words, corrections and style notes containing this text'),
        profile: z.boolean().optional().describe('Clear the saved dialect and region'),
      }),
      outputSchema: ForgetResultSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ ids, text, profile }) =>
      guard(() => {
        if (!ids?.length && !text && !profile) return fail('Pass "ids", "text" or "profile".');
        const removed = ctx.memory.forget({ ...(ids ? { ids } : {}), ...(text ? { text } : {}), ...(profile ? { profile } : {}) });
        const msg = removed.length ? `Forgot ${removed.length} item(s): ${removed.map((r) => r.id).join(', ')}.` : 'Nothing matched.';
        return ok(ctx, msg, ForgetResultSchema, { removed });
      }),
  );
}
