import { describe, expect, it } from 'vitest';
import { detectScript } from '../../src/core/script.js';

describe('detectScript', () => {
  it('returns ISO 15924 codes', () => {
    expect(detectScript('حاكورة')).toBe('arab');
    expect(detectScript('hello')).toBe('latn');
    expect(detectScript('नमस्ते')).toBe('deva');
    expect(detectScript('Привет')).toBe('cyrl');
    expect(detectScript('שלום')).toBe('hebr');
    expect(detectScript('你好')).toBe('hani');
    expect(detectScript('안녕')).toBe('hang');
  });

  it('treats Arabizi as Latin', () => {
    expect(detectScript('7akoura')).toBe('latn');
    expect(detectScript('3ashan')).toBe('latn');
  });

  it('picks the script with the most letters', () => {
    expect(detectScript('OK يا زلمة')).toBe('arab');
    expect(detectScript('hello يا')).toBe('latn');
  });

  it('is undetermined without letters', () => {
    expect(detectScript('123 ?!')).toBe('zyyy');
    expect(detectScript('')).toBe('zyyy');
  });
});
