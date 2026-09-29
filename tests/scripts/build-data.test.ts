import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { buildBundle, writeBundle } from '../../scripts/build-data.js';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'oa-build-'));
  const write = (rel: string, data: unknown) => {
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, typeof data === 'string' ? data : stringify(data));
  };
  write('dialects/ar.yaml', { id: 'ar', name: { en: 'Arabic' }, script: 'arab', status: 'proposed' });
  write('dialects/ar-ps.yaml', { id: 'ar-ps', parent: 'ar', name: { en: 'Pal' }, script: 'arab', status: 'active' });
  const entry = (word: string) => ({
    word,
    dialect: 'ar-ps',
    type: 'word',
    meanings: [{ en: word }],
    status: 'draft',
    source: { kind: 'ai-draft' },
  });
  write('entries/ar-ps/zeit.yaml', entry('زيت'));
  write('entries/ar-ps/hakoura.yaml', entry('حاكورة'));
  write('guides/ar-ps.md', '# Palestinian\n\n## Pronunciation\n\nq → ʔ\n');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('buildBundle', () => {
  it('compiles dialects, entries with IDs, and guides', () => {
    const bundle = buildBundle(root);
    expect(bundle.formatVersion).toBe(1);
    expect(bundle.dialects.map((d) => d.id)).toEqual(['ar', 'ar-ps']);
    expect(bundle.entries.map((e) => e.id)).toEqual(['ar-ps/hakoura', 'ar-ps/zeit']);
    expect(bundle.entries[0]?.familiarity).toBe('common');
    expect(bundle.guides['ar-ps']).toContain('## Pronunciation');
  });

  it('is deterministic apart from builtAt', () => {
    const a = { ...buildBundle(root), builtAt: '' };
    const b = { ...buildBundle(root), builtAt: '' };
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('refuses to build invalid data', () => {
    writeFileSync(join(root, 'entries/ar-ps/bad.yaml'), stringify({ word: 'x' }));
    expect(() => buildBundle(root)).toThrow(/entries\/ar-ps\/bad\.yaml/);
  });

  it('writes the bundle to disk', () => {
    const out = join(root, 'out/dictionary.json');
    writeBundle(buildBundle(root), out);
    expect(JSON.parse(readFileSync(out, 'utf8')).entries).toHaveLength(2);
  });
});
