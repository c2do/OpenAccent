#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { readBundle } from '../core/bundle.js';
import { Dictionary } from '../core/dictionary.js';
import { FileMemoryStore, resolveMemoryPath } from '../core/memory.js';
import { createServer } from './server.js';

// stdout is the MCP channel: log to stderr only.
const bundlePath = process.env.OPENACCENT_DICTIONARY_PATH ?? fileURLToPath(new URL('../dictionary.json', import.meta.url));
const dictionary = new Dictionary(readBundle(bundlePath));
const memory = new FileMemoryStore(resolveMemoryPath());
console.error(`OpenAccent: ${dictionary.bundle.entries.length} entries loaded; memory at ${memory.path}`);

serveStdio(() => createServer({ dictionary, memory }));
