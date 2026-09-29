import { describe, expect, it } from 'vitest';
import { soundVariants } from '../../src/core/soundfold.js';

// [spoken, written]
const fallahi: [string, string][] = [
  ['تش', 'ك'],
  ['چ', 'ك'],
  ['ك', 'ق'],
];

describe('soundVariants', () => {
  it('maps spoken تش to written ك', () => {
    expect(soundVariants('تشيف', 'arab', fallahi)).toContain('كيف');
    expect(soundVariants('چيف', 'arab', fallahi)).toContain('كيف');
  });

  it('maps spoken ك to written ق', () => {
    expect(soundVariants('كال', 'arab', fallahi)).toContain('قال');
  });

  it('never chains rules: تشال does not become قال', () => {
    const v = soundVariants('تشال', 'arab', fallahi);
    expect(v).toContain('كال');
    expect(v).not.toContain('قال');
  });

  it('handles several spots in one word', () => {
    expect(soundVariants('تشلبك', 'arab', fallahi)).toEqual(expect.arrayContaining(['كلبك', 'تشلبق', 'كلبق']));
  });

  it('normalizes and returns nothing without rules', () => {
    expect(soundVariants('قال', 'arab', undefined)).toEqual([]);
  });
});
