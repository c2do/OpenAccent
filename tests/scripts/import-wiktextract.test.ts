import { describe, expect, it } from 'vitest';
import { collect, isRealExample, kaikkiUrl, readFrequency, selectSenses, toEntries, WAVE_1 } from '../../scripts/import-wiktextract.js';

const esMx = WAVE_1.find((c) => c.dialect === 'es-mx')!;
const arEg = WAVE_1.find((c) => c.dialect === 'ar-eg')!;

const line = (o: object) => JSON.stringify({ lang: 'Spanish', ...o });
const LINES = [
  line({
    word: 'nel',
    pos: 'adv',
    senses: [
      {
        glosses: ['no; no way; nope'],
        tags: ['Mexico', 'slang'],
        examples: [
          { text: '–¿Irás a la fiesta? –Nel.', english: '–Will you go? –Nope.', type: 'example' },
          { text: 'A long quotation from a newspaper.', type: 'quote' },
        ],
      },
    ],
  }),
  line({ word: 'coche', pos: 'noun', senses: [{ glosses: ['car'], tags: ['Spain'] }] }),
  line({ word: 'camión', pos: 'noun', senses: [{ glosses: ['bus'], tags: ['Mexico'] }, { glosses: ['truck'] }] }),
  line({ word: 'México', pos: 'name', senses: [{ glosses: ['Mexico'], tags: ['Mexico'] }] }),
  line({ word: 'nopal', pos: 'noun', senses: [{ glosses: ['an old sense'], tags: ['Mexico', 'obsolete'] }] }),
  line({ word: 'camiones', pos: 'noun', senses: [{ glosses: ['plural of camión'], tags: ['Mexico'], form_of: [{ word: 'camión' }] }] }),
  '{"truncated',
];

describe('selectSenses', () => {
  it('keeps region-tagged senses and drops names, obsolete senses and inflected forms', () => {
    expect(selectSenses(JSON.parse(LINES[2]!), esMx).map((s) => s.glosses)).toEqual([['bus']]);
    expect(selectSenses(JSON.parse(LINES[3]!), esMx)).toEqual([]);
    expect(selectSenses(JSON.parse(LINES[4]!), esMx)).toEqual([]);
    expect(selectSenses(JSON.parse(LINES[5]!), esMx)).toEqual([]);
  });

  it('keeps every sense when the dialect has no region tags (dialect-specific files)', () => {
    expect(selectSenses({ word: 'ازيك', pos: 'intj', senses: [{ glosses: ['how are you?'] }] }, arEg)).toHaveLength(1);
  });
});

describe('collect + toEntries', () => {
  it('builds draft entries that cite Wiktionary, with examples but no quotations', async () => {
    const byDialect = await collect(LINES, [esMx]);
    const out = toEntries(byDialect.get('es-mx')!, esMx, { limit: 10 });
    expect(out.map((o) => o.slug).sort()).toEqual(['camion', 'nel']);
    const nel = out.find((o) => o.slug === 'nel')!.entry;
    expect(nel).toMatchObject({
      word: 'nel',
      dialect: 'es-mx',
      register: 'casual',
      status: 'draft',
      source: { kind: 'dataset', name: 'wiktionary', ref: 'https://en.wiktionary.org/wiki/nel#Spanish', license: 'CC-BY-SA-4.0' },
    });
    expect(nel.meanings[0]?.examples).toEqual([{ text: '–¿Irás a la fiesta? –Nel.', en: '–Will you go? –Nope.' }]);
  });

  it('ranks by frequency, applies the limit and skips words the dialect already has', async () => {
    const byDialect = await collect(LINES, [esMx]);
    const ranks = readFrequency('nel 900\ncamión 10\n', 'latn');
    const out = toEntries(byDialect.get('es-mx')!, esMx, { limit: 1, ranks });
    expect(out.map((o) => o.entry.word)).toEqual(['nel']);
    expect(toEntries(byDialect.get('es-mx')!, esMx, { limit: 2, ranks }).map((o) => o.entry.word)).toEqual(['nel', 'camión']);
    const skipped = toEntries(byDialect.get('es-mx')!, esMx, { limit: 5, existingWords: new Set(['nel']) });
    expect(skipped.map((o) => o.entry.word)).toEqual(['camión']);
  });

  it('serves several dialects from one pass', async () => {
    const esEs = WAVE_1.find((c) => c.dialect === 'es-es')!;
    const byDialect = await collect(LINES, [esMx, esEs]);
    expect([...byDialect.get('es-es')!.keys()]).toEqual(['coche']);
  });

  it('uses romanizations for non-Latin slugs', async () => {
    const eg = JSON.stringify({
      lang: 'Egyptian Arabic',
      word: 'إزيك',
      pos: 'intj',
      forms: [{ form: 'izzayyak', tags: ['romanization'] }],
      senses: [{ glosses: ['how are you?'], tags: ['informal'] }],
    });
    const out = toEntries((await collect([eg], [arEg])).get('ar-eg')!, arEg, { limit: 5 });
    expect(out[0]).toMatchObject({ slug: 'izzayyak', entry: { romanized: ['izzayyak'], register: 'casual' } });
  });
});

describe('example and ranking quality', () => {
  it('drops notes stored as examples', () => {
    expect(isRealExample('ع (ʕa-) (alternative form)')).toBe(false);
    expect(isRealExample('¿Bueno?')).toBe(false);
    expect(isRealExample('بتعمل ايه؟')).toBe(true);
  });

  it('ranks everyday (slang/colloquial) senses above obscure senses of more frequent words', async () => {
    const lines = [
      line({ word: 'ante', pos: 'noun', senses: [{ glosses: ['tapir'], tags: ['Mexico'] }] }),
      line({ word: 'chido', pos: 'adj', senses: [{ glosses: ['cool'], tags: ['Mexico', 'colloquial'] }] }),
    ];
    const filler = (n: number) => Array.from({ length: n }, (_, i) => `w${i} 1`).join('\n');
    // ante is the 101st most frequent word, chido the 301st.
    const ranks = readFrequency(`${filler(100)}\nante 1\n${filler(199)}\nchido 1\n`, 'latn');
    const out = toEntries((await collect(lines, [esMx])).get('es-mx')!, esMx, { limit: 1, ranks });
    expect(out.map((o) => o.entry.word)).toEqual(['chido']);
  });
});

describe('kaikkiUrl', () => {
  it('builds per-language download URLs', () => {
    expect(kaikkiUrl('Egyptian Arabic')).toBe(
      'https://kaikki.org/dictionary/Egyptian%20Arabic/kaikki.org-dictionary-EgyptianArabic.jsonl',
    );
  });
});
