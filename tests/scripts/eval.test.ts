import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Dictionary } from '../../src/core/dictionary.js';
import { buildBundle } from '../../scripts/build-data.js';
import { loadEvalSets, openAccentSystem, renderReport, scoreReply, summarize, type ReplyRecord } from '../../scripts/eval.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const dict = new Dictionary(fixtureBundle());

describe('scoreReply', () => {
  it('counts other-dialect words and core words', () => {
    expect(scoreReply(dict, 'ar-ps-fallahi', 'دلوقتي بجيك')).toMatchObject({ otherDialect: 1, coreWordsUsed: 0 });
    expect(scoreReply(dict, 'ar-ps-fallahi', 'هسّع بجيك')).toMatchObject({ otherDialect: 0, coreWordsUsed: 1 });
  });

  it('counts words written as pronounced', () => {
    expect(scoreReply(dict, 'ar-ps-fallahi-tshaf', 'تشيف حالك').pronunciation).toBe(1);
  });
});

describe('summarize + renderReport', () => {
  const rec = (condition: 'baseline' | 'openaccent', reply: string): ReplyRecord => ({
    dialect: 'ar-ps-fallahi',
    promptId: 'p1',
    prompt: 'وينك؟',
    condition,
    reply,
    score: scoreReply(dict, 'ar-ps-fallahi', reply),
  });
  const records = [rec('baseline', 'دلوقتي جاي'), rec('openaccent', 'هسّع جاي')];

  it('compares conditions per dialect', () => {
    const s = summarize(records)['ar-ps-fallahi']!;
    expect(s.baseline).toMatchObject({ replies: 1, mixingRate: 1, coreWordRate: 0 });
    expect(s.openaccent).toMatchObject({ replies: 1, mixingRate: 0, coreWordRate: 1 });
  });

  it('renders a table and the replies for human judges', () => {
    const md = renderReport(records, { model: 'claude-opus-5-5', effort: 'low', date: '2026-09-29' });
    expect(md).toContain('| ar-ps-fallahi | baseline | 100% |');
    expect(md).toContain('| ar-ps-fallahi | openaccent | 0% |');
    expect(md).toContain('- _openaccent_: هسّع جاي');
  });
});

describe('eval inputs', () => {
  it('every prompt file parses, has 10 prompts, and targets a real dialect', () => {
    const real = new Dictionary(buildBundle(join(import.meta.dirname, '../../data')));
    const sets = loadEvalSets(join(import.meta.dirname, '../../evals/prompts'));
    expect(sets.length).toBeGreaterThanOrEqual(4);
    for (const s of sets) {
      expect(s.prompts).toHaveLength(10);
      expect(real.getDialect(s.dialect)).toBeDefined();
    }
  });

  it('builds the OpenAccent system prompt from the briefing', () => {
    expect(openAccentSystem(dict, 'ar-ps-fallahi')).toContain('## Core words in this dialect');
  });
});
