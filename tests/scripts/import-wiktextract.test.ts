import { describe, expect, it } from 'vitest';
import { collect, conceptIndex, isRealExample, kaikkiUrl, readFrequency, selectSenses, toEntries, WAVE_1 } from '../../scripts/import-wiktextract.js';

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

describe('default varieties (French of France)', () => {
  const frFr = WAVE_1.find((c) => c.dialect === 'fr-fr')!;
  const fr = (o: { word: string; senses: object[] }) => ({ lang: 'French', pos: 'noun', ...o });

  it('keeps France-tagged senses and untagged everyday senses, but not other regions’ slang', () => {
    expect(selectSenses(fr({ word: 'bagnole', senses: [{ glosses: ['car'], tags: ['France'] }] }), frFr)).toHaveLength(1);
    expect(selectSenses(fr({ word: 'truc', senses: [{ glosses: ['thing'], tags: ['colloquial'] }] }), frFr)).toHaveLength(1);
    expect(selectSenses(fr({ word: 'char', senses: [{ glosses: ['car'], tags: ['Quebec', 'colloquial'] }] }), frFr)).toEqual([]);
    expect(selectSenses(fr({ word: 'maison', senses: [{ glosses: ['house'] }] }), frFr)).toEqual([]);
  });
});

describe('ranking without a frequency list', () => {
  it('prefers everyday senses, then words with examples', async () => {
    const hi = WAVE_1.find((c) => c.dialect === 'hi-in')!;
    const h = (word: string, sense: object) => JSON.stringify({ lang: 'Hindi', word, pos: 'noun', senses: [sense] });
    const lines = [
      h('कक', { glosses: ['plain'] }),
      h('खख', { glosses: ['with example'], examples: [{ text: 'एक दो', type: 'example' }] }),
      h('गगगग', { glosses: ['slang'], tags: ['slang'] }),
    ];
    const out = toEntries((await collect(lines, [hi])).get('hi-in')!, hi, { limit: 3 });
    expect(out.map((o) => o.entry.word)).toEqual(['गगगग', 'खख', 'कक']);
  });
});

describe('quality filters and core concepts', () => {
  const enUs = WAVE_1.find((c) => c.dialect === 'en-us-general')!;
  const enGb = WAVE_1.find((c) => c.dialect === 'en-gb')!;
  const concepts = conceptIndex({ now: { en: 'now' }, buddy: { en: 'buddy, dude (addressing a man)' }, how: { en: 'how' } });
  const en = (o: { word: string; pos?: string; senses: object[] }) => ({ lang: 'English', pos: 'noun', ...o });

  it('drops single letters, proper nouns, grammar glosses and sub-regional senses', () => {
    expect(selectSenses(en({ word: 'c', senses: [{ glosses: ['x'], tags: ['US'] }] }), enUs)).toEqual([]);
    expect(selectSenses(en({ word: 'Jimmy', senses: [{ glosses: ['x'], tags: ['US'] }] }), enUs)).toEqual([]);
    expect(selectSenses(en({ word: 'an', senses: [{ glosses: ['Used before vowels.'], tags: ['UK'] }] }), enGb)).toEqual([]);
    expect(selectSenses(en({ word: 'bairn', senses: [{ glosses: ['child'], tags: ['UK', 'Scotland'] }] }), enGb)).toEqual([]);
    expect(selectSenses(en({ word: 'and', senses: [{ glosses: ['breath'], tags: ['UK', 'dialectal'] }] }), enGb)).toEqual([]);
    expect(selectSenses(en({ word: 'lorry', senses: [{ glosses: ['truck'], tags: ['UK'] }] }), enGb)).toHaveLength(1);
  });

  it('drops function words unless they express a core concept or the file is dialect-specific', () => {
    const de = WAVE_1.find((c) => c.dialect === 'de-de')!;
    const deAb = { lang: 'German', word: 'ab', pos: 'prep', senses: [{ glosses: ['off'], tags: ['colloquial'] }] };
    expect(selectSenses(deAb, de, concepts)).toEqual([]);
    const eg = WAVE_1.find((c) => c.dialect === 'ar-eg')!;
    expect(selectSenses({ lang: 'Egyptian Arabic', word: 'ايه', pos: 'pron', senses: [{ glosses: ['what'] }] }, eg)).toHaveLength(1);
  });

  it('links core concepts by gloss and ranks them first', async () => {
    const lines = [
      line({ word: 'camión', pos: 'noun', senses: [{ glosses: ['bus'], tags: ['Mexico'] }] }),
      line({ word: 'ahorita', pos: 'adv', senses: [{ glosses: ['now; right now'], tags: ['Mexico', 'colloquial'] }] }),
    ];
    const ranks = readFrequency('camión 9\nahorita 1\n', 'latn');
    const out = toEntries((await collect(lines, [esMx], concepts)).get('es-mx')!, esMx, { limit: 1, ranks });
    expect(out[0]?.entry).toMatchObject({ word: 'ahorita', concept: 'now' });
    const us = await collect(
      [
        JSON.stringify(en({ word: 'bread', senses: [{ glosses: ['Money.'], tags: ['US', 'slang'] }] })),
        JSON.stringify(en({ word: 'can', senses: [{ glosses: ['Buttocks.'], tags: ['US', 'slang'] }] })),
        JSON.stringify(en({ word: 'dude', senses: [{ glosses: ['A dude; a buddy.'], tags: ['US', 'slang'] }] })),
      ],
      [enUs],
      conceptIndex({ money: { en: 'money' }, can: { en: 'can' }, buddy: { en: 'buddy, dude (addressing a man)' } }),
    );
    expect(us.get('en-us-general')!.get('bread')?.concept).toBe('money');
    expect(us.get('en-us-general')!.get('can')?.concept).toBeUndefined();
    expect(us.get('en-us-general')!.get('dude')?.concept).toBe('buddy');
  });

  it('keeps at most three words per concept', async () => {
    const lines = ['muy', 'harto', 'bien', 'súper', 'bastante'].map((w) =>
      line({ word: w, pos: 'adv', senses: [{ glosses: ['very'], tags: ['Mexico', 'colloquial'] }] }),
    );
    lines.push(line({ word: 'camión', pos: 'noun', senses: [{ glosses: ['bus'], tags: ['Mexico'] }] }));
    const out = toEntries((await collect(lines, [esMx], conceptIndex({ very: { en: 'very' } }))).get('es-mx')!, esMx, { limit: 10 });
    expect(out.filter((o) => o.entry.concept === 'very')).toHaveLength(3);
    expect(out.map((o) => o.entry.word)).toContain('camión');
  });

  it('sends untagged North Levantine entries to the shared Levantine level', () => {
    const lev = WAVE_1.find((c) => c.dialect === 'ar-levantine')!;
    const sy = WAVE_1.find((c) => c.dialect === 'ar-sy')!;
    const shared = { lang: 'North Levantine Arabic', word: 'هلق', pos: 'adv', senses: [{ glosses: ['now'] }] };
    const syrian = { lang: 'North Levantine Arabic', word: 'شلون', pos: 'adv', senses: [{ glosses: ['how'], tags: ['Syria'] }] };
    expect(selectSenses(shared, lev)).toHaveLength(1);
    expect(selectSenses(shared, sy)).toEqual([]);
    expect(selectSenses(syrian, lev)).toEqual([]);
    expect(selectSenses(syrian, sy)).toHaveLength(1);
  });
});

describe('kaikkiUrl', () => {
  it('builds per-language download URLs', () => {
    expect(kaikkiUrl('Egyptian Arabic')).toBe(
      'https://kaikki.org/dictionary/Egyptian%20Arabic/kaikki.org-dictionary-EgyptianArabic.jsonl',
    );
  });
});
