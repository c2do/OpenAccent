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
        '(from the briefing, e.g. "c1", "w2"), a text to match, profile=true to clear their profile, or voice=true to forget what was learned from their messages.',
      inputSchema: z.object({
        ids: z.array(z.string()).optional().describe('Item IDs to delete, e.g. ["c1"]'),
        text: z.string().optional().describe('Delete words, corrections and style notes containing this text'),
        profile: z.boolean().optional().describe('Clear the saved dialect and region'),
        voice: z.boolean().optional().describe('Forget everything learned from the user’s messages (dialect mix, their words, how they write)'),
      }),
      outputSchema: ForgetResultSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ ids, text, profile, voice }) =>
      guard(() => {
        if (!ids?.length && !text && !profile && !voice) return fail('Pass "ids", "text", "profile" or "voice".');
        const removed = ctx.memory.forget({
          ...(ids ? { ids } : {}),
          ...(text ? { text } : {}),
          ...(profile ? { profile } : {}),
          ...(voice ? { voice } : {}),
        });
        const parts = [
          ...(removed.length ? [`Forgot ${removed.length} item(s): ${removed.map((r) => r.id).join(', ')}.`] : []),
          ...(voice ? ['Forgot what was learned from the user’s messages.'] : []),
        ];
        const msg = parts.length ? parts.join(' ') : 'Nothing matched.';
        return ok(ctx, msg, ForgetResultSchema, { removed });
      }),
  );
}
