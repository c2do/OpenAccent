import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { buildPortablePrompt } from '../../core/portable.js';
import type { ServerContext } from '../context.js';
import { fail, guard, ok, resolveDialect } from '../respond.js';

export function registerExportPrompt(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_export_prompt',
    {
      title: 'Export a portable dialect prompt',
      description:
        'Build a short text the user can paste into any AI’s custom instructions (Claude preferences, ChatGPT ' +
        'custom instructions, …) so it speaks their dialect everywhere, including on their phone, without OpenAccent ' +
        'installed. Includes their own words and corrections. Use when the user asks for a portable or shareable version.',
      inputSchema: z.object({
        dialect: z.string().optional().describe('Dialect ID. Defaults to the user’s dialect.'),
        max_chars: z.number().int().min(200).max(10000).default(1500).describe('Length limit (ChatGPT allows 1500)'),
      }),
      outputSchema: z.looseObject({ text: z.string(), dialect: z.string() }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ dialect, max_chars }) =>
      guard(() => {
        const d = resolveDialect(ctx, dialect);
        if (!d) return fail('No dialect given and the user has no profile yet. Pass "dialect" or call openaccent_get_briefing.');
        const text = buildPortablePrompt(ctx.dictionary, ctx.memory.read(), d, { maxChars: max_chars });
        return ok(ctx, `Copy this into your AI’s custom instructions:\n\n---\n${text}\n---`, { text, dialect: d, chars: text.length });
      }),
  );
}
