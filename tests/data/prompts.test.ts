import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { promptPages } from '../../scripts/build-prompts.js';

const root = join(import.meta.dirname, '../..');

describe('docs/prompts', () => {
  it('is up to date with the data (run: npx tsx scripts/build-prompts.ts)', () => {
    for (const [file, text] of Object.entries(promptPages(join(root, 'data')))) {
      const path = join(root, 'docs/prompts', file);
      expect(existsSync(path), file).toBe(true);
      expect(readFileSync(path, 'utf8'), file).toBe(text);
    }
  });

  it('keeps every prompt within ChatGPT’s 1,500-character field', () => {
    for (const [file, text] of Object.entries(promptPages(join(root, 'data')))) {
      const prompt = text.match(/```text\n([\s\S]*?)\n```/)?.[1];
      if (file !== 'README.md') expect(prompt?.length, file).toBeLessThanOrEqual(1500);
    }
  });
});
