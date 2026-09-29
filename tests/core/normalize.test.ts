import { describe, expect, it } from 'vitest';
import { normalize } from '../../src/core/normalize.js';

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

  it('folds US/UK spelling pairs to one key', () => {
    expect(n('colour')).toBe(n('color'));
    expect(n('realise')).toBe(n('realize'));
    expect(n('favourite')).toBe(n('favorite'));
  });

  it('straightens curly quotes and keeps apostrophes inside words', () => {
    expect(n('Y’all ain’t')).toBe("y'all ain't");
  });

  it('trims punctuation', () => {
    expect(n('  Hey, what’s up?! ')).toBe("hey what's up");
  });

  it('is idempotent', () => {
    const once = n('Colour, Y’ALL!');
    expect(n(once)).toBe(once);
  });
});

describe('normalize (other scripts)', () => {
  it('falls back to lowercase + whitespace cleanup', () => {
    expect(normalize('  Привет  Мир ', 'cyrl')).toBe('привет мир');
  });
});
