import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { buildBriefing } from '../../core/briefing.js';
import type { ServerContext } from '../context.js';
import { guard, ok } from '../respond.js';

export function registerGetBriefing(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_get_briefing',
    {
      title: 'Get the user’s dialect briefing',
      description:
        'Call this FIRST at the start of any conversation where the user writes in or asks about a dialect. ' +
        'Returns who the user is, which dialect they speak, their own words and past corrections (which override ' +
        'the dictionary), and the dialect guide including common AI mistakes. If there is no profile yet, it tells ' +
        'you how to set one up.',
      inputSchema: z.object({}),
      outputSchema: z.looseObject({ onboarding: z.boolean(), dialect: z.string().optional() }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async () =>
      guard(() => {
        const { text, ...data } = buildBriefing(ctx.dictionary, ctx.memory.read());
        return ok(ctx, text, data);
      }),
  );
}
