import { McpServer } from '@modelcontextprotocol/server';
import type { ServerContext } from './context.js';
import { registerCheckReply } from './tools/check-reply.js';
import { registerDialectCard } from './tools/dialect-card.js';
import { registerExportPrompt } from './tools/export-prompt.js';
import { registerExpress } from './tools/express.js';
import { registerForget } from './tools/forget.js';
import { registerGetBriefing } from './tools/get-briefing.js';
import { registerListDialects } from './tools/list-dialects.js';
import { registerLookup } from './tools/lookup.js';
import { registerRemember } from './tools/remember.js';
import { registerSuggestEntry } from './tools/suggest-entry.js';

export const SERVER_VERSION = '0.1.0';

/** Builds an OpenAccent MCP server. One instance per connection; the context is shared. */
export function createServer(ctx: ServerContext): McpServer {
  const server = new McpServer(
    { name: 'openaccent', version: SERVER_VERSION },
    {
      capabilities: { tools: {} },
      // Claude's apps currently ignore this, which is why the tools themselves carry the guidance.
      instructions:
        'OpenAccent helps you speak the user’s dialect. Call openaccent_get_briefing at the start of any ' +
        'conversation in a dialect, check replies with openaccent_check_reply, and save corrections with openaccent_remember.',
    },
  );
  registerGetBriefing(server, ctx);
  registerLookup(server, ctx);
  registerExpress(server, ctx);
  registerListDialects(server, ctx);
  registerRemember(server, ctx);
  registerForget(server, ctx);
  registerSuggestEntry(server, ctx);
  registerCheckReply(server, ctx);
  registerExportPrompt(server, ctx);
  registerDialectCard(server, ctx);
  return server;
}
