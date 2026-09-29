import { describe, expect, it } from 'vitest';
import { manualTemplate, parseManual, PLACEHOLDER, scoreManual } from '../../scripts/eval-manual.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const set = {
  dialect: 'ar-ps-fallahi',
  notes: 'Rural Palestinian.',
  prompts: [
    { id: 'plans', text: 'شو بنعمل بكرة؟' },
    { id: 'tired', text: 'تعبان اليوم' },
  ],
};

describe('manual eval', () => {
  it('writes a template with instructions and a slot per prompt and condition', () => {
    const md = manualTemplate(set, '2026-09-29');
    expect(md).toContain('<!-- dialect: ar-ps-fallahi -->');
    expect(md).toContain('turn **OpenAccent off**');
    expect(md.split(PLACEHOLDER).length - 1).toBe(4);
    expect(parseManual(md)).toEqual({ dialect: 'ar-ps-fallahi', date: '2026-09-29', replies: [], missing: 4 });
  });

  it('reads pasted replies back, including multi-line ones, and skips empty slots', () => {
    const md = manualTemplate(set, '2026-09-29')
      .replace(PLACEHOLDER, 'دلوقتي بنطلع مشوار')
      .replace(PLACEHOLDER, 'هسّع بنطلع مشوار\n\nوبنوكل برا ### ما هو عنوان');
    const parsed = parseManual(md);
    expect(parsed.missing).toBe(2);
    expect(parsed.replies).toEqual([
      { promptId: 'plans', prompt: 'شو بنعمل بكرة؟', condition: 'baseline', reply: 'دلوقتي بنطلع مشوار' },
      { promptId: 'plans', prompt: 'شو بنعمل بكرة؟', condition: 'openaccent', reply: 'هسّع بنطلع مشوار\n\nوبنوكل برا ### ما هو عنوان' },
    ]);
  });

  it('scores replies like the API eval does', () => {
    const md = manualTemplate(set, '2026-09-29').replace(PLACEHOLDER, 'دلوقتي بنطلع').replace(PLACEHOLDER, 'هسّع بنطلع');
    const [baseline, openaccent] = scoreManual(new Dictionary(fixtureBundle()), parseManual(md));
    expect(baseline!.score.otherDialect).toBe(1);
    expect(openaccent!.score).toMatchObject({ otherDialect: 0, coreWordsUsed: 1 });
  });

  it('refuses a file without a dialect line', () => {
    expect(() => parseManual('# hi')).toThrow(/dialect/);
  });
});
