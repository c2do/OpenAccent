import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { RememberInput } from '../../core/memory.js';
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
        'kind="profile": dialect and/or region. kind="word": a word they say (optionally instead_of another). ' +
        'kind="correction": a wrong word and the right one. kind="style": a short preference.',
      inputSchema: z.object({
        kind: z.enum(['profile', 'word', 'correction', 'style']),
        dialect: z.string().optional().describe('profile: dialect ID, e.g. "ar-ps-fallahi"'),
        region: z.string().optional().describe('profile: town, village or region'),
        notes: z.string().optional().describe('profile: anything else worth knowing'),
        say: z.string().optional().describe('word: the word the user says'),
        instead_of: z.string().optional().describe('word: the word they use it instead of'),
        meaning: z.string().optional().describe('word: what it means'),
        wrong: z.string().optional().describe('correction: what you said'),
        right: z.string().optional().describe('correction: what the user says instead'),
        context: z.string().optional().describe('correction: when it applies'),
        text: z.string().optional().describe('style: the preference, e.g. "prefers short replies"'),
      }),
      outputSchema: z.looseObject({ created: z.boolean(), item: z.looseObject({ id: z.string() }) }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) =>
      guard(() => {
        let input: RememberInput;
        switch (args.kind) {
          case 'profile': {
            if (!args.dialect && !args.region && !args.notes) return fail('kind "profile" needs dialect, region or notes.');
            if (args.dialect) ctx.dictionary.branch(args.dialect); // throws with suggestions if unknown
            input = {
              kind: 'profile',
              ...(args.dialect ? { dialect: args.dialect } : {}),
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
        return ok(ctx, `${verb} (${result.item.id}).${hint}`, { created: result.created, item: result.item });
      }),
  );
}
