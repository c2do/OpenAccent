import type { Bundle, BundledEntry } from './bundle.js';
import { normalize } from './normalize.js';
import { arabiziCandidates } from './romanize.js';
import type { Dialect } from './schema.js';
import { soundKey } from './soundfold.js';

/** How a query matched an entry, best first. */
export type MatchKind = 'exact' | 'normalized' | 'romanized' | 'sound' | 'gloss';
const MATCH_RANK: Record<MatchKind, number> = { exact: 0, normalized: 1, romanized: 2, sound: 3, gloss: 4 };
const STATUS_RANK = { verified: 0, draft: 1, disputed: 2 } as const;
const FAMILIARITY_RANK = { common: 0, regional: 1, rare: 2, dated: 3 } as const;

export interface Match {
  entry: BundledEntry;
  match: MatchKind;
  /** True when the entry comes from an ancestor of the requested dialect. */
  inherited: boolean;
}

export interface Page<T> {
  total: number;
  count: number;
  offset: number;
  items: T[];
  has_more: boolean;
  next_offset?: number;
}

export interface DialectSummary {
  id: string;
  parent?: string;
  name: Dialect['name'];
  script: string;
  status: Dialect['status'];
  entries: number;
  verified: number;
  verifiedPercent: number;
}

interface IndexedEntry {
  entry: BundledEntry;
  script: string;
  /** Normalized word and spellings. */
  wordKeys: Set<string>;
  /** Normalized (Latin) romanizations. */
  romanKeys: Set<string>;
  /** Normalized glosses, per language. */
  glosses: { ar: string[]; en: string[] };
}

const ARABIC = /[؀-ۿ]/;
const scriptOf = (text: string) => (ARABIC.test(text) ? 'arab' : 'latn');
const tokens = (s: string) => s.split(' ').filter(Boolean);

/** 0 = no match, 1 = all query words appear in the gloss, 2 = the query is a whole gloss part. */
function glossScore(query: string, gloss: string, script: string): number {
  const parts = gloss.split(/[;,()]/).map((p) => normalize(p, script)).filter(Boolean);
  if (parts.includes(query)) return 2;
  const glossTokens = new Set(tokens(normalize(gloss, script)));
  const q = tokens(query);
  return q.length > 0 && q.every((t) => glossTokens.has(t)) ? 1 : 0;
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length]!;
}

export class Dictionary {
  private readonly dialects = new Map<string, Dialect>();
  private readonly indexed: IndexedEntry[];
  private readonly soundCache = new Map<string, Set<string>>();

  constructor(readonly bundle: Bundle) {
    for (const d of bundle.dialects) this.dialects.set(d.id, d);
    this.indexed = bundle.entries.map((entry) => {
      const script = this.dialects.get(entry.dialect)?.script ?? scriptOf(entry.word);
      return {
        entry,
        script,
        wordKeys: new Set([entry.word, ...entry.spellings].map((w) => normalize(w, script))),
        romanKeys: new Set(entry.romanized.map((r) => normalize(r, 'latn'))),
        glosses: {
          ar: entry.meanings.flatMap((m) => (m.ar ? [m.ar] : [])),
          en: entry.meanings.flatMap((m) => (m.en ? [m.en] : [])),
        },
      };
    });
  }

  getDialect(id: string): Dialect | undefined {
    return this.dialects.get(id);
  }

  /** The dialect and its ancestors, nearest first. Throws for an unknown dialect. */
  branch(id: string): string[] {
    this.requireDialect(id);
    const out: string[] = [];
    for (let d: Dialect | undefined = this.dialects.get(id); d; d = d.parent ? this.dialects.get(d.parent) : undefined) {
      if (out.includes(d.id)) break;
      out.push(d.id);
    }
    return out;
  }

  /** Find entries by word form: exact, normalized, romanized/Arabizi, dialect sound variants, then gloss. */
  lookup(query: string, opts: { dialect?: string; limit?: number; offset?: number } = {}): Page<Match> {
    const q = query.trim();
    const branch = opts.dialect ? this.branch(opts.dialect) : undefined;
    const qScript = scriptOf(q);
    const qLatin = normalize(q, 'latn');
    const candidates = qScript === 'latn' ? new Set(arabiziCandidates(q)) : new Set<string>();
    const rulesOwner = branch?.find((id) => this.dialects.get(id)?.sound_rules?.length);
    const rules = rulesOwner ? this.dialects.get(rulesOwner)?.sound_rules : undefined;
    const qSound = rules ? soundKey(q, 'arab', rules) : undefined;
    const qGloss = normalize(q, qScript);

    const matches: Match[] = [];
    for (const ix of this.scope(branch)) {
      const { entry } = ix;
      let kind: MatchKind | undefined;
      if (entry.word === q || entry.spellings.includes(q)) kind = 'exact';
      else if (ix.wordKeys.has(normalize(q, ix.script))) kind = 'normalized';
      else if (qScript === 'latn' && (ix.romanKeys.has(qLatin) || (ix.script === 'arab' && [...ix.wordKeys].some((k) => candidates.has(k)))))
        kind = 'romanized';
      else if (qSound && ix.script === 'arab' && this.soundKeys(ix, rulesOwner!, rules!).has(qSound)) kind = 'sound';
      else if (ix.glosses[qScript === 'arab' ? 'ar' : 'en'].some((g) => glossScore(qGloss, g, qScript) > 0)) kind = 'gloss';
      if (kind) matches.push({ entry, match: kind, inherited: branch ? entry.dialect !== branch[0] : false });
    }
    return this.paginate(this.rank(this.applyOverrides(matches, branch), branch), opts);
  }

  /** Find how to say a meaning (English or Arabic gloss) in one or more dialects, grouped by dialect. */
  express(meaning: string, opts: { dialects: string[]; limit?: number }): (Page<Match> & { dialect: string })[] {
    const script = scriptOf(meaning);
    const q = normalize(meaning, script);
    const lang = script === 'arab' ? 'ar' : 'en';
    return opts.dialects.map((dialect) => {
      const branch = this.branch(dialect);
      const scored: { m: Match; score: number }[] = [];
      for (const ix of this.scope(branch)) {
        const score = Math.max(0, ...ix.glosses[lang].map((g) => glossScore(q, g, script)));
        if (score > 0) {
          scored.push({ m: { entry: ix.entry, match: 'gloss', inherited: ix.entry.dialect !== dialect }, score });
        }
      }
      const best = Math.max(0, ...scored.map((s) => s.score));
      // Prefer exact gloss matches; fall back to partial ones only when there are none.
      const kept = this.applyOverrides(scored.filter((s) => s.score === best).map((s) => s.m), branch);
      return { dialect, ...this.paginate(this.rank(kept, branch), { limit: opts.limit }) };
    });
  }

  listDialects(): DialectSummary[] {
    return [...this.dialects.values()].map((d) => {
      const own = this.indexed.filter((ix) => ix.entry.dialect === d.id);
      const verified = own.filter((ix) => ix.entry.status === 'verified').length;
      return {
        id: d.id,
        ...(d.parent ? { parent: d.parent } : {}),
        name: d.name,
        script: d.script,
        status: d.status,
        entries: own.length,
        verified,
        verifiedPercent: own.length ? Math.round((verified / own.length) * 100) : 0,
      };
    });
  }

  private requireDialect(id: string): void {
    if (this.dialects.has(id)) return;
    const close = [...this.dialects.keys()]
      .map((k) => ({ k, d: levenshtein(id, k) }))
      .filter((x) => x.d <= 3)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((x) => x.k);
    const hint = close.length ? ` Did you mean: ${close.join(', ')}?` : ' Use list_dialects to see all dialects.';
    throw new Error(`Unknown dialect "${id}".${hint}`);
  }

  private scope(branch: string[] | undefined): IndexedEntry[] {
    return branch ? this.indexed.filter((ix) => branch.includes(ix.entry.dialect)) : this.indexed;
  }

  private soundKeys(ix: IndexedEntry, rulesOwner: string, rules: [string, string][]): Set<string> {
    const cacheKey = `${rulesOwner}|${ix.entry.id}`;
    let keys = this.soundCache.get(cacheKey);
    if (!keys) {
      keys = new Set([ix.entry.word, ...ix.entry.spellings].map((w) => soundKey(w, 'arab', rules)));
      this.soundCache.set(cacheKey, keys);
    }
    return keys;
  }

  /** When the same word exists at several levels of the branch, keep only the nearest one. */
  private applyOverrides(matches: Match[], branch: string[] | undefined): Match[] {
    if (!branch) return matches;
    const nearest = new Map<string, number>();
    const keyOf = (m: Match) => normalize(m.entry.word, this.dialects.get(m.entry.dialect)?.script ?? 'arab');
    for (const m of matches) {
      const depth = branch.indexOf(m.entry.dialect);
      const key = keyOf(m);
      nearest.set(key, Math.min(nearest.get(key) ?? Infinity, depth));
    }
    return matches.filter((m) => branch.indexOf(m.entry.dialect) === nearest.get(keyOf(m)));
  }

  private rank(matches: Match[], branch: string[] | undefined): Match[] {
    const depth = (m: Match) => (branch ? branch.indexOf(m.entry.dialect) : 0);
    return [...matches].sort(
      (a, b) =>
        MATCH_RANK[a.match] - MATCH_RANK[b.match] ||
        STATUS_RANK[a.entry.status] - STATUS_RANK[b.entry.status] ||
        depth(a) - depth(b) ||
        FAMILIARITY_RANK[a.entry.familiarity] - FAMILIARITY_RANK[b.entry.familiarity] ||
        a.entry.id.localeCompare(b.entry.id),
    );
  }

  private paginate<T>(items: T[], opts: { limit?: number; offset?: number }): Page<T> {
    const offset = Math.max(0, opts.offset ?? 0);
    const limit = Math.max(1, opts.limit ?? 20);
    const page = items.slice(offset, offset + limit);
    const has_more = offset + page.length < items.length;
    return {
      total: items.length,
      count: page.length,
      offset,
      items: page,
      has_more,
      ...(has_more ? { next_offset: offset + page.length } : {}),
    };
  }
}
