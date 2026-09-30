import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { connect, type Harness } from './harness.js';

let h: Harness;
beforeEach(async () => {
  h = await connect();
});
afterEach(async () => h.close());

const setFallahi = () => h.call('openaccent_remember', { kind: 'profile', dialect: 'ar-ps-fallahi' });

describe('server', () => {
  it('lists the 10 tools with annotations', async () => {
    const { tools } = await h.client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'openaccent_check_reply',
      'openaccent_dialect_card',
      'openaccent_export_prompt',
      'openaccent_express',
      'openaccent_forget',
      'openaccent_get_briefing',
      'openaccent_list_dialects',
      'openaccent_lookup',
      'openaccent_remember',
      'openaccent_suggest_entry',
    ]);
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
    expect(byName.openaccent_lookup?.annotations?.readOnlyHint).toBe(true);
    expect(byName.openaccent_forget?.annotations?.destructiveHint).toBe(true);
    // check_reply writes the voice profile when given user_message, so it is not read-only; repeats are not counted twice.
    expect(byName.openaccent_check_reply?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false, idempotentHint: true });
    expect(byName.openaccent_get_briefing?.description).toMatch(/FIRST/);
  });
});

describe('openaccent_get_briefing', () => {
  it('onboards when there is no profile', async () => {
    const r = await h.call('openaccent_get_briefing');
    expect(r.data.onboarding).toBe(true);
    expect(r.text).toContain('openaccent_remember');
    expect(r.text).toContain('No OpenAccent profile yet');
  });

  it('returns the profile and memory once set', async () => {
    await setFallahi();
    await h.call('openaccent_remember', { kind: 'correction', wrong: 'كويس', right: 'منيح' });
    const r = await h.call('openaccent_get_briefing');
    expect(r.data).toMatchObject({ onboarding: false, dialect: 'ar-ps-fallahi' });
    expect(r.text).toContain('كويس → منيح');
  });
});

describe('openaccent_lookup', () => {
  it('uses the profile dialect when none is given (dialect lock)', async () => {
    await setFallahi();
    const r = await h.call('openaccent_lookup', { query: 'زلمة' });
    expect(r.data.dialect).toBe('ar-ps-fallahi');
    expect(r.data.items.map((i: { id: string }) => i.id)).toEqual(['ar-ps-fallahi/zalameh']);
  });

  it('labels drafts as unverified and appends the profile footer', async () => {
    await setFallahi();
    const r = await h.call('openaccent_lookup', { query: '7akoura' });
    expect(r.text).toContain('⚠ unverified');
    expect(r.text).toContain('👤 User dialect: ar-ps-fallahi');
  });

  it('shows the sensitive label on a vulgar meaning', async () => {
    const r = await h.call('openaccent_lookup', { query: 'شرموطة' });
    expect(r.text).toMatch(/⚠ offensive, sexual: never use it unless the user does/);
    expect(r.data.items[0].meanings[0].sensitive).toEqual(['offensive', 'sexual']);
  });

  it('explains an empty result', async () => {
    const r = await h.call('openaccent_lookup', { query: 'غريبة', dialect: 'ar-ps-fallahi' });
    expect(r.data.total).toBe(0);
    expect(r.text).toContain('openaccent_suggest_entry');
  });

  it('returns an actionable error for an unknown dialect', async () => {
    const r = await h.call('openaccent_lookup', { query: 'x', dialect: 'ar-ps-falahi' });
    expect(r.isError).toBe(true);
    expect(r.text).toContain('Did you mean: ar-ps-fallahi');
  });
});

describe('openaccent_express', () => {
  it('compares dialects', async () => {
    const r = await h.call('openaccent_express', { meaning: 'now', dialects: ['ar-ps-fallahi', 'ar-eg'] });
    expect(r.data.results.map((g: { dialect: string }) => g.dialect)).toEqual(['ar-ps-fallahi', 'ar-eg']);
    expect(r.text).toContain('دلوقتي');
  });

  it('needs a dialect when there is no profile', async () => {
    const r = await h.call('openaccent_express', { meaning: 'now' });
    expect(r.isError).toBe(true);
  });
});

describe('openaccent_list_dialects', () => {
  it('shows the tree with stats', async () => {
    const r = await h.call('openaccent_list_dialects');
    expect(r.text).toMatch(/- `ar` Arabic[\s\S]*  - `ar-ps` Palestinian[\s\S]*    - `ar-ps-fallahi`/);
    expect(r.data.dialects.length).toBeGreaterThan(5);
  });
});

describe('openaccent_remember / openaccent_forget', () => {
  it('validates required fields per kind', async () => {
    expect((await h.call('openaccent_remember', { kind: 'correction', wrong: 'x' })).isError).toBe(true);
    expect((await h.call('openaccent_remember', { kind: 'profile', dialect: 'nope-nope' })).isError).toBe(true);
  });

  it('round-trips: remember → briefing → forget', async () => {
    await setFallahi();
    const saved = await h.call('openaccent_remember', { kind: 'style', text: 'Short replies' });
    expect(saved.data).toMatchObject({ created: true, item: { id: 's1' } });
    expect((await h.call('openaccent_get_briefing')).text).toContain('Short replies');
    const gone = await h.call('openaccent_forget', { ids: ['s1'] });
    expect(gone.data.removed).toHaveLength(1);
    expect((await h.call('openaccent_get_briefing')).text).not.toContain('Short replies');
  });

  it('offers sharing after a correction', async () => {
    const r = await h.call('openaccent_remember', { kind: 'correction', wrong: 'كويس', right: 'منيح' });
    expect(r.text).toContain('openaccent_suggest_entry');
  });
});

describe('openaccent_suggest_entry', () => {
  it('returns a pre-filled link with the browser hint', async () => {
    await setFallahi();
    const r = await h.call('openaccent_suggest_entry', { word: 'هاض', meaning_en: 'this' });
    const url = new URL(r.data.url);
    expect(url.searchParams.get('dialect')).toBe('ar-ps-fallahi');
    expect(url.searchParams.get('word')).toBe('هاض');
    expect(r.text).toMatch(/browser/);
  });
});

describe('openaccent_check_reply', () => {
  it('flags other-dialect words with a suggestion', async () => {
    await setFallahi();
    const r = await h.call('openaccent_check_reply', { text: 'دلوقتي بجيك' });
    expect(r.data.issues[0]).toMatchObject({ text: 'دلوقتي', kind: 'other_dialect', suggestion: 'هسّع', start: expect.any(Number), end: expect.any(Number) });
    expect(r.text).toContain('→ use **هسّع**');
  });

  it('learns from the user’s message and accepts dialects they also speak', async () => {
    await h.call('openaccent_remember', { kind: 'profile', dialect: 'ar-ps-fallahi', also_speaks: ['ar-eg'] });
    const r = await h.call('openaccent_check_reply', { text: 'دلوقتي بجيك', user_message: 'ازيك يا زلمة، دلوقتي فاضي؟' });
    expect(r.data.issues).toEqual([]);
    const memory = JSON.parse(readFileSync(h.memoryPath, 'utf8'));
    expect(memory.voice.messages).toBe(1);
    expect(JSON.stringify(memory)).not.toContain('فاضي');
    expect((await h.call('openaccent_remember', { kind: 'profile', also_speaks: ['ar-egg'] })).text).toMatch(/Did you mean/);
  });

  it('needs a dialect when there is no profile', async () => {
    expect((await h.call('openaccent_check_reply', { text: 'hi' })).isError).toBe(true);
  });
});

describe('openaccent_export_prompt', () => {
  it('returns a portable prompt for the profile dialect', async () => {
    await setFallahi();
    await h.call('openaccent_remember', { kind: 'correction', wrong: 'كويس', right: 'منيح' });
    const r = await h.call('openaccent_export_prompt');
    expect(r.data.dialect).toBe('ar-ps-fallahi');
    expect(r.data.text).toContain('"منيح" not "كويس"');
    expect(r.data.text.length).toBeLessThanOrEqual(1500);
  });
});

describe('openaccent_dialect_card', () => {
  it('returns a card for any dialect, independent of the profile', async () => {
    await setFallahi();
    const r = await h.call('openaccent_dialect_card', { dialect: 'ar-ps-fallahi-tshaf', purpose: 'script' });
    expect(r.data).toMatchObject({ dialect: 'ar-ps-fallahi-tshaf', purpose: 'script' });
    expect(r.text).toContain('## Writing for: script');
    expect(r.text).toContain('كيف → said تشيف');
  });

  it('check_reply accepts a purpose', async () => {
    const script = await h.call('openaccent_check_reply', { text: 'تشيف حالك', dialect: 'ar-ps-fallahi-tshaf', purpose: 'script' });
    expect(script.data.issues).toEqual([]);
  });
});
