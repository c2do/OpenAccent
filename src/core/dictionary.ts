import type { Bundle, BundledEntry, BundledSample } from './bundle.js';
import { normalize, normalizerFor } from './normalize.js';
import { arabiziCandidates } from './romanize.js';
import type { Dialect } from './schema.js';
import { detectScript } from './script.js';
import { soundVariants } from './soundfold.js';

/** How a query matched an entry, best first. */
export type MatchKind = 'exact' | 'normalized' | 'fuzzy' | 'romanized' | 'sound' | 'gloss';
const MATCH_RANK: Record<MatchKind, number> = { exact: 0, normalized: 1, fuzzy: 2, romanized: 3, sound: 4, gloss: 5 };
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
  /** The same, loosely normalized (año → ano, heyyy → hey). */
  fuzzyKeys: Set<string>;
  /** Normalized (Latin) romanizations. */
  romanKeys: Set<string>;
  /** Normalized glosses, per language. */
  glosses: { ar: string[]; en: string[] };
}

/** Glosses are English or Arabic; they are normalized with that language's rules. */
const glossScript = (text: string) => (detectScript(text) === 'arab' ? 'arab' : 'latn');
const glossNorm = (text: string, script: string) => normalize(text, { script, dialect: script === 'arab' ? 'ar' : 'en' });
const tokens = (s: string) => s.split(' ').filter(Boolean);

/** 0 = no match, 1 = all query words appear in the gloss, 2 = the query is a whole gloss part. */
function glossScore(query: string, gloss: string, script: string): number {
  const parts = gloss.split(/[;,()]/).map((p) => glossNorm(p, script)).filter(Boolean);
  if (parts.includes(query)) return 2;
  const glossTokens = new Set(tokens(glossNorm(gloss, script)));
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
  /** Normalized word/spelling → entries, across all dialects. */
  private readonly formIndex = new Map<string, BundledEntry[]>();

  /** One normalizer per dialect and level, since rules depend on the dialect's language. */
  private readonly normalizers = new Map<string, (text: string) => string>();

  constructor(readonly bundle: Bundle) {
    for (const d of bundle.dialects) this.dialects.set(d.id, d);
    this.indexed = bundle.entries.map((entry) => {
      const script = this.dialects.get(entry.dialect)?.script ?? detectScript(entry.word);
      const forms = [entry.word, ...entry.spellings];
      const norm = this.normalizer(entry.dialect, 'canonical', script);
      const fuzzy = this.normalizer(entry.dialect, 'fuzzy', script);
      return {
        entry,
        script,
        wordKeys: new Set(forms.map(norm)),
        fuzzyKeys: new Set(forms.map(fuzzy)),
        romanKeys: new Set(entry.romanized.map((r) => normalize(r, 'latn'))),
        glosses: {
          ar: entry.meanings.flatMap((m) => (m.ar ? [m.ar] : [])),
          en: entry.meanings.flatMap((m) => (m.en ? [m.en] : [])),
        },
      };
    });
    for (const ix of this.indexed) {
      for (const key of ix.wordKeys) {
        const list = this.formIndex.get(key) ?? [];
        list.push(ix.entry);
        this.formIndex.set(key, list);
      }
    }
  }

  /**
   * Normalize text the way a dialect's entries are normalized (its script and language rules).
   * Unknown dialects get script rules only, with the script taken from the text.
   */
  normalizer(dialect: string, level: 'canonical' | 'fuzzy' = 'canonical', script?: string): (text: string) => string {
    const key = `${dialect}\u0000${level}\u0000${script ?? ''}`;
    let fn = this.normalizers.get(key);
    if (!fn) {
      const d = this.dialects.get(dialect);
      fn = d || script
        ? normalizerFor({ id: dialect, script: script ?? d!.script }, level)
        : (text: string) => normalize(text, { script: detectScript(text), level });
      this.normalizers.set(key, fn);
    }
    return fn;
  }

  /** Entries in any dialect whose written word or a listed spelling matches this form, normalized as `dialect` does. */
  findByForm(form: string, dialect: string): BundledEntry[] {
    return this.formIndex.get(this.normalizer(dialect)(form)) ?? [];
  }

  getEntry(id: string): BundledEntry | undefined {
    return this.indexed.find((ix) => ix.entry.id === id)?.entry;
  }

  /** Entries in a dialect branch that mean the same as `entry` (explicit `related` links or a shared gloss). */
  equivalentsIn(entry: BundledEntry, dialect: string): BundledEntry[] {
    const branch = this.branch(dialect);
    const inBranch = this.scope(branch);
    const related = new Set(entry.related);
    const glosses = entry.meanings.flatMap((m) => [m.en, m.ar]).filter((g): g is string => Boolean(g));
    const found = inBranch.filter((ix) => {
      if (ix.entry.id === entry.id) return false;
      if (related.has(ix.entry.id) || ix.entry.related.includes(entry.id)) return true;
      if (entry.concept && ix.entry.concept === entry.concept) return true;
      // Same meaning = the two glosses share a whole part ("you all; you (plural)" vs "you all").
      return glosses.some((g) => {
        const script = glossScript(g);
        const parts = g.split(/[;,()]/).map((p) => glossNorm(p, script)).filter(Boolean);
        return ix.glosses[script === 'arab' ? 'ar' : 'en'].some((own) => parts.some((q) => glossScore(q, own, script) === 2));
      });
    });
    return this.rank(
      found.map((ix) => ({ entry: ix.entry, match: 'gloss' as const, inherited: ix.entry.dialect !== dialect })),
      branch,
    ).map((m) => m.entry);
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
    const qScript = detectScript(q);
    const qLatin = normalize(q, 'latn');
    // The query is normalized the way each entry's dialect is (once per dialect, not per entry).
    const qKeys = new Map<string, { canonical: string; fuzzy: string }>();
    const keysFor = (ix: IndexedEntry) => {
      const id = ix.entry.dialect;
      let k = qKeys.get(id);
      if (!k) {
        k = { canonical: this.normalizer(id, 'canonical', ix.script)(q), fuzzy: this.normalizer(id, 'fuzzy', ix.script)(q) };
        qKeys.set(id, k);
      }
      return k;
    };
    const candidates = qScript === 'latn' ? new Set(arabiziCandidates(q)) : new Set<string>();
    // Sound rules add up along the branch: fallahi-tshaf gets its own تش rule plus fallahi's ق rule.
    const rules = branch?.flatMap((id) => this.dialects.get(id)?.sound_rules ?? []);
    // Spoken → written variants are compared with the written word only, not with spellings
    // (spellings hold spoken forms, and matching them would chain the rules).
    const qSound = new Set(qScript === 'arab' ? soundVariants(q, 'arab', rules) : []);
    const qGlossScript = qScript === 'arab' ? 'arab' : 'latn';
    const qGloss = glossNorm(q, qGlossScript);

    const matches: Match[] = [];
    for (const ix of this.scope(branch)) {
      const { entry } = ix;
      let kind: MatchKind | undefined;
      if (entry.word === q || entry.spellings.includes(q)) kind = 'exact';
      else if (ix.wordKeys.has(keysFor(ix).canonical)) kind = 'normalized';
      else if (ix.fuzzyKeys.has(keysFor(ix).fuzzy)) kind = 'fuzzy';
      else if (qScript === 'latn' && (ix.romanKeys.has(qLatin) || (ix.script === 'arab' && [...ix.wordKeys].some((k) => candidates.has(k)))))
        kind = 'romanized';
      else if (qSound.size && qSound.has(normalize(entry.word, ix.script))) kind = 'sound';
      else if (ix.glosses[qGlossScript === 'arab' ? 'ar' : 'en'].some((g) => glossScore(qGloss, g, qGlossScript) > 0)) kind = 'gloss';
      if (kind) matches.push({ entry, match: kind, inherited: branch ? entry.dialect !== branch[0] : false });
    }
    return this.paginate(this.rank(this.applyOverrides(matches, branch), branch), opts);
  }

  /** Find how to say a meaning (English or Arabic gloss) in one or more dialects, grouped by dialect. */
  express(meaning: string, opts: { dialects: string[]; limit?: number }): (Page<Match> & { dialect: string })[] {
    const script = glossScript(meaning);
    const q = glossNorm(meaning, script);
    const lang = script === 'arab' ? 'ar' : 'en';
    const concept = this.findConcept(meaning);
    return opts.dialects.map((dialect) => {
      const branch = this.branch(dialect);
      const scored: { m: Match; score: number }[] = [];
      for (const ix of this.scope(branch)) {
        // An entry linked to the matching core concept is the best answer there is.
        const conceptScore = concept && ix.entry.concept === concept ? 3 : 0;
        const score = Math.max(conceptScore, ...ix.glosses[lang].map((g) => glossScore(q, g, script)));
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

  /** The core concept a meaning refers to: its id ("how_are_you") or one of its glosses ("now", "الآن"). */
  findConcept(meaning: string): string | undefined {
    const id = meaning.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (this.bundle.concepts?.[id]) return id;
    for (const [cid, c] of Object.entries(this.bundle.concepts ?? {})) {
      for (const g of [c.en, c.ar]) {
        const script = glossScript(g);
        const wanted = glossNorm(meaning, script);
        if (wanted && g.split(/[;,()]/).some((part) => glossNorm(part, script) === wanted)) return cid;
      }
    }
    return undefined;
  }

  /** For each core concept, how a dialect says it: nearest dialect first, verified first. */
  coreWords(dialect: string): { concept: string; gloss: string; entries: BundledEntry[] }[] {
    const branch = this.branch(dialect);
    const byConcept = new Map<string, Match[]>();
    for (const ix of this.scope(branch)) {
      if (!ix.entry.concept) continue;
      const list = byConcept.get(ix.entry.concept) ?? [];
      list.push({ entry: ix.entry, match: 'exact', inherited: ix.entry.dialect !== dialect });
      byConcept.set(ix.entry.concept, list);
    }
    const order = Object.keys(this.bundle.concepts ?? {});
    return [...byConcept.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([concept, matches]) => ({
        concept,
        gloss: this.bundle.concepts?.[concept]?.en ?? concept,
        entries: this.rank(matches, branch).map((m) => m.entry),
      }));
  }

  /** Samples for a dialect branch: matching purpose first, then nearest dialect, then verified. */
  samplesFor(dialect: string, limit = 3, purpose: string = 'chat'): BundledSample[] {
    const branch = this.branch(dialect);
    return (this.bundle.samples ?? [])
      .filter((s) => branch.includes(s.dialect))
      .sort(
        (a, b) =>
          Number((b.purpose ?? 'chat') === purpose) - Number((a.purpose ?? 'chat') === purpose) ||
          branch.indexOf(a.dialect) - branch.indexOf(b.dialect) ||
          STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
          a.id.localeCompare(b.id),
      )
      .slice(0, limit);
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


  /** When the same word exists at several levels of the branch, keep only the nearest one. */
  private applyOverrides(matches: Match[], branch: string[] | undefined): Match[] {
    if (!branch) return matches;
    const nearest = new Map<string, number>();
    const keyOf = (m: Match) => this.normalizer(m.entry.dialect)(m.entry.word);
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
