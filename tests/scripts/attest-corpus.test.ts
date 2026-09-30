import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { attestFromCorpus, readFlores, readTatoeba, sentenceForms, supportingPairs } from '../../scripts/attest-corpus.js';

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
    const report = attestFromCorpus(data, readFlores(flores));
    expect(report.find((r) => r.dialect === 'ar-iq')).toMatchObject({ pairs: 3, confirmed: ['هسه'] });
    expect(readFileSync(join(dir, 'hassa.yaml'), 'utf8')).toMatch(/name: flores\n\s+ref: .*\(2 sentence pairs\)/);
  });
});
