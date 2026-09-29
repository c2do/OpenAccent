import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { buildSuggestionUrl } from '../../core/links.js';
import type { ServerContext } from '../context.js';
import { guard, ok, resolveDialect } from '../respond.js';

export function registerSuggestEntry(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_suggest_entry',
    {
      title: 'Suggest a word for the public dictionary',
      description:
        'Build a pre-filled link the user can open to add a word to the public OpenAccent dictionary, or to fix one. ' +
        'Only call this after the user agreed to share. Nothing is sent: the user reviews and submits the form themselves.',
      inputSchema: z.object({
        action: z.enum(['add', 'fix']).default('add'),
        word: z.string().min(1),
        dialect: z.string().optional().describe('Dialect ID. Defaults to the user’s dialect.'),
        meaning_ar: z.string().optional(),
        meaning_en: z.string().optional(),
        example: z.string().optional(),
        spellings: z.string().optional().describe('Other spellings, comma-separated'),
        romanized: z.string().optional().describe('Latin-script forms, comma-separated'),
        notes: z.string().optional(),
      }),
      outputSchema: z.looseObject({ url: z.string() }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ action, dialect, ...fields }) =>
      guard(() => {
        const d = resolveDialect(ctx, dialect);
        if (d) ctx.dictionary.branch(d);
        const link = buildSuggestionUrl(action === 'fix' ? 'fix-word' : 'add-word', { ...fields, ...(d ? { dialect: d } : {}) });
        return ok(ctx, `Link for the user to open:\n${link.url}\n\n${link.note}`, { ...link });
      }),
  );
}
