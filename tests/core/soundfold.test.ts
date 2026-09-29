import { describe, expect, it } from 'vitest';
import { soundKey } from '../../src/core/soundfold.js';

const fallahi: [string, string][] = [
  ['تش', 'ك'],
  ['چ', 'ك'],
  ['ق', 'ك'],
];

describe('soundKey', () => {
  it('folds fallahi tsh onto k', () => {
    expect(soundKey('تشيف', 'arab', fallahi)).toBe(soundKey('كيف', 'arab', fallahi));
    expect(soundKey('چيف', 'arab', fallahi)).toBe(soundKey('كيف', 'arab', fallahi));
  });

  it('folds qaf onto kaf', () => {
    expect(soundKey('كال', 'arab', fallahi)).toBe(soundKey('قال', 'arab', fallahi));
  });

  it('normalizes before folding', () => {
    expect(soundKey('تشبيرة', 'arab', fallahi)).toBe('كبيره');
  });

  it('is plain normalization when a dialect has no rules', () => {
    expect(soundKey('قال', 'arab', undefined)).toBe('قال');
  });
});
