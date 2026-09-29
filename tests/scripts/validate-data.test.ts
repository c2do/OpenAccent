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

const PS = 'countries/ps';
const dialectFile = (id: string) => (id === 'ar' ? 'languages/ar/dialect.yaml' : `${PS}/${id}/dialect.yaml`);
const entryFile = (dialectId: string, slug: string) =>
  dialectId === 'ar' ? `languages/ar/entries/${slug}.yaml` : `${PS}/${dialectId}/entries/${slug}.yaml`;

/** A minimal valid data tree: languages/ar -> countries/ps/ar-ps, one entry, sources list. */
function baseTree() {
  root = mkdtempSync(join(tmpdir(), 'oa-data-'));
  write(`${PS}/country.yaml`, { code: 'ps', name: { en: 'Palestine' } });
  write(dialectFile('ar'), dialect('ar'));
  write(dialectFile('ar-ps'), dialect('ar-ps', { parent: 'ar' }));
  write(entryFile('ar-ps', 'hakoura'), entry());
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
    write(entryFile('ar-ps', 'bad'), entry({ meanings: [] }));
    const errs = messages();
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain('countries/ps/ar-ps/entries/bad.yaml');
    expect(errs[0]).toContain('meaning');
  });

  it('reports invalid YAML', () => {
    baseTree();
    write(entryFile('ar-ps', 'broken'), 'word: [unclosed');
    expect(messages()[0]).toContain('countries/ps/ar-ps/entries/broken.yaml');
  });

  it('reports a dialect whose id does not match its folder name', () => {
    baseTree();
    write(`${PS}/ar-xx/dialect.yaml`, dialect('ar-yy', { parent: 'ar' }));
    expect(messages().join()).toContain('does not match folder name');
  });

  it('reports a dialect folder without dialect.yaml', () => {
    baseTree();
    write(`${PS}/ar-zz/guide.md`, '# guide');
    expect(messages().join()).toContain('countries/ps/ar-zz: Dialect folder has no dialect.yaml');
  });

  it('reports a country folder without country.yaml, and a mismatched code', () => {
    baseTree();
    write('countries/eg/ar-eg/dialect.yaml', dialect('ar-eg', { parent: 'ar' }));
    write('countries/jo/country.yaml', { code: 'xx', name: { en: 'Jordan' } });
    const errs = messages().join('\n');
    expect(errs).toContain('countries/eg: Country folder has no country.yaml');
    expect(errs).toContain('Country code "xx" does not match folder name "jo"');
  });

  it('reports the same dialect defined twice', () => {
    baseTree();
    write('countries/jo/country.yaml', { code: 'jo', name: { en: 'Jordan' } });
    write('countries/jo/ar-ps/dialect.yaml', dialect('ar-ps', { parent: 'ar' }));
    expect(messages().join()).toContain('Dialect "ar-ps" is defined twice');
  });

  it('reports an unknown parent', () => {
    baseTree();
    write(`${PS}/ar-eg/dialect.yaml`, dialect('ar-eg', { parent: 'ar-nowhere' }));
    expect(messages().join()).toContain('Unknown parent dialect "ar-nowhere"');
  });

  it('reports a cycle in the dialect tree', () => {
    baseTree();
    write(dialectFile('ar'), dialect('ar', { parent: 'ar-ps' }));
    expect(messages().join()).toContain('cycle');
  });

  it('reports an entry with an unknown dialect', () => {
    baseTree();
    write(entryFile('ar-ps', 'x'), entry({ dialect: 'ar-nowhere', word: 'س' }));
    expect(messages().join()).toContain('Unknown dialect "ar-nowhere"');
  });

  it('reports an entry filed in the wrong folder', () => {
    baseTree();
    write(entryFile('ar', 'x'), entry({ dialect: 'ar-ps', word: 'غير' }));
    expect(messages().join()).toContain('is in folder "ar"');
  });

  it('reports verified without verified_by', () => {
    baseTree();
    write(entryFile('ar-ps', 'hakoura'), entry({ status: 'verified' }));
    expect(messages().join()).toContain('verified_by');
  });

  it('reports a verifier who is not a reviewer of that dialect', () => {
    baseTree();
    write(entryFile('ar-ps', 'hakoura'), entry({ status: 'verified', verified_by: ['stranger'] }));
    expect(messages().join()).toContain('"stranger" is not a reviewer of ar-ps');
  });

  it('accepts a verifier listed as reviewer', () => {
    baseTree();
    write(entryFile('ar-ps', 'hakoura'), entry({ status: 'verified', verified_by: ['rev'] }));
    expect(messages()).toEqual([]);
  });

  it('reports a duplicate word within one dialect', () => {
    baseTree();
    write(entryFile('ar-ps', 'hakoura-2'), entry());
    expect(messages().join()).toContain('Duplicate word "حاكورة"');
  });

  it('allows the same word in different dialects', () => {
    baseTree();
    write(entryFile('ar', 'hakoura'), entry({ dialect: 'ar' }));
    expect(messages()).toEqual([]);
  });

  it('reports a related ID that does not exist', () => {
    baseTree();
    write(entryFile('ar-ps', 'hakoura'), entry({ related: ['ar-ps/missing'] }));
    expect(messages().join()).toContain('Unknown related entry "ar-ps/missing"');
  });

  it('reports blocked and unlisted datasets', () => {
    baseTree();
    write(entryFile('ar-ps', 'a'), entry({ word: 'أ', source: { kind: 'dataset', name: 'madar' } }));
    write(entryFile('ar-ps', 'b'), entry({ word: 'ب', source: { kind: 'dataset', name: 'mystery' } }));
    write(entryFile('ar-ps', 'c'), entry({ word: 'ت', source: { kind: 'dataset', name: 'maknuune' } }));
    const errs = messages().join('\n');
    expect(errs).toContain('Dataset "madar" is blocked');
    expect(errs).toContain('Dataset "mystery" is not listed');
    expect(errs).not.toContain('maknuune');
  });

  it('reports entry slugs that are not lowercase ASCII', () => {
    baseTree();
    write(entryFile('ar-ps', 'Bad Name'), entry({ word: 'ث' }));
    expect(messages().join()).toContain('File name must be a lowercase ASCII slug');
  });
});

describe('empty or missing data root', () => {
  it('reports a root without dialects', () => {
    root = mkdtempSync(join(tmpdir(), 'oa-empty-'));
    expect(messages()).toEqual(['dialects: No dialect files found — is this the data folder?']);
  });
});

describe('real data', () => {
  it('the repository data is valid', () => {
    const errors = validateData(join(import.meta.dirname, '../../data'));
    expect(errors).toEqual([]);
  });
});
