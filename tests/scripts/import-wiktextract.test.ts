import { describe, expect, it } from 'vitest';
import { sensitiveLabels } from '../../scripts/quality.js';
import {
  borrowedFrom,
  collect,
  conceptFor,
  conceptIndex,
  frequencyUrl,
  isRealExample,
  kaikkiUrl,
  readFrequency,
  selectSenses,
  toEntries,
  WAVE_1,
} from '../../scripts/import-wiktextract.js';

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

describe('safety and precision (review of import run 36565047004)', () => {
  const enUs = WAVE_1.find((c) => c.dialect === 'en-us-general')!;
  const esEs = WAVE_1.find((c) => c.dialect === 'es-es')!;
  const lev = WAVE_1.find((c) => c.dialect === 'ar-levantine')!;
  const de = WAVE_1.find((c) => c.dialect === 'de-de')!;
  const en = (o: { word: string; pos?: string; senses: object[] }) => ({ lang: 'English', pos: 'noun', ...o });

  it('imports offensive, sexual and slur senses, labelled', async () => {
    const lines = [
      en({ word: 'slant', senses: [{ glosses: ['An East Asian person.'], tags: ['US', 'ethnic', 'slur'] }] }),
    ].map((o) => JSON.stringify(o));
    const [slant] = toEntries((await collect(lines, [enUs])).get('en-us-general')!, enUs, { limit: 5 });
    expect(slant?.entry).toMatchObject({ word: 'slant', register: 'vulgar', meanings: [{ sensitive: ['slur'] }] });
    expect(sensitiveLabels({ glosses: ['to fuck'] })).toEqual(['sexual']);
    expect(sensitiveLabels({ glosses: ['gang of rapists'] })).toEqual(['sexual']);
    expect(sensitiveLabels({ glosses: ['a term for an Indian person'], tags: ['derogatory'] })).toEqual(['offensive']);
    expect(sensitiveLabels({ glosses: ['bus'], tags: ['Mexico'] })).toEqual([]);
  });

  it('keeps the everyday sense first and its register; a vulgar sense never links a core concept', async () => {
    const tio = JSON.stringify({
      lang: 'Spanish',
      word: 'tío',
      pos: 'noun',
      senses: [
        { glosses: ['penis'], tags: ['Spain', 'vulgar'] },
        { glosses: ['dude, guy'], tags: ['Spain', 'colloquial'] },
      ],
    });
    const polla = JSON.stringify({ lang: 'Spanish', word: 'polla', pos: 'noun', senses: [{ glosses: ['penis'], tags: ['Spain', 'vulgar'] }] });
    const concepts = conceptIndex({ buddy: { en: 'dude, guy', category: 'people' }, penis: { en: 'penis', category: 'things' } });
    const out = toEntries((await collect([tio, polla], [esEs], concepts)).get('es-es')!, esEs, { limit: 5 });
    const byWord = Object.fromEntries(out.map((o) => [o.entry.word, o.entry]));
    expect(byWord['tío']).toMatchObject({ register: 'casual', concept: 'buddy' });
    expect(byWord['tío']!.meanings.map((m) => m.sensitive)).toEqual([[], ['sexual', 'vulgar']]);
    expect(byWord['polla']).toMatchObject({ register: 'vulgar' });
    expect(byWord['polla']!.concept).toBeUndefined();
  });

  it('skips single letters and bare clitics in every script', () => {
    for (const word of ['ب', 'و', 'ال', 'بِ', 'क']) {
      expect(selectSenses({ lang: 'North Levantine Arabic', word, pos: 'prep', senses: [{ glosses: ['with'] }] }, lev), word).toEqual([]);
    }
  });

  it('drops words that are also grammar words unless they express a core concept', async () => {
    const lines = [
      { word: 'da', pos: 'conj', senses: [{ glosses: ['because'] }] },
      { word: 'da', pos: 'adv', senses: [{ glosses: ['there'], tags: ['colloquial'] }] },
      { word: 'pennen', pos: 'verb', senses: [{ glosses: ['to sleep'], tags: ['colloquial'] }] },
    ].map((o) => JSON.stringify({ lang: 'German', ...o }));
    const out = toEntries((await collect(lines, [de])).get('de-de')!, de, { limit: 10 });
    expect(out.map((o) => o.entry.word)).toEqual(['pennen']);
  });

  it('links a concept only through a meaning the entry keeps', async () => {
    const hi = WAVE_1.find((c) => c.dialect === 'hi-in')!;
    const kar = JSON.stringify({
      lang: 'Hindi',
      word: 'कार',
      pos: 'noun',
      senses: ['tax', 'action, doing', 'work', 'doer', 'car'].map((g) => ({ glosses: [g] })),
    });
    const c = (await collect([kar], [hi], conceptIndex({ car: { en: 'car', category: 'things' } }))).get('hi-in')!.get('कार')!;
    expect(c.meanings).toHaveLength(5);
    expect(c.concept).toBeUndefined();
  });

  describe('links concepts by main meaning and part of speech', () => {
    const concepts = conceptIndex({
      fast: { en: 'fast', category: 'describing' },
      can: { en: 'can', category: 'verbs' },
      fine: { en: 'fine, well', category: 'greetings' },
      car: { en: 'car', category: 'things' },
      go: { en: 'go', category: 'verbs' },
      a_lot: { en: 'a lot', category: 'amounts' },
    });
    const link = (glosses: string[], pos: string) => conceptFor('x', { glosses }, lev, concepts, pos);

    it('rejects a concept whose category does not fit the part of speech', () => {
      expect(link(['to fast'], 'verb')).toBeUndefined(); // صام
      expect(link(['can, tin'], 'noun')).toBeUndefined(); // علبة
      expect(link(['well (for water)'], 'noun')).toBeUndefined(); // بير
    });

    it('looks only at the main meaning', () => {
      expect(link(['stove; (by extension) car'], 'noun')).toBeUndefined(); // بابور
      expect(link(['lot, fate'], 'noun')).toBeUndefined(); // قسمة is not "a lot"
    });

    it('still links the right ones', () => {
      expect(link(['a car'], 'noun')).toBe('car');
      expect(link(['to go'], 'verb')).toBe('go');
      expect(link(['fine, well'], 'adj')).toBe('fine');
      expect(link(['a lot; very much'], 'adv')).toBe('a_lot');
      expect(link(['fast, quick'], 'adj')).toBe('fast');
    });
  });
});

describe('English, German, Hindi and Portuguese (review of import run 36623051266)', () => {
  const enUs = WAVE_1.find((c) => c.dialect === 'en-us-general')!;
  const enIn = WAVE_1.find((c) => c.dialect === 'en-in')!;
  const de = WAVE_1.find((c) => c.dialect === 'de-de')!;
  const hi = WAVE_1.find((c) => c.dialect === 'hi-in')!;
  const en = (o: object) => ({ lang: 'English', pos: 'noun', ...o }) as Parameters<typeof selectSenses>[0];
  const fromSpanish = { etymology_templates: [{ name: 'bor', args: { '1': 'en', '2': 'es', '3': 'gracias' } }] };

  it('skips borrowings that belong to another language’s voice', () => {
    expect(selectSenses(en({ word: 'gracias', pos: 'intj', ...fromSpanish, senses: [{ glosses: ['Thank you.'], tags: ['US', 'informal'] }] }), enUs)).toEqual([]);
    const yaar = en({ word: 'yaar', etymology_templates: [{ name: 'bor', args: { '1': 'en', '2': 'hi' } }], senses: [{ glosses: ['friend'], tags: ['India', 'informal'] }] });
    expect(selectSenses(yaar, enIn)).toHaveLength(1);
  });

  it('skips learned Sanskrit borrowings in Hindi, but not other borrowings', () => {
    expect(borrowedFrom({ etymology_templates: [{ name: 'lbor', args: { '1': 'hi', '2': 'sa' } }] }, ['sa'], true)).toBe(true);
    expect(borrowedFrom({ etymology_templates: [{ name: 'inh', args: { '1': 'hi', '2': 'sa' } }] }, ['sa'], true)).toBe(false);
    const word = (o: object) => ({ lang: 'Hindi', word: 'कठिन', pos: 'adj', senses: [{ glosses: ['difficult'] }], ...o });
    expect(selectSenses(word({ etymology_templates: [{ name: 'lbor', args: { '2': 'sa' } }] }), hi)).toEqual([]);
    expect(selectSenses(word({ etymology_templates: [{ name: 'bor', args: { '2': 'fa' } }] }), hi)).toHaveLength(1);
  });

  it('drops jargon, literary senses and empty "term of address" glosses', () => {
    expect(selectSenses(en({ word: 'long', pos: 'adj', senses: [{ glosses: ['Measuring 8½ in × 13 in.'], tags: ['US'], topics: ['paper'] }] }), enUs)).toEqual([]);
    expect(selectSenses({ lang: 'Hindi', word: 'इह', pos: 'adv', senses: [{ glosses: ['here'], tags: ['literary'] }] }, hi)).toEqual([]);
    const pt = WAVE_1.find((c) => c.dialect === 'pt-br')!;
    expect(selectSenses({ lang: 'Portuguese', word: 'chefe', pos: 'noun', senses: [{ glosses: ['A term of address for someone'], tags: ['Brazil'] }] }, pt)).toEqual([]);
  });

  it('keeps a plain regional sense only when it is the word’s main meaning', () => {
    const school = en({ word: 'school', senses: [{ glosses: ['An institution for teaching.'] }, { glosses: ['A college.'], tags: ['US'] }] });
    expect(selectSenses(school, enUs)).toEqual([]);
    const sidewalk = en({ word: 'sidewalk', senses: [{ glosses: ['A paved path for pedestrians.'], tags: ['US'] }] });
    expect(selectSenses(sidewalk, enUs)).toHaveLength(1);
    const bread = en({ word: 'bread', senses: [{ glosses: ['A baked food.'] }, { glosses: ['Money.'], tags: ['US', 'slang'] }] });
    expect(selectSenses(bread, enUs)).toHaveLength(1);
  });

  it('does not let a frequent word’s side sense outrank real regionalisms', async () => {
    const lines = [
      en({ word: 'girl', senses: [{ glosses: ['A young woman.'] }, { glosses: ['Cocaine.'], tags: ['US', 'slang'] }] }),
      en({ word: 'spendy', pos: 'adj', senses: [{ glosses: ['Expensive.'], tags: ['US', 'informal'] }] }),
    ].map((o) => JSON.stringify(o));
    const ranks = readFrequency('girl 900\nspendy 1\n', 'latn');
    const out = toEntries((await collect(lines, [enUs])).get('en-us-general')!, enUs, { limit: 1, ranks });
    expect(out.map((o) => o.entry.word)).toEqual(['spendy']);
  });

  it('links a concept only through the first ordinary sense', async () => {
    const bal = JSON.stringify({ lang: 'Hindi', word: 'बाल', pos: 'noun', senses: [{ glosses: ['hair'] }, { glosses: ['child, boy'] }] });
    const c = (await collect([bal], [hi], conceptIndex({ child: { en: 'child', category: 'people' } }))).get('hi-in')!.get('बाल')!;
    expect(c.concept).toBeUndefined();
  });

  it('leaves regional German out of the German of Germany', () => {
    const hanoi = { lang: 'German', word: 'ha noi', pos: 'intj', senses: [{ glosses: ['no'], tags: ['Swabian', 'colloquial'] }] };
    expect(selectSenses(hanoi, de)).toEqual([]);
  });

  it('downloads the Hindi frequency list from the 2016 edition', () => {
    expect(frequencyUrl('hi', hi.freqYear)).toContain('/content/2016/hi/hi_50k.txt');
    expect(frequencyUrl('en')).toContain('/content/2018/en/en_50k.txt');
  });
});

describe('kaikkiUrl', () => {
  it('builds per-language download URLs', () => {
    expect(kaikkiUrl('Egyptian Arabic')).toBe(
      'https://kaikki.org/dictionary/Egyptian%20Arabic/kaikki.org-dictionary-EgyptianArabic.jsonl',
    );
  });
});
