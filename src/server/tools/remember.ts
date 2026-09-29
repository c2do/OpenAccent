import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { MEMORY_LIMITS, type RememberInput } from '../../core/memory/index.js';

const max = MEMORY_LIMITS.chars;
import { RememberResultSchema } from '../../core/results.js';
import type { ServerContext } from '../context.js';
import { fail, guard, ok } from '../respond.js';

export function registerRemember(server: McpServer, ctx: ServerContext) {
  server.registerTool(
    'openaccent_remember',
    {
      title: 'Remember how the user speaks',
      description:
        'Save something about how the user speaks, on their own device. Call it right away whenever the user ' +
        'corrects your dialect ("we say X, not Y"), tells you their dialect or village, or states a style preference. ' +
        'kind="profile": dialect, other dialects they also speak (also_speaks), and/or region. kind="word": a word they say (optionally instead_of another). ' +
        'kind="correction": a wrong word and the right one. kind="style": a short preference.',
      inputSchema: z.object({
        kind: z.enum(['profile', 'word', 'correction', 'style']),
        dialect: z.string().max(max.dialect).optional().describe('profile: dialect ID, e.g. "ar-ps-fallahi"'),
        also_speaks: z
          .array(z.string().max(max.dialect))
          .max(5)
          .optional()
          .describe('profile: other dialects the user speaks too, e.g. ["ar-eg"]. Their words are never flagged as mistakes.'),
        region: z.string().max(max.region).optional().describe('profile: town, village or region'),
        notes: z.string().max(max.notes).optional().describe('profile: anything else worth knowing'),
        say: z.string().max(max.say).optional().describe('word: the word the user says'),
        instead_of: z.string().max(max.instead_of).optional().describe('word: the word they use it instead of'),
        meaning: z.string().max(max.meaning).optional().describe('word: what it means'),
        wrong: z.string().max(max.wrong).optional().describe('correction: what you said'),
        right: z.string().max(max.right).optional().describe('correction: what the user says instead'),
        context: z.string().max(max.context).optional().describe('correction: when it applies'),
        text: z.string().max(max.text).optional().describe('style: the preference, e.g. "prefers short replies"'),
      }),
      outputSchema: RememberResultSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) =>
      guard(() => {
        let input: RememberInput;
        switch (args.kind) {
          case 'profile': {
            if (!args.dialect && !args.region && !args.notes && !args.also_speaks) {
              return fail('kind "profile" needs dialect, also_speaks, region or notes.');
            }
            // Unknown dialects throw here, with suggestions.
            for (const d of [...(args.dialect ? [args.dialect] : []), ...(args.also_speaks ?? [])]) ctx.dictionary.branch(d);
            input = {
              kind: 'profile',
              ...(args.dialect ? { dialect: args.dialect } : {}),
              ...(args.also_speaks ? { dialects: args.also_speaks } : {}),
              ...(args.region ? { region: args.region } : {}),
              ...(args.notes ? { notes: args.notes } : {}),
            };
            break;
          }
          case 'word':
            if (!args.say) return fail('kind "word" needs "say".');
            input = {
              kind: 'word',
              say: args.say,
              ...(args.instead_of ? { instead_of: args.instead_of } : {}),
              ...(args.meaning ? { meaning: args.meaning } : {}),
            };
            break;
          case 'correction':
            if (!args.wrong || !args.right) return fail('kind "correction" needs "wrong" and "right".');
            input = { kind: 'correction', wrong: args.wrong, right: args.right, ...(args.context ? { context: args.context } : {}) };
            break;
          case 'style':
            if (!args.text) return fail('kind "style" needs "text".');
            input = { kind: 'style', text: args.text };
            break;
        }
        const result = ctx.memory.remember(input);
        const verb = result.created ? 'Saved' : 'Updated';
        const hint =
          args.kind === 'correction' || args.kind === 'word'
            ? ' If this could help others who speak this dialect, you can offer to share it with openaccent_suggest_entry (only if the user agrees).'
            : '';
        return ok(ctx, `${verb} (${result.item.id}).${hint}`, RememberResultSchema, { created: result.created, item: result.item });
      }),
  );
}
