import { describe, expect, it } from 'vitest';
import { buildBriefing, profileFooter } from '../../src/core/briefing.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { mergedGuide, parseGuide } from '../../src/core/guides.js';
import { MemorySchema } from '../../src/core/schema.js';
import { fixtureBundle } from '../fixtures/bundle.js';

const bundle = fixtureBundle();
bundle.guides = {
  'ar-ps': `<!-- Status: draft -->
# Palestinian

## Pronunciation

Palestinian-wide sounds.

## Common AI mistakes

- Mixing in Egyptian words.
`,
  'ar-ps-fallahi': `<!-- Status: draft — pending review -->
# Fallahi

## Pronunciation

ك is pronounced تش.

## Common AI mistakes

- Writing the pronunciation.

## Natural usage

Use the user's own words.
`,
};
const dict = new Dictionary(bundle);
const now = '2026-09-29T12:00:00.000Z';

describe('parseGuide', () => {
  it('splits sections and reads the status comment', () => {
    const g = parseGuide(bundle.guides['ar-ps-fallahi']!);
    expect(g.title).toBe('Fallahi');
    expect(g.status).toBe('draft');
    expect(Object.keys(g.sections)).toEqual(['Pronunciation', 'Common AI mistakes', 'Natural usage']);
    expect(g.sections['Pronunciation']).toBe('ك is pronounced تش.');
  });
});

describe('mergedGuide', () => {
  it('puts the dialect’s own sections first, then its ancestors’', () => {
    const m = mergedGuide(dict, 'ar-ps-fallahi');
    expect(m.sections['Common AI mistakes']).toEqual([
      { dialect: 'ar-ps-fallahi', body: '- Writing the pronunciation.' },
      { dialect: 'ar-ps', body: '- Mixing in Egyptian words.' },
    ]);
    expect(m.sections['Natural usage']).toHaveLength(1);
  });

  it('is empty for a dialect with no guides in its branch', () => {
    expect(mergedGuide(dict, 'en-us-south').sections).toEqual({});
  });
});

describe('buildBriefing', () => {
  it('asks for onboarding when there is no profile', () => {
    const b = buildBriefing(dict, MemorySchema.parse({ version: 1 }));
    expect(b.onboarding).toBe(true);
    expect(b.text).toMatch(/Ask the user/);
    expect(b.text).toContain('openaccent_remember');
    expect(b.text).toContain('ar-ps-fallahi');
  });

  it('includes profile, merged guide, and personal memory', () => {
    const memory = MemorySchema.parse({
      version: 1,
      profile: { dialect: 'ar-ps-fallahi', region: 'قرى رام الله' },
      words: [{ id: 'w1', say: 'هسّا', instead_of: 'هلأ', meaning: 'now', created_at: now }],
      corrections: [{ id: 'c1', wrong: 'كويس', right: 'منيح', created_at: now }],
      style: [{ id: 's1', text: 'Prefers short replies', created_at: now }],
    });
    const b = buildBriefing(dict, memory);
    expect(b.onboarding).toBe(false);
    expect(b.dialect).toBe('ar-ps-fallahi');
    expect(b.text).toContain('Fallahi');
    expect(b.text).toContain('قرى رام الله');
    expect(b.text).toContain('هسّا');
    expect(b.text).toContain('كويس → منيح');
    expect(b.text).toContain('Prefers short replies');
    expect(b.text).toContain('Writing the pronunciation');
    expect(b.text).toContain('Mixing in Egyptian words');
    expect(b.text).toContain('## Core words in this dialect');
    expect(b.text).toContain('- now: هسّع ✓ / الحين (regional)');
    expect(b.text).toContain('## How people actually write it');
    expect(b.text).toContain('> A: وينك؟');
    // Personal memory wins over the dictionary, and the text says so.
    expect(b.text).toMatch(/override the dictionary/i);
    // Draft guides are labeled.
    expect(b.text).toMatch(/draft/i);
  });

  it('warns and onboards when the profile dialect no longer exists', () => {
    const b = buildBriefing(dict, MemorySchema.parse({ version: 1, profile: { dialect: 'ar-zz' } }));
    expect(b.onboarding).toBe(true);
    expect(b.text).toContain('"ar-zz"');
  });
});

describe('profileFooter', () => {
  it('shows the dialect and the latest 3 corrections in one short line', () => {
    const memory = MemorySchema.parse({
      version: 1,
      profile: { dialect: 'ar-ps-fallahi' },
      corrections: ['أ', 'ب', 'ت', 'ث'].map((w, i) => ({ id: `c${i + 1}`, wrong: w, right: `${w}${w}`, created_at: now })),
    });
    const line = profileFooter(memory);
    expect(line).not.toContain('\n');
    expect(line.length).toBeLessThan(200);
    expect(line).toContain('ar-ps-fallahi');
    expect(line).toContain('ث→ثث');
    expect(line).not.toContain('أ→أأ');
  });

  it('points to the briefing when there is no profile', () => {
    expect(profileFooter(MemorySchema.parse({ version: 1 }))).toContain('openaccent_get_briefing');
  });
});
