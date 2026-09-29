import { describe, expect, it } from 'vitest';
import { BUDGETS_MS, runBench } from '../bench/run.js';

// Guards against search going back to scanning every entry (it used to: lookup p95 was
// 131 ms and check_reply 1.7 s at 20,000 entries). Startup is reported by `npm run bench`
// but not enforced here: it depends on the machine, and meeting it needs a precompiled index.
describe('performance budgets (20,000 synthetic entries)', () => {
  it('keeps lookup, express and check_reply within budget', { timeout: 60_000 }, () => {
    const r = runBench(20_000);
    expect(r.lookupP95).toBeLessThan(BUDGETS_MS.lookupP95);
    expect(r.expressP95).toBeLessThan(BUDGETS_MS.expressP95);
    expect(r.checkReplyP95).toBeLessThan(BUDGETS_MS.checkReplyP95);
  });
});
