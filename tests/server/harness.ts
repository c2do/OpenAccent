import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import type { Bundle } from '../../src/core/bundle.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { FileMemoryStore } from '../../src/core/memory/index.js';
import { createServer } from '../../src/server/server.js';
import { fixtureBundle } from '../fixtures/bundle.js';

export interface Harness {
  client: Client;
  memoryPath: string;
  call(name: string, args?: Record<string, unknown>): Promise<{ text: string; data: any; isError: boolean }>;
  close(): Promise<void>;
}

/** An MCP client connected in-memory to a fresh OpenAccent server. */
export async function connect(opts: { bundle?: Bundle; memoryPath?: string } = {}): Promise<Harness> {
  const memoryPath = opts.memoryPath ?? join(mkdtempSync(join(tmpdir(), 'oa-srv-')), 'memory.json');
  const server = createServer({
    dictionary: new Dictionary(opts.bundle ?? fixtureBundle()),
    memory: new FileMemoryStore(memoryPath),
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test', version: '0.0.0' });
  await client.connect(clientTransport);
  return {
    client,
    memoryPath,
    async call(name, args = {}) {
      const r = await client.callTool({ name, arguments: args });
      const text = (r.content as { type: string; text: string }[]).map((c) => c.text).join('\n');
      return { text, data: r.structuredContent, isError: Boolean(r.isError) };
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}
