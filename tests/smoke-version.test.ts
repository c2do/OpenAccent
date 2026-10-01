import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SERVER_VERSION } from '../src/server/server.js';

const root = join(import.meta.dirname, '..');
const version = (file: string) => (JSON.parse(readFileSync(join(root, file), 'utf8')) as { version: string }).version;

describe('version', () => {
  it('is the same in package.json, manifest.json and the server', () => {
    expect(version('package.json')).toBe(SERVER_VERSION);
    expect(version('manifest.json')).toBe(SERVER_VERSION);
  });
});
