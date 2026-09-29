import { describe, expect, it } from 'vitest';
import { readings, tokenize } from '../../src/core/tokenize.js';

const forms = (word: string, script = 'arab', language = 'ar') =>
  readings(tokenize(word)[0]!, script, language).map((r) => r.form);

describe('tokenize', () => {
  it('returns words with offsets that slice back to the text', () => {
    const text = 'شو، كيفك؟  y’all don’t 3ashan!';
    const tokens = tokenize(text);
    expect(tokens.map((t) => t.surface)).toEqual(['شو', 'كيفك', 'y’all', 'don’t', '3ashan']);
    for (const t of tokens) expect(text.slice(t.start, t.end)).toBe(t.surface);
  });

  it('keeps harakat, tatweel and Devanagari vowel signs inside words', () => {
    expect(tokenize('هسّع حـلو').map((t) => t.surface)).toEqual(['هسّع', 'حـلو']);
    expect(tokenize('क्या हाल है।').map((t) => t.surface)).toEqual(['क्या', 'हाल', 'है']);
  });
});

describe('readings (Arabic clitics)', () => {
  it('strips conjunction, preposition and article, least stripped first', () => {
    expect(forms('وبالحاكورة')).toEqual(['بالحاكورة', 'الحاكورة', 'حاكورة']);
    expect(forms('والدار')).toEqual(['الدار', 'دار']);
    expect(forms('فبالبيت')).toEqual(['بالبيت', 'البيت', 'بيت']);
  });

  it('restores the article in ل + ال (للبيت)', () => {
    expect(forms('للبيت')).toContain('البيت');
    expect(forms('للبيت')).toContain('بيت');
  });

  it('gives the span of the part that remains', () => {
    const text = 'رحت وبالحاكورة';
    const r = readings(tokenize(text)[1]!, 'arab', 'ar').at(-1)!;
    expect(text.slice(r.start, r.end)).toBe('حاكورة');
  });

  it('keeps harakat on the remaining part', () => {
    expect(forms('وَالدّار')).toContain('الدّار');
  });

  it('leaves short words alone', () => {
    expect(forms('وين')).toEqual([]);
    expect(forms('بس')).toEqual([]);
  });
});

describe('readings (Latin clitics)', () => {
  it('French elision', () => {
    expect(forms("l'amour", 'latn', 'fr')).toEqual(['amour']);
    expect(forms('qu’il', 'latn', 'fr')).toEqual(['il']);
    expect(forms("l'amour", 'latn', 'en')).toEqual([]);
  });

  it('English possessive', () => {
    const text = "my mom's cooking";
    const r = readings(tokenize(text)[1]!, 'latn', 'en')[0]!;
    expect(r.form).toBe('mom');
    expect(text.slice(r.start, r.end)).toBe('mom');
  });
});
