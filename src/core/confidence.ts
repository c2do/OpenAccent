import type { Attestation, Entry } from './schema.js';

/**
 * How much to trust an entry, from who stands behind it:
 *   verified – a native-speaker reviewer approved it
 *   high     – two or more independent open datasets list it
 *   medium   – one dataset, or a contributor, lists it
 *   low      – an AI draft, or disputed
 *
 * "Independent" means different independence groups in data/sources.yaml, not different names:
 * datasets derived from each other count once.
 */
export type Confidence = 'verified' | 'high' | 'medium' | 'low';

export const CONFIDENCE_RANK: Record<Confidence, number> = { verified: 0, high: 1, medium: 2, low: 3 };

/**
 * The current version of each attestation method, and the oldest version that still counts. When a
 * version turns out too loose, raise `counts`: its attestations stop counting at once, and the next
 * run of the method recomputes them.
 */
export const ATTESTATION_METHODS = {
  'dictionary-match': { current: 1, counts: 1 },
  // v1 counted any two sentence pairs where the word and its meaning co-occurred; v2 also requires
  // precision and lift, so a word that merely appears next to the meaning's word no longer passes.
  'parallel-corpus': { current: 2, counts: 2 },
} as const;

/** Whether an attestation is evidence: it says how it was made, with a method version that still counts. */
export function attestationCounts(a: Attestation): boolean {
  if (!a.method || !a.method_version) return false;
  return a.method_version >= ATTESTATION_METHODS[a.method].counts;
}

/** Dataset name → independence group, from data/sources.yaml. A dataset missing from it is its own group. */
export type SourceGroups = Readonly<Record<string, string>>;

/** Independence groups of the allowed datasets in a parsed data/sources.yaml. */
export function sourceGroups(sources: unknown): SourceGroups {
  const allowed = (sources as { allowed?: Record<string, { independence_group?: unknown }> } | undefined)?.allowed ?? {};
  return Object.fromEntries(
    Object.entries(allowed).flatMap(([name, s]) => (typeof s?.independence_group === 'string' ? [[name, s.independence_group]] : [])),
  );
}

type Evidence = Pick<Entry, 'source' | 'attested_by'> & {
  /** Precomputed when the dictionary is built (see scripts/build-data.ts). */
  independent_sources?: string[];
};

/** Distinct datasets behind the entry: its own source plus attestations that count. */
export function datasetsOf(e: Pick<Entry, 'source' | 'attested_by'>): string[] {
  const own = e.source.kind === 'dataset' && e.source.name ? [e.source.name] : [];
  return [...new Set([...own, ...e.attested_by.filter(attestationCounts).map((a) => a.name)])];
}

/** Independence groups behind the entry: datasets in the same group count once. */
export function independentSourcesOf(e: Evidence, groups: SourceGroups = {}): string[] {
  if (e.independent_sources) return e.independent_sources;
  return [...new Set(datasetsOf(e).map((d) => groups[d] ?? d))];
}

export function confidenceOf(e: Pick<Entry, 'status'> & Evidence, groups?: SourceGroups): Confidence {
  if (e.status === 'verified') return 'verified';
  if (e.status === 'disputed') return 'low';
  const sources = independentSourcesOf(e, groups).length;
  if (sources >= 2) return 'high';
  if (sources === 1 || e.source.kind === 'contributor' || e.source.kind === 'reviewer') return 'medium';
  return 'low';
}

/** Short label the model reads next to an entry. */
export function confidenceLabel(e: Pick<Entry, 'status'> & Evidence, groups?: SourceGroups): string {
  if (e.status === 'disputed') return '⚠ disputed';
  switch (confidenceOf(e, groups)) {
    case 'verified':
      return '✓ verified';
    case 'high':
      return `✓ attested by ${independentSourcesOf(e, groups).length} independent sources (not yet reviewed)`;
    case 'medium':
      return '⚠ unverified (one source)';
    default:
      return '⚠ unverified (draft)';
  }
}
