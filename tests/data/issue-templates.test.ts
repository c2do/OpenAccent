import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ISSUE_FIELD_IDS } from '../../src/core/links.js';

const dir = join(import.meta.dirname, '../../.github/ISSUE_TEMPLATE');
const ids = (file: string) =>
  (parse(readFileSync(join(dir, file), 'utf8')) as { body: { id?: string }[] }).body.map((b) => b.id).filter(Boolean);

describe('issue forms', () => {
  it('have a field for everything suggest_entry pre-fills', () => {
    for (const file of ['add-word.yml', 'fix-word.yml']) {
      for (const id of ISSUE_FIELD_IDS) expect(ids(file), `${file}: ${id}`).toContain(id);
    }
  });

  it('exist for every link in the prompt pages', () => {
    for (const file of ['feedback.yml', 'reviewer.yml', 'add-word.yml']) expect(ids(file).length, file).toBeGreaterThan(0);
  });
});
