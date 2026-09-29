#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { readBundle } from '../core/bundle.js';
import { Dictionary } from '../core/dictionary.js';
import { FileMemoryStore, resolveMemoryPath } from '../core/memory/index.js';
import { buildPortablePrompt } from '../core/portable.js';
import { createServer } from './server.js';

// stdout is the MCP channel: log to stderr only.
const bundlePath = process.env.OPENACCENT_DICTIONARY_PATH ?? fileURLToPath(new URL('../dictionary.json', import.meta.url));
const dictionary = new Dictionary(readBundle(bundlePath));
const memory = new FileMemoryStore(resolveMemoryPath(), { dictionary });
// `openaccent-mcp export <dialect>` prints a portable prompt instead of starting the server.
if (process.argv[2] === 'export') {
  const dialect = process.argv[3] ?? memory.read().profile.dialect;
  if (!dialect) {
    console.error('Usage: openaccent-mcp export <dialect-id>   (e.g. ar-eg, es-mx, en-us-general)');
    process.exit(1);
  }
  console.log(buildPortablePrompt(dictionary, memory.read(), dialect));
} else {
  console.error(`OpenAccent: ${dictionary.bundle.entries.length} entries loaded; memory at ${memory.path}`);
  serveStdio(() => createServer({ dictionary, memory }));
}
