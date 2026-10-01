import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBundle } from '../../scripts/build-data.js';
import { checkReply } from '../../src/core/check.js';
import { Dictionary } from '../../src/core/dictionary.js';
import { CURRENT_MEMORY_VERSION, MemorySchema } from '../../src/core/memory/index.js';

// check_reply on the real dictionary. A false flag tells a model to "fix" a correct word, which makes
// its Arabic worse, so ordinary sentences must pass with no issues at all. Add a sentence whenever a
// native speaker reports a false flag.
const dict = new Dictionary(buildBundle(join(import.meta.dirname, '../../data')));
const check = (dialect: string, text: string) =>
  checkReply(dict, MemorySchema.parse({ version: CURRENT_MEMORY_VERSION, profile: { dialect } }), text, dialect).issues;

const NATIVE: Record<string, string[]> = {
  'ar-levantine': ['والله مش عارف، بس بدي روح عالبيت هلق', 'شو بدك تعمل اليوم؟ خلينا نطلع مشوار', 'كيفك؟ صرلي زمان ما شفتك', 'هاد الشي كتير حلو، يسلمو ايديك', 'لسا ما خلصت، استنى شوي'],
  'ar-jo': ['هسا بجيك، استنى شوي', 'شو بدك؟ بدي اشي بسيط'],
  'ar-eg': ['انا صحيت بدري النهارده، الحمد لله', 'ازيك يا صاحبي، عامل ايه؟ وحشتني اوي', 'مش عارف اعمل ايه دلوقتي', 'الجو حر اوي النهارده، يلا نروح البحر', 'خلاص ماشي، هكلمك بكرة ان شاء الله'],
  'ar-sa': ['والله ما ادري، بس الحين بروح البيت', 'وش تبي تسوي اليوم؟', 'كيفك؟ عساك طيب', 'ابغى اروح السوق بعدين', 'زين، خلاص نشوفك بكرة'],
  'ar-iq': ['شلونك؟ شكو ماكو؟', 'هسه اجيك، انتظرني شوية', 'اريد اروح للسوك باجر'],
  'ar-ma': ['كيداير؟ لاباس عليك؟', 'بغيت نمشي للدار دابا', 'هادشي مزيان بزاف'],
  'ar-tn': ['شنوة احوالك؟ لاباس؟', 'توا نجي، استناني شوية', 'هذا باهي برشا'],
};

describe('check_reply on real data', () => {
  for (const [dialect, sentences] of Object.entries(NATIVE)) {
    it(`flags nothing in ordinary ${dialect} sentences`, () => {
      for (const s of sentences) expect(check(dialect, s), s).toEqual([]);
    });
  }

  it('still catches well-known slips', () => {
    const slips: [string, string, string, string][] = [
      ['ar-levantine', 'دلوقتي بجيك', 'دلوقتي', 'هلّق'],
      ['ar-levantine', 'سوف اروح', 'سوف', 'رح'],
      ['ar-eg', 'شو بدك؟', 'شو', 'إيه'],
      ['ar-sa', 'عايز اروح', 'عايز', 'أبغى'],
      ['ar-ma', 'توا نجي', 'توا', 'دابا'],
      ['ar-jo', 'ازيك يا زلمة', 'ازيك', 'كيفك'], // inherited from the Levantine list
    ];
    for (const [dialect, text, word, use] of slips) {
      expect(check(dialect, text), text).toEqual([expect.objectContaining({ text: word, kind: 'other_dialect', suggestion: use })]);
    }
  });
});
