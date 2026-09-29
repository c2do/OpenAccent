import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { DialectSchema } from '../../src/core/schema.js';

const dir = join(import.meta.dirname, '../../data/dialects');
const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'));

describe('data/dialects', () => {
  it('has the v0.1 dialect tree', () => {
    expect(files.length).toBe(14);
  });

  it.each(files)('%s parses and its id matches the file name', (file) => {
    const dialect = DialectSchema.parse(parse(readFileSync(join(dir, file), 'utf8')));
    expect(dialect.id).toBe(file.replace(/\.yaml$/, ''));
  });

  it('only fallahi and fallahi-kaf are active in v0.1', () => {
    const active = files
      .map((f) => DialectSchema.parse(parse(readFileSync(join(dir, f), 'utf8'))))
      .filter((d) => d.status === 'active')
      .map((d) => d.id);
    expect(active.sort()).toEqual(['ar-ps-fallahi', 'ar-ps-fallahi-kaf']);
  });
});
