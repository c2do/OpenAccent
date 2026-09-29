import { describe, expect, it } from 'vitest';
import { languageOf, normalize, normalizerFor } from '../../src/core/normalize.js';

describe('normalize (arab)', () => {
  const n = (s: string) => normalize(s, 'arab');

  it('strips diacritics and tatweel', () => {
    expect(n('كَتَبَ')).toBe('كتب');
    expect(n('حـلو')).toBe('حلو');
    expect(n('هسّع')).toBe('هسع');
    expect(n('الرَّحْمٰن')).toBe('الرحمن');
  });

  it('unifies alef forms', () => {
    expect(n('أكل إلى آخر ٱلبيت')).toBe('اكل الي اخر البيت');
  });

  it('unifies yaa, taa marbuta, and hamza seats', () => {
    expect(n('على')).toBe('علي');
    expect(n('حاكورة')).toBe('حاكوره');
    expect(n('مؤمن')).toBe('مومن');
    expect(n('مسائل')).toBe('مسايل');
  });

  it('converts Arabic-Indic digits', () => {
    expect(n('٣ و ۷')).toBe('3 و 7');
  });

  it('trims punctuation and collapses whitespace', () => {
    expect(n('  تشيف   حالك؟! ')).toBe('تشيف حالك');
    expect(n('«زلمة»، منيح.')).toBe('زلمه منيح');
  });

  it('is idempotent', () => {
    const once = n('إِشي حـاكورةٌ');
    expect(n(once)).toBe(once);
  });
});

describe('normalize (latn)', () => {
  const n = (s: string) => normalize(s, 'latn');

  it('lowercases and strips accents', () => {
    expect(n('Café NAÏVE')).toBe('cafe naive');
  });

  it('applies no language rules without a dialect', () => {
    expect(n('colour')).toBe('colour');
    expect(n('amour')).toBe('amour');
  });

  it('straightens curly quotes and keeps apostrophes inside words', () => {
    expect(n('Y’all ain’t')).toBe("y'all ain't");
  });

  it('trims punctuation', () => {
    expect(n('  Hey, what’s up?! ')).toBe("hey what's up");
  });

  it('is idempotent', () => {
    const once = n('Crème Brûlée, Y’ALL!');
    expect(n(once)).toBe(once);
  });
});

describe('normalize (other scripts)', () => {
  it('falls back to lowercase + whitespace cleanup', () => {
    expect(normalize('  Привет  Мир ', 'cyrl')).toBe('привет мир');
  });

  it('drops punctuation but keeps vowel marks (Devanagari)', () => {
    expect(normalize('नमस्ते! आप कैसे हैं?', 'deva')).toBe('नमस्ते आप कैसे हैं');
    expect(normalize('क्या हाल है।', 'deva')).toBe('क्या हाल है');
  });
});

describe('normalize by language and dialect', () => {
  const en = (s: string) => normalize(s, { script: 'latn', dialect: 'en-us-general' });
  const fr = (s: string) => normalize(s, { script: 'latn', dialect: 'fr-fr' });
  const es = (s: string, level: 'canonical' | 'fuzzy' = 'canonical') => normalize(s, { script: 'latn', dialect: 'es-mx', level });
  const de = (s: string, level: 'canonical' | 'fuzzy' = 'canonical') => normalize(s, { script: 'latn', dialect: 'de-de', level });
  const tr = (s: string, level: 'canonical' | 'fuzzy' = 'canonical') => normalize(s, { script: 'latn', dialect: 'tr-tr', level });

  it('folds US/UK spellings for English dialects', () => {
    expect(en('colour')).toBe(en('color'));
    expect(en('realise')).toBe(en('realize'));
    expect(en('favourite')).toBe(en('favorite'));
    expect(normalize('colour', { script: 'latn', dialect: 'en-gb' })).toBe('color');
  });

  it('never applies English folds to other languages', () => {
    expect(fr('amour')).toBe('amour');
    expect(fr('Humour')).toBe('humour');
    expect(es('valor')).toBe('valor');
    expect(normalize('favoris', { script: 'latn', dialect: 'fr' })).toBe('favoris');
  });

  it('French: strips accents, unties ligatures, keeps inner apostrophes', () => {
    expect(fr('Œuvre à côté')).toBe('oeuvre a cote');
    expect(fr('Aujourd’hui')).toBe("aujourd'hui");
  });

  it('Spanish: ñ makes a different word, folded only at the fuzzy level', () => {
    expect(es('Año')).toBe('año');
    expect(es('año')).not.toBe(es('ano'));
    expect(es('año', 'fuzzy')).toBe(es('ano', 'fuzzy'));
    expect(es('Árbol')).toBe('arbol');
  });

  it('German: ß is ss; umlauts kept at canonical, folded at fuzzy', () => {
    expect(de('Straße')).toBe(de('Strasse'));
    expect(de('schön')).not.toBe(de('schon'));
    expect(de('Schön', 'fuzzy')).toBe('schon');
  });

  it('Turkish: dotted and dotless i lowercase correctly', () => {
    expect(tr('İstanbul')).toBe('istanbul');
    expect(tr('IŞIK')).toBe(tr('ışık'));
    expect(tr('şık')).not.toBe(tr('sık'));
    expect(tr('ışık', 'fuzzy')).toBe('isik');
  });

  it('fuzzy level squeezes stretched letters but keeps doubles', () => {
    expect(normalize('heyyy', { script: 'latn', level: 'fuzzy' })).toBe('hey');
    expect(normalize('hello', { script: 'latn', level: 'fuzzy' })).toBe('hello');
    expect(normalize('هلااا', { script: 'arab', level: 'fuzzy' })).toBe('هلا');
  });

  it('exact level only cleans Unicode form and whitespace', () => {
    expect(normalize('  Cafe\u0301   Noir ', { script: 'latn', level: 'exact' })).toBe('Café Noir');
  });

  it('dialect rules refine language rules (en → en-us → en-us-general)', () => {
    const n = normalizerFor({ id: 'en-us-general', script: 'latn' });
    expect(n('Colour')).toBe('color');
    expect(languageOf('en-us-general')).toBe('en');
    expect(languageOf('ar-ps-fallahi-kaf')).toBe('ar');
  });

  it('is idempotent for every language', () => {
    for (const f of [en, fr, es, de, tr]) {
      for (const w of ['Colour Straße', 'İŞIK año', 'Œuvre, y’all!']) expect(f(f(w))).toBe(f(w));
    }
  });
});
