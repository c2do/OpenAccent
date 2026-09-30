import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { parse } from 'yaml';
import {
  attestFromCorpus,
  corpusEvidence,
  passes,
  readFlores,
  readTatoeba,
  reportTsv,
  sentenceForms,
  supportingPairs,
  wilsonLow,
  type Corpus,
  type ReportRow,
} from '../../scripts/attest-corpus.js';

const pairs = (list: [string, string][]) => list.map(([d, e]) => ({ forms: sentenceForms(d), english: e.toLowerCase() }));

describe('supportingPairs', () => {
  it('counts pairs with the word (also behind clitics) and its meaning in the translation', () => {
    const p = pairs([
      ['دلوقتي هنروح', 'we will go now'],
      ['ودلوقتي خلاص', 'and now it is over'],
      ['دلوقتي', 'at this moment'],
      ['بكرة', 'now tomorrow'],
    ]);
    expect(supportingPairs(['دلوقتي'], ['now; at the moment'], p)).toBe(2);
  });

  it('matches whole English words only', () => {
    expect(supportingPairs(['كار'], ['car'], pairs([['كار', 'a scarf'], ['كار', 'cards'], ['كار', 'two cars']]))).toBe(1);
  });
});

describe('readers and attesting', () => {
  it('reads FLORES by line number and Tatoeba through links, and attests with two supporting pairs', () => {
    const root = mkdtempSync(join(tmpdir(), 'oa-corpus-'));
    const flores = join(root, 'flores');
    for (const split of ['dev', 'devtest']) mkdirSync(join(flores, split), { recursive: true });
    writeFileSync(join(flores, 'dev', 'eng_Latn.dev'), 'We go now.\nIt is cold.\n');
    writeFileSync(join(flores, 'dev', 'acm_Arab.dev'), 'هسه نروح\nالجو بارد\n');
    writeFileSync(join(flores, 'devtest', 'eng_Latn.devtest'), 'Come now!\n');
    writeFileSync(join(flores, 'devtest', 'acm_Arab.devtest'), 'تعال هسه\n');
    expect(readFlores(flores).pairs.get('ar-iq')).toHaveLength(3);

    const tat = join(root, 'tatoeba');
    mkdirSync(tat);
    writeFileSync(join(tat, 'arq_sentences.tsv'), '1\tarq\tدرك نجي\n');
    writeFileSync(join(tat, 'eng_sentences.tsv'), '2\teng\tI am coming now.\n');
    writeFileSync(join(tat, 'links.csv'), '1\t2\n');
    expect(readTatoeba(tat).pairs.get('ar-dz')).toEqual([{ dialect: 'درك نجي', english: 'I am coming now.' }]);

    const data = join(root, 'data');
    const dir = join(data, 'countries/iq/ar-iq/entries');
    mkdirSync(dir, { recursive: true });
    const entry = { word: 'هسه', dialect: 'ar-iq', type: 'word', meanings: [{ en: 'now' }], status: 'draft', source: { kind: 'ai-draft' } };
    writeFileSync(join(dir, 'hassa.yaml'), stringify(entry));
    // Three sentences are far too few for the real thresholds; this test is about reading and writing.
    const loose = { minSupport: 2, minPrecision: 0, minLift: 0, strongSupport: 2, strongLift: 0 };
    const report = attestFromCorpus(data, { ...readFlores(flores), revision: 'abc123' }, { thresholds: loose, runId: '42' });
    expect(report.find((r) => r.dialect === 'ar-iq')).toMatchObject({ pairs: 3, confirmed: ['هسه'] });
    expect(parse(readFileSync(join(dir, 'hassa.yaml'), 'utf8')).attested_by).toEqual([
      {
        name: 'flores',
        ref: 'https://github.com/facebookresearch/flores',
        method: 'parallel-corpus',
        method_version: 2,
        support: 2,
        occurrences: 2,
        precision: 1,
        lift: 1.5,
        run_id: '42',
        source_revision: 'abc123',
      },
    ]);
  });
});

// A made-up Iraqi corpus: ولد is always translated "boy", and three of its sentences are also about a house.
const iraqi = (): Corpus => {
  const list: { dialect: string; english: string }[] = [];
  for (let i = 0; i < 7; i++) list.push({ dialect: `الولد لعب ${i}`, english: `The boy played ${i}.` });
  for (let i = 0; i < 3; i++) list.push({ dialect: `الولد بالبيت ${i}`, english: `The boy is in the house ${i}.` });
  for (let i = 0; i < 4; i++) list.push({ dialect: `البيت كبير ${i}`, english: `The house is big ${i}.` });
  for (let i = 0; i < 30; i++) list.push({ dialect: `جملة ثانية ${i}`, english: `Another sentence ${i}.` });
  return { name: 'flores', ref: 'https://github.com/facebookresearch/flores', pairs: new Map([['ar-iq', list]]) };
};

describe('attestation v2: evidence, not co-occurrence', () => {
  it('computes a Wilson lower bound that does not trust tiny samples', () => {
    expect(wilsonLow(0, 0)).toBe(0);
    expect(wilsonLow(2, 2)).toBeCloseTo(0.55, 2);
    expect(wilsonLow(20, 20)).toBeGreaterThan(0.9);
    expect(wilsonLow(3, 10)).toBeLessThan(0.3);
  });

  it('measures support, occurrences, precision and lift', () => {
    const p = iraqi().pairs.get('ar-iq')!.map((x) => ({ forms: sentenceForms(x.dialect), english: x.english.toLowerCase() }));
    const boy = corpusEvidence(['ولد'], ['boy'], p, 10 / 44);
    expect(boy).toMatchObject({ support: 10, explained: 0, occurrences: 10, precision: 1 });
    expect(boy.lift).toBeCloseTo(4.4, 1);
    expect(passes(boy)).toBe(true);
  });

  it('rejects a pairing that only co-occurs: ولد is not "house", though they share 3 sentences', () => {
    const p = iraqi().pairs.get('ar-iq')!.map((x) => ({ forms: sentenceForms(x.dialect), english: x.english.toLowerCase() }));
    expect(supportingPairs(['ولد'], ['house'], p)).toBe(3); // v1 would have attested it
    const wrong = corpusEvidence(['ولد'], ['house'], p, 7 / 44);
    expect(wrong.precision).toBeCloseTo(0.3, 5);
    expect(passes(wrong)).toBe(false);
    const right = corpusEvidence(['بيت'], ['house'], p, 7 / 44);
    expect(passes(right)).toBe(true);
  });

  it('explains a match away when another word with that meaning is in the sentence', () => {
    const p = iraqi().pairs.get('ar-iq')!.map((x) => ({ forms: sentenceForms(x.dialect), english: x.english.toLowerCase() }));
    // Even with 3 of 3 (had ولد only appeared next to بيت), بيت explains every match.
    const wrong = corpusEvidence(['ولد'], ['house'], p, 7 / 44, new Set(['بيت']));
    expect(wrong).toMatchObject({ support: 0, explained: 3 });
    expect(passes(wrong)).toBe(false);
  });

  it('accepts a correct word whose translations often use a synonym, when lift is strong', () => {
    // كبير "big" appears in 12 sentences; only 4 translations say "big" (others say "large", "great").
    const p = [
      ...Array.from({ length: 4 }, (_, i) => ({ forms: sentenceForms(`بيت كبير ${i}`), english: `a big house ${i}` })),
      ...Array.from({ length: 8 }, (_, i) => ({ forms: sentenceForms(`شي كبير ${i}`), english: `a large thing ${i}` })),
      ...Array.from({ length: 400 }, (_, i) => ({ forms: sentenceForms(`جملة ${i}`), english: `a sentence ${i}` })),
    ];
    const big = corpusEvidence(['كبير'], ['big'], p, 4 / 412);
    expect(big.precisionLow).toBeLessThan(0.2);
    expect(big.lift).toBeGreaterThan(20);
    expect(passes(big)).toBe(true);
  });

  it('rejects a meaning that is in every translation anyway (low lift)', () => {
    const p = Array.from({ length: 20 }, (_, i) => ({ forms: sentenceForms(i < 5 ? `رحت ${i}` : `مشيت ${i}`), english: `we go ${i}` }));
    const e = corpusEvidence(['رحت'], ['go'], p, 1);
    expect(e).toMatchObject({ support: 5, precision: 1, lift: 1 });
    expect(passes(e)).toBe(false);
  });

  it('recomputes: a v1 attestation that fails v2 is removed, one that passes is replaced with the evidence', () => {
    const data = mkdtempSync(join(tmpdir(), 'oa-v2-'));
    const dir = join(data, 'countries/iq/ar-iq/entries');
    mkdirSync(dir, { recursive: true });
    const v1 = { name: 'flores', ref: 'https://github.com/facebookresearch/flores (3 sentence pairs)', method: 'parallel-corpus', method_version: 1, support: 3 };
    const base = { dialect: 'ar-iq', type: 'word', status: 'draft', source: { kind: 'ai-draft' } };
    writeFileSync(join(dir, 'walad.yaml'), stringify({ ...base, word: 'ولد', meanings: [{ en: 'house' }], attested_by: [v1] }));
    writeFileSync(join(dir, 'bait.yaml'), stringify({ ...base, word: 'بيت', meanings: [{ en: 'house' }], attested_by: [v1, { name: 'maknuune', method: 'dictionary-match', method_version: 1 }] }));
    const rows: ReportRow[] = [];
    const [iq] = attestFromCorpus(data, iraqi(), { rows }).filter((r) => r.dialect === 'ar-iq');
    expect(iq).toMatchObject({ confirmed: ['بيت'], removed: ['ولد'] });
    expect(parse(readFileSync(join(dir, 'walad.yaml'), 'utf8')).attested_by).toBeUndefined();
    const bait = parse(readFileSync(join(dir, 'bait.yaml'), 'utf8')).attested_by;
    expect(bait.map((a: { name: string; method_version: number }) => `${a.name} v${a.method_version}`)).toEqual(['maknuune v1', 'flores v2']);
    expect(rows.map((r) => `${r.word}:${r.decision}`).sort()).toEqual(['بيت:kept', 'ولد:removed']);
    expect(reportTsv(rows).split('\n')[0]).toMatch(/^corpus\tdialect\tword\tdecision\tsupport/);
  });

  it('leaves an attestation alone when a rerun finds the same evidence', () => {
    const data = mkdtempSync(join(tmpdir(), 'oa-v2-'));
    const dir = join(data, 'countries/iq/ar-iq/entries');
    mkdirSync(dir, { recursive: true });
    const base = { dialect: 'ar-iq', type: 'word', status: 'draft', source: { kind: 'ai-draft' } };
    writeFileSync(join(dir, 'bait.yaml'), stringify({ ...base, word: 'بيت', meanings: [{ en: 'house' }] }));
    attestFromCorpus(data, iraqi(), { runId: '1' });
    const first = readFileSync(join(dir, 'bait.yaml'), 'utf8');
    expect(first).toContain('run_id: "1"');
    attestFromCorpus(data, iraqi(), { runId: '2' });
    expect(readFileSync(join(dir, 'bait.yaml'), 'utf8')).toBe(first);
  });
});
