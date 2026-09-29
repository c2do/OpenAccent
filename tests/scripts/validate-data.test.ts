import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { validateData } from '../../scripts/validate-data.js';

let root: string;
afterEach(() => rmSync(root, { recursive: true, force: true }));

function write(rel: string, data: unknown) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof data === 'string' ? data : stringify(data));
}

const dialect = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: { en: id },
  script: 'arab',
  status: 'active',
  reviewers: ['rev'],
  ...extra,
});

const entry = (extra: Record<string, unknown> = {}) => ({
  word: 'حاكورة',
  dialect: 'ar-ps',
  type: 'word',
  meanings: [{ en: 'garden' }],
  status: 'draft',
  source: { kind: 'ai-draft' },
  ...extra,
});

/** A minimal valid data tree: ar -> ar-ps, one entry, sources list. */
function baseTree() {
  root = mkdtempSync(join(tmpdir(), 'oa-data-'));
  write('dialects/ar.yaml', dialect('ar'));
  write('dialects/ar-ps.yaml', dialect('ar-ps', { parent: 'ar' }));
  write('entries/ar-ps/hakoura.yaml', entry());
  write('sources.yaml', { allowed: { maknuune: { license: 'CC-BY-SA-4.0' } }, blocked: { madar: 'no' } });
}

const messages = () => validateData(root).map((e) => `${e.file}: ${e.message}`);

describe('validateData', () => {
  it('accepts a valid tree', () => {
    baseTree();
    expect(messages()).toEqual([]);
  });

  it('reports schema errors with the file path', () => {
    baseTree();
    write('entries/ar-ps/bad.yaml', entry({ meanings: [] }));
    const errs = messages();
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain('entries/ar-ps/bad.yaml');
    expect(errs[0]).toContain('meaning');
  });

  it('reports invalid YAML', () => {
    baseTree();
    write('entries/ar-ps/broken.yaml', 'word: [unclosed');
    expect(messages()[0]).toContain('entries/ar-ps/broken.yaml');
  });

  it('reports a dialect whose id does not match its file name', () => {
    baseTree();
    write('dialects/ar-xx.yaml', dialect('ar-yy', { parent: 'ar' }));
    expect(messages().join()).toContain('does not match file name');
  });

  it('reports an unknown parent', () => {
    baseTree();
    write('dialects/ar-eg.yaml', dialect('ar-eg', { parent: 'ar-nowhere' }));
    expect(messages().join()).toContain('Unknown parent dialect "ar-nowhere"');
  });

  it('reports a cycle in the dialect tree', () => {
    baseTree();
    write('dialects/ar.yaml', dialect('ar', { parent: 'ar-ps' }));
    expect(messages().join()).toContain('cycle');
  });

  it('reports an entry with an unknown dialect', () => {
    baseTree();
    write('entries/ar-nowhere/x.yaml', entry({ dialect: 'ar-nowhere' }));
    expect(messages().join()).toContain('Unknown dialect "ar-nowhere"');
  });

  it('reports an entry filed in the wrong folder', () => {
    baseTree();
    write('entries/ar/x.yaml', entry({ dialect: 'ar-ps', word: 'غير' }));
    expect(messages().join()).toContain('is in folder "ar"');
  });

  it('reports verified without verified_by', () => {
    baseTree();
    write('entries/ar-ps/hakoura.yaml', entry({ status: 'verified' }));
    expect(messages().join()).toContain('verified_by');
  });

  it('reports a verifier who is not a reviewer of that dialect', () => {
    baseTree();
    write('entries/ar-ps/hakoura.yaml', entry({ status: 'verified', verified_by: ['stranger'] }));
    expect(messages().join()).toContain('"stranger" is not a reviewer of ar-ps');
  });

  it('accepts a verifier listed as reviewer', () => {
    baseTree();
    write('entries/ar-ps/hakoura.yaml', entry({ status: 'verified', verified_by: ['rev'] }));
    expect(messages()).toEqual([]);
  });

  it('reports a duplicate word within one dialect', () => {
    baseTree();
    write('entries/ar-ps/hakoura-2.yaml', entry());
    expect(messages().join()).toContain('Duplicate word "حاكورة"');
  });

  it('allows the same word in different dialects', () => {
    baseTree();
    write('entries/ar/hakoura.yaml', entry({ dialect: 'ar' }));
    expect(messages()).toEqual([]);
  });

  it('reports a related ID that does not exist', () => {
    baseTree();
    write('entries/ar-ps/hakoura.yaml', entry({ related: ['ar-ps/missing'] }));
    expect(messages().join()).toContain('Unknown related entry "ar-ps/missing"');
  });

  it('reports blocked and unlisted datasets', () => {
    baseTree();
    write('entries/ar-ps/a.yaml', entry({ word: 'أ', source: { kind: 'dataset', name: 'madar' } }));
    write('entries/ar-ps/b.yaml', entry({ word: 'ب', source: { kind: 'dataset', name: 'mystery' } }));
    write('entries/ar-ps/c.yaml', entry({ word: 'ت', source: { kind: 'dataset', name: 'maknuune' } }));
    const errs = messages().join('\n');
    expect(errs).toContain('Dataset "madar" is blocked');
    expect(errs).toContain('Dataset "mystery" is not listed');
    expect(errs).not.toContain('maknuune');
  });

  it('reports entry slugs that are not lowercase ASCII', () => {
    baseTree();
    write('entries/ar-ps/Bad Name.yaml', entry({ word: 'ث' }));
    expect(messages().join()).toContain('File name must be a lowercase ASCII slug');
  });
});

describe('real data', () => {
  it('the repository data is valid', () => {
    const errors = validateData(join(import.meta.dirname, '../../data'));
    expect(errors).toEqual([]);
  });
});
