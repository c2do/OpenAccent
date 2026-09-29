import type { Bundle, BundledEntry } from '../../src/core/bundle.js';
import { DialectSchema, EntrySchema } from '../../src/core/schema.js';

const d = (raw: Record<string, unknown>) => DialectSchema.parse({ status: 'active', reviewers: ['rev'], ...raw });

const e = (id: string, raw: Record<string, unknown>): BundledEntry => ({
  id,
  ...EntrySchema.parse({
    dialect: id.split('/')[0],
    type: 'word',
    status: 'draft',
    source: { kind: 'ai-draft' },
    ...raw,
  }),
});

/** A small dictionary: Arabic tree with fallahi + madani, English tree with general + south. */
export function fixtureBundle(): Bundle {
  return {
    formatVersion: 1,
    builtAt: '',
    guides: {},
    dialects: [
      d({ id: 'ar', name: { en: 'Arabic' }, script: 'arab', status: 'proposed' }),
      d({ id: 'ar-ps', parent: 'ar', name: { en: 'Palestinian' }, script: 'arab' }),
      d({
        id: 'ar-ps-fallahi',
        parent: 'ar-ps',
        name: { en: 'Fallahi' },
        script: 'arab',
        sound_rules: [
          ['تش', 'ك'],
          ['ك', 'ق'],
        ],
      }),
      d({ id: 'ar-ps-madani', parent: 'ar-ps', name: { en: 'Madani' }, script: 'arab' }),
      d({ id: 'ar-eg', parent: 'ar', name: { en: 'Egyptian' }, script: 'arab' }),
      d({ id: 'en', name: { en: 'English' }, script: 'latn' }),
      d({ id: 'en-us-general', parent: 'en', name: { en: 'General American' }, script: 'latn' }),
      d({ id: 'en-us-south', parent: 'en', name: { en: 'Southern' }, script: 'latn' }),
    ],
    entries: [
      e('ar-ps-fallahi/hakoura', {
        word: 'حاكورة',
        romanized: ['7akoura', 'hakoura'],
        meanings: [{ ar: 'جنينة صغيرة جنب الدار', en: 'small garden next to the house' }],
      }),
      e('ar-ps-fallahi/kif', {
        word: 'كيف',
        spellings: ['تشيف'],
        romanized: ['tshif', 'kif'],
        pronunciation: { simple: 'تشيف' },
        meanings: [{ ar: 'كيف', en: 'how' }],
        status: 'verified',
        verified_by: ['rev'],
      }),
      e('ar-ps-fallahi/hassa', {
        word: 'هسّع',
        spellings: ['هسّا'],
        romanized: ['hassa3'],
        meanings: [{ ar: 'الآن', en: 'now' }],
        status: 'verified',
        verified_by: ['rev'],
      }),
      e('ar-ps-fallahi/ilhin', { word: 'الحين', meanings: [{ ar: 'الآن', en: 'now' }], familiarity: 'regional' }),
      e('ar-ps-fallahi/qal', {
        word: 'قال',
        spellings: ['كال'],
        meanings: [{ ar: 'قال', en: 'he said' }],
      }),
      e('ar-ps-fallahi/qinn', { word: 'قنّ', meanings: [{ ar: 'قن الجاج', en: 'chicken coop' }] }),
      e('ar-ps-madani/halla', { word: 'هلّأ', romanized: ['halla2'], meanings: [{ ar: 'الآن', en: 'now' }] }),
      e('ar-eg/dilwaqti', { word: 'دلوقتي', meanings: [{ ar: 'الآن', en: 'now' }] }),
      // Shared Palestinian word, and a fallahi override of the same word.
      e('ar-ps/manih', { word: 'منيح', meanings: [{ ar: 'جيد', en: 'good' }] }),
      e('ar-ps/zalameh', { word: 'زلمة', meanings: [{ ar: 'رجل', en: 'man' }] }),
      e('ar-ps-fallahi/zalameh', {
        word: 'زلمة',
        meanings: [{ ar: 'رجل (بالفلاحي)', en: 'man (fallahi usage)' }],
      }),
      e('en-us-south/yall', { word: "y'all", meanings: [{ en: 'you all; you (plural)' }], familiarity: 'regional' }),
      e('en-us-general/you-guys', { word: 'you guys', type: 'phrase', meanings: [{ en: 'you all; you (plural)' }] }),
      e('en-us-general/color', { word: 'color', meanings: [{ en: 'color' }] }),
    ],
  };
}
