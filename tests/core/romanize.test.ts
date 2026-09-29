import { describe, expect, it } from 'vitest';
import { arabiziCandidates, looksLikeArabizi } from '../../src/core/romanize.js';
import { normalize } from '../../src/core/normalize.js';

const has = (input: string, arabic: string) =>
  arabiziCandidates(input).includes(normalize(arabic, 'arab'));

describe('arabiziCandidates', () => {
  it('maps digit letters', () => {
    expect(has('7akoura', 'حاكورة')).toBe(true);
    expect(has('3ashan', 'عشان')).toBe(true);
    expect(has('5ubz', 'خبز')).toBe(true);
    expect(has('mar7aba', 'مرحبا')).toBe(true);
  });

  it('maps digraphs', () => {
    expect(has('khubz', 'خبز')).toBe(true);
    expect(has('shukran', 'شكرا')).toBe(true);
    expect(has('ghada', 'غدا')).toBe(true);
  });

  it('handles doubled consonants (shadda)', () => {
    expect(has('hassa3', 'هسّع')).toBe(true);
    expect(has('sitti', 'ستّي')).toBe(true);
  });

  it('handles the fallahi tsh/ch sound', () => {
    expect(has('tshif', 'تشيف')).toBe(true);
    expect(has('chbir', 'تشبير')).toBe(true);
  });

  it('caps the number of candidates', () => {
    const c = arabiziCandidates('3ala tshif tshif hassa3 ya zalameh');
    expect(c.length).toBeLessThanOrEqual(20);
  });

  it('returns only normalized Arabic strings, without duplicates', () => {
    const c = arabiziCandidates('7akoura');
    expect(new Set(c).size).toBe(c.length);
    for (const s of c) expect(s).toBe(normalize(s, 'arab'));
  });
});

describe('looksLikeArabizi', () => {
  it('detects digit letters inside Latin words', () => {
    expect(looksLikeArabizi('7akoura')).toBe(true);
    expect(looksLikeArabizi('3ashan')).toBe(true);
  });
  it('is false for Arabic script and plain numbers', () => {
    expect(looksLikeArabizi('حاكورة')).toBe(false);
    expect(looksLikeArabizi('2024')).toBe(false);
  });
});
