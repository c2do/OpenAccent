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
    countries: [],
    concepts: {
      now: { en: 'now', ar: 'الآن', category: 'time' },
      how: { en: 'how', ar: 'كيف', category: 'questions' },
    },
    samples: [
      {
        id: 'ar-ps-fallahi/where-are-you',
        dialect: 'ar-ps-fallahi',
        title: 'Where are you?',
        purpose: 'chat',
        context: 'two friends on WhatsApp',
        turns: [
          { from: 'user', text: 'وينك؟' },
          { from: 'reply', text: 'هسّع جاي' },
        ],
        status: 'draft',
        verified_by: [],
        source: { kind: 'ai-draft', license: 'CC-BY-SA-4.0' },
      },
    ],
    dialects: [
      d({ id: 'ar', name: { en: 'Arabic' }, script: 'arab', status: 'proposed' }),
      d({ id: 'ar-ps', parent: 'ar', name: { en: 'Palestinian' }, script: 'arab' }),
      d({
        id: 'ar-ps-fallahi',
        parent: 'ar-ps',
        name: { en: 'Fallahi' },
        script: 'arab',
        sound_rules: [['ك', 'ق']],
      }),
      d({ id: 'ar-ps-fallahi-kaf', parent: 'ar-ps-fallahi', name: { en: 'Fallahi kaf' }, script: 'arab' }),
      d({
        id: 'ar-ps-fallahi-tshaf',
        parent: 'ar-ps-fallahi',
        name: { en: 'Fallahi tshaf' },
        script: 'arab',
        sound_rules: [['تش', 'ك']],
      }),
      d({ id: 'ar-ps-madani', parent: 'ar-ps', name: { en: 'Madani' }, script: 'arab' }),
      d({ id: 'ar-eg', parent: 'ar', name: { en: 'Egyptian' }, script: 'arab' }),
      d({ id: 'en', name: { en: 'English' }, script: 'latn' }),
      d({ id: 'en-us-general', parent: 'en', name: { en: 'General American' }, script: 'latn' }),
      d({ id: 'en-us-south', parent: 'en', name: { en: 'Southern' }, script: 'latn' }),
      d({ id: 'fr-fr', name: { en: 'French (France)' }, script: 'latn' }),
      d({ id: 'es-mx', name: { en: 'Mexican Spanish' }, script: 'latn' }),
    ],
    entries: [
      e('ar-ps-fallahi/hakoura', {
        word: 'حاكورة',
        romanized: ['7akoura', 'hakoura'],
        meanings: [{ ar: 'جنينة صغيرة جنب الدار', en: 'small garden next to the house' }],
      }),
      e('ar-ps-fallahi-tshaf/kif', {
        word: 'كيف',
        spellings: ['تشيف'],
        romanized: ['tshif', 'kif'],
        pronunciation: { simple: 'تشيف' },
        meanings: [{ ar: 'كيف', en: 'how' }],
        concept: 'how',
        status: 'verified',
        verified_by: ['rev'],
      }),
      e('ar-ps-fallahi/hassa', {
        word: 'هسّع',
        spellings: ['هسّا'],
        romanized: ['hassa3'],
        meanings: [{ ar: 'الآن', en: 'now' }],
        concept: 'now',
        status: 'verified',
        verified_by: ['rev'],
      }),
      e('ar-ps-fallahi/ilhin', { word: 'الحين', meanings: [{ ar: 'الآن', en: 'now' }], familiarity: 'regional', concept: 'now' }),
      e('ar-ps-fallahi/qal', {
        word: 'قال',
        spellings: ['كال'],
        meanings: [{ ar: 'قال', en: 'he said' }],
      }),
      e('ar-ps-fallahi/qinn', { word: 'قنّ', meanings: [{ ar: 'قن الجاج', en: 'chicken coop' }] }),
      e('ar-ps-madani/halla', { word: 'هلّأ', romanized: ['halla2'], meanings: [{ ar: 'الآن', en: 'now' }], concept: 'now' }),
      e('ar-ps-madani/hassa-madani', { word: 'حالاً', meanings: [{ en: 'right away' }], concept: 'now' }),
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
      e('en-us-general/end-of-the-day', {
        word: 'at the end of the day',
        type: 'phrase',
        meanings: [{ en: 'ultimately' }],
        familiarity: 'dated',
      }),
      e('ar-eg/sharmoota', { word: 'شرموطة', meanings: [{ en: 'whore', sensitive: ['offensive', 'sexual'] }], register: 'vulgar' }),
      e('fr-fr/amour', { word: 'amour', meanings: [{ en: 'love' }] }),
      e('es-mx/ano-year', { word: 'año', meanings: [{ en: 'year' }] }),
      e('en-us-general/delve', {
        word: 'delve',
        meanings: [{ en: 'to look into something in detail' }],
        familiarity: 'rare',
        related: ['en-us-general/dig-into'],
        notes: 'AI-sounding; people rarely say it.',
      }),
      e('en-us-general/dig-into', {
        word: 'dig into',
        type: 'phrase',
        meanings: [{ en: 'to look into something in detail' }],
      }),
    ],
  };
}
