import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { attest, glossParts, readDodaCsv, readMaknuune, readUnimorph, sameMeaning } from '../../scripts/attest.js';

describe('readers', () => {
  it('UniMorph gloss files', () => {
    expect(readUnimorph('أَوِي\tADJ\tvery\n\nكُوَيِّس\tN\tgood\n', 'arz')).toEqual([
      { keys: ['اوي'], glosses: ['very'], ref: 'https://github.com/unimorph/arz' },
      { keys: ['كويس'], glosses: ['good'], ref: 'https://github.com/unimorph/arz' },
    ]);
  });

  it('Maknuune LaTeX entries: English senses before the first bullet only', () => {
    const tex =
      '{\\setlength\\topsep{0pt}\\textbf{\\foreignlanguage{arabic}{إِبْرِة}}\\ {\\color{gray}\\texttt{/\\sffamily {{\\sffamily ʔibre}}/}\\color{black}}\\ \\textsc{noun}\\ [f.]\\ \\textbf{1.}~needle  \\textbf{2.}~injection\\ \\ $\\bullet$\\ \\ \\textbf{1.}~very small.';
    expect(readMaknuune(tex)).toEqual([{ keys: ['ابره'], glosses: ['needle', 'injection'], ref: 'https://github.com/CAMeL-Lab/maknuune_lexicon' }]);
  });

  it('DODa CSVs: Arabizi spellings become Arabic candidates', () => {
    const [dima] = readDodaCsv('n1,n2,n3,n4,eng\ndima,dayman,,,always\n');
    expect(dima!.glosses).toEqual(['always']);
    expect(dima!.keys).toContain('ديما');
  });
});

describe('matching', () => {
  it('compares meanings by whole gloss parts', () => {
    expect(glossParts('to go; to leave (a place)')).toEqual(['go', 'leave']);
    expect(sameMeaning(['always, all the time'], ['always'])).toBe(true);
    expect(sameMeaning(['good'], ['good for nothing'])).toBe(false);
  });

  it('adds attested_by to confirmed entries only, once', () => {
    const root = mkdtempSync(join(tmpdir(), 'oa-attest-'));
    const dir = join(root, 'countries/ma/ar-ma/entries');
    mkdirSync(dir, { recursive: true });
    const entry = (word: string, en: string) =>
      stringify({ word, dialect: 'ar-ma', type: 'word', meanings: [{ en }], status: 'draft', source: { kind: 'dataset', name: 'wiktionary' } });
    writeFileSync(join(dir, 'dima.yaml'), entry('ديما', 'always'));
    writeFileSync(join(dir, 'daba.yaml'), entry('دابا', 'now'));
    const source = { name: 'doda-v1', dialects: ['ar-ma'], words: readDodaCsv('n1,eng\ndima,always\ndaba,later\n') };
    expect(attest(root, source).confirmed.map((c) => c.word)).toEqual(['ديما']);
    expect(attest(root, source).confirmed).toEqual([]); // already attested
    expect(readFileSync(join(dir, 'dima.yaml'), 'utf8')).toMatch(/attested_by:\n\s+- name: doda-v1/);
    expect(readFileSync(join(dir, 'daba.yaml'), 'utf8')).not.toMatch(/attested_by/);
  });
});
