import { describe, expect, it } from 'vitest';
import { McpServer, InMemoryTransport } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { z } from 'zod';

describe('MCP SDK smoke test', () => {
  it('a client can connect to a server and call a tool', async () => {
    const server = new McpServer({ name: 'openaccent-smoke', version: '0.0.0' });
    server.registerTool(
      'echo',
      { description: 'Echo text back', inputSchema: z.object({ text: z.string() }) },
      async ({ text }) => ({ content: [{ type: 'text', text }] }),
    );

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    const client = new Client({ name: 'test-client', version: '0.0.0' });
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(['echo']);

    const result = await client.callTool({ name: 'echo', arguments: { text: 'مرحبا' } });
    expect(result.content).toEqual([{ type: 'text', text: 'مرحبا' }]);

    await client.close();
    await server.close();
  });
});
