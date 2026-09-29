import type { Entry } from './schema.js';

/**
 * How much to trust an entry, from who stands behind it:
 *   verified – a native-speaker reviewer approved it
 *   high     – two or more independent open datasets list it
 *   medium   – one dataset, or a contributor, lists it
 *   low      – an AI draft, or disputed
 */
export type Confidence = 'verified' | 'high' | 'medium' | 'low';

export const CONFIDENCE_RANK: Record<Confidence, number> = { verified: 0, high: 1, medium: 2, low: 3 };

/** Distinct datasets that list the entry: its own source plus `attested_by`. */
export function datasetsOf(e: Pick<Entry, 'source' | 'attested_by'>): string[] {
  const own = e.source.kind === 'dataset' && e.source.name ? [e.source.name] : [];
  return [...new Set([...own, ...e.attested_by.map((a) => a.name)])];
}

export function confidenceOf(e: Pick<Entry, 'status' | 'source' | 'attested_by'>): Confidence {
  if (e.status === 'verified') return 'verified';
  if (e.status === 'disputed') return 'low';
  const datasets = datasetsOf(e).length;
  if (datasets >= 2) return 'high';
  if (datasets === 1 || e.source.kind === 'contributor' || e.source.kind === 'reviewer') return 'medium';
  return 'low';
}

/** Short label the model reads next to an entry. */
export function confidenceLabel(e: Pick<Entry, 'status' | 'source' | 'attested_by'>): string {
  if (e.status === 'disputed') return '⚠ disputed';
  switch (confidenceOf(e)) {
    case 'verified':
      return '✓ verified';
    case 'high':
      return `✓ attested by ${datasetsOf(e).length} independent sources (not yet reviewed)`;
    case 'medium':
      return '⚠ unverified (one source)';
    default:
      return '⚠ unverified (draft)';
  }
}
