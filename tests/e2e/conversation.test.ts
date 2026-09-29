import { describe, expect, it } from 'vitest';
import { connect } from '../server/harness.js';

describe('a conversation across two sessions', () => {
  it('remembers the user between server instances', async () => {
    // Session 1: onboarding, profile, lookup, correction.
    const s1 = await connect();
    expect((await s1.call('openaccent_get_briefing')).data.onboarding).toBe(true);
    await s1.call('openaccent_remember', { kind: 'profile', dialect: 'ar-ps-fallahi-kaf', region: 'قرية' });
    const lookup = await s1.call('openaccent_lookup', { query: 'كال' });
    expect(lookup.data.items[0].word).toBe('قال');
    await s1.call('openaccent_remember', { kind: 'correction', wrong: 'كويس', right: 'منيح' });
    await s1.close();

    // Session 2: a new server with the same memory file.
    const s2 = await connect({ memoryPath: s1.memoryPath });
    const briefing = await s2.call('openaccent_get_briefing');
    expect(briefing.text).toContain('كويس → منيح');
    expect(briefing.text).toContain('👤 User dialect: ar-ps-fallahi-kaf · corrections: كويس→منيح');

    const check = await s2.call('openaccent_check_reply', { text: 'كويس، بجيك هسّا' });
    expect(check.data.issues[0]).toMatchObject({ kind: 'correction', suggestion: 'منيح' });

    const link = await s2.call('openaccent_suggest_entry', { word: 'منيح', meaning_en: 'good' });
    expect(link.data.url).toMatch(/^https:\/\/github\.com\/c2do\/OpenAccent\/issues\/new\?template=add-word\.yml/);
    await s2.close();
  });
});
