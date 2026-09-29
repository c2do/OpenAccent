import { describe, expect, it } from 'vitest';
import { buildSuggestionUrl } from '../../src/core/links.js';

describe('buildSuggestionUrl', () => {
  it('targets the add-word form with encoded fields', () => {
    const { url, dropped, note } = buildSuggestionUrl('add-word', {
      word: 'حاكورة',
      dialect: 'ar-ps-fallahi',
      meaning_en: 'small garden',
    });
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe('https://github.com/c2do/OpenAccent/issues/new');
    expect(u.searchParams.get('template')).toBe('add-word.yml');
    expect(u.searchParams.get('word')).toBe('حاكورة');
    expect(u.searchParams.get('title')).toBe('[Add] حاكورة (ar-ps-fallahi)');
    expect(url).not.toContain('حاكورة'); // percent-encoded
    expect(dropped).toEqual([]);
    expect(note).toMatch(/browser/);
  });

  it('uses the fix-word form', () => {
    expect(new URL(buildSuggestionUrl('fix-word', { word: 'x' }).url).searchParams.get('template')).toBe('fix-word.yml');
  });

  it('drops the least important fields to stay under 2000 characters', () => {
    const long = 'مثال طويل '.repeat(60);
    const r = buildSuggestionUrl('add-word', { word: 'حاكورة', example: long, notes: long, meaning_ar: 'جنينة' });
    expect(r.url.length).toBeLessThanOrEqual(2000);
    expect(r.dropped).toEqual(['example', 'notes']);
    expect(new URL(r.url).searchParams.get('meaning_ar')).toBe('جنينة');
    expect(r.note).toMatch(/example, notes/);
  });
});
