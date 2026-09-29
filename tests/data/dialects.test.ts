import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBundle } from '../../scripts/build-data.js';

const bundle = buildBundle(join(import.meta.dirname, '../../data'));

describe('repository data', () => {
  it('has a folder for every country and territory', () => {
    expect(bundle.countries.length).toBeGreaterThan(240);
    expect(bundle.countries.find((c) => c.code === 'ps')?.name).toMatchObject({ en: 'Palestine', ar: 'فلسطين' });
  });

  it('files country dialects under their country and shared nodes under languages', () => {
    const where = Object.fromEntries(bundle.dialects.map((d) => [d.id, d.country ?? 'languages']));
    expect(where['ar-ps-fallahi-kaf']).toBe('ps');
    expect(where['en-us-general']).toBe('us');
    expect(where['ar-levantine']).toBe('languages');
  });

  it('only fallahi and fallahi-kaf are active so far', () => {
    const active = bundle.dialects.filter((d) => d.status === 'active').map((d) => d.id);
    expect(active.sort()).toEqual(['ar-ps-fallahi', 'ar-ps-fallahi-kaf']);
  });
});
