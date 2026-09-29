import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { normalize } from '../../src/core/normalize.js';
import { arabiziCandidates } from '../../src/core/romanize.js';
import { detectScript } from '../../src/core/script.js';
import { soundVariants } from '../../src/core/soundfold.js';
import { readings, tokenize } from '../../src/core/tokenize.js';
import { dialects, levels, messyText, RUNS, scripts } from './arbitraries.js';

const opts = { numRuns: RUNS };

describe('normalize', () => {
  it('is idempotent for every script, dialect and level', () => {
    fc.assert(
      fc.property(messyText, scripts, dialects, levels, (text, script, dialect, level) => {
        const once = normalize(text, { script, dialect, level });
        expect(normalize(once, { script, dialect, level })).toBe(once);
      }),
      opts,
    );
  });

  it('never throws and returns trimmed text without double spaces', () => {
    fc.assert(
      fc.property(messyText, scripts, dialects, levels, (text, script, dialect, level) => {
        const out = normalize(text, { script, dialect, level });
        expect(out).toBe(out.trim());
        expect(out).not.toMatch(/\s{2}/);
      }),
      opts,
    );
  });

  it('fuzzy keys are coarser than canonical keys (equal canonical ⇒ equal fuzzy)', () => {
    fc.assert(
      fc.property(messyText, dialects, (text, dialect) => {
        const canonical = normalize(text, { script: 'latn', dialect });
        expect(normalize(canonical, { script: 'latn', dialect, level: 'fuzzy' })).toBe(normalize(text, { script: 'latn', dialect, level: 'fuzzy' }));
      }),
      opts,
    );
  });
});

describe('detectScript', () => {
  it('never throws and returns an ISO 15924 code', () => {
    fc.assert(
      fc.property(messyText, (text) => {
        expect(detectScript(text)).toMatch(/^[a-z]{4}$/);
      }),
      opts,
    );
  });
});

describe('tokenize and readings', () => {
  it('tokens slice back to the text, in order, without overlapping', () => {
    fc.assert(
      fc.property(messyText, (text) => {
        let previousEnd = 0;
        for (const t of tokenize(text)) {
          expect(text.slice(t.start, t.end)).toBe(t.surface);
          expect(t.start).toBeGreaterThanOrEqual(previousEnd);
          expect(t.end).toBeGreaterThan(t.start);
          previousEnd = t.end;
        }
      }),
      opts,
    );
  });

  it('readings stay inside their token and never repeat', () => {
    fc.assert(
      fc.property(messyText, fc.constantFrom('arab', 'latn'), fc.constantFrom('ar', 'en', 'fr'), (text, script, language) => {
        for (const t of tokenize(text)) {
          const rs = readings(t, script, language);
          expect(new Set(rs.map((r) => r.form)).size).toBe(rs.length);
          for (const r of rs) {
            expect(r.start).toBeGreaterThanOrEqual(t.start);
            expect(r.end).toBeLessThanOrEqual(t.end);
            expect(r.end).toBeGreaterThan(r.start);
            expect(r.form).not.toBe(t.surface);
          }
        }
      }),
      opts,
    );
  });
});

describe('bounded candidate generation', () => {
  it('arabiziCandidates returns at most 20 distinct candidates', () => {
    fc.assert(
      fc.property(messyText, (text) => {
        const out = arabiziCandidates(text);
        expect(out.length).toBeLessThanOrEqual(20);
        expect(new Set(out).size).toBe(out.length);
      }),
      opts,
    );
  });

  it('soundVariants returns at most 15 variants (4 spots, each kept or replaced)', () => {
    const rules: [string, string][] = [['تش', 'ك'], ['ك', 'ق'], ['چ', 'ك']];
    fc.assert(
      fc.property(messyText, (text) => {
        const out = soundVariants(text, 'arab', rules);
        expect(out.length).toBeLessThanOrEqual(15);
        expect(out).not.toContain(normalize(text, 'arab'));
      }),
      opts,
    );
  });
});
