import type { Bundle, BundledEntry, BundledSample } from './bundle.js';
import { normalize, normalizerFor } from './normalize.js';
import { arabiziCandidates } from './romanize.js';
import type { DialectSummary, MatchKindSchema } from './results.js';
import type { Dialect } from './schema.js';
import type { z } from 'zod';
import { detectScript } from './script.js';
import { soundVariants } from './soundfold.js';

/** How a query matched an entry, best first. */
export type MatchKind = z.infer<typeof MatchKindSchema>;
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

export type { DialectSummary } from './results.js';

interface IndexedGloss {
  /** Whole gloss parts, split on ; , ( ) — "you all; you (plural)" → "you all", "you", "plural". */
  parts: Set<string>;
  tokens: Set<string>;
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
  /** Normalized glosses, per language, one item per meaning. */
  glosses: { ar: IndexedGloss[]; en: IndexedGloss[] };
}

type Lang = 'ar' | 'en';
type Index = Map<string, IndexedEntry[]>;

/** Glosses are English or Arabic; they are normalized with that language's rules. */
const glossScript = (text: string) => (detectScript(text) === 'arab' ? 'arab' : 'latn');
const langOf = (script: string): Lang => (script === 'arab' ? 'ar' : 'en');
const glossNorm = (text: string, script: string) => normalize(text, { script, dialect: langOf(script) });
const tokens = (s: string) => s.split(' ').filter(Boolean);
const splitParts = (gloss: string, script: string) => gloss.split(/[;,()]/).map((p) => glossNorm(p, script)).filter(Boolean);

function indexGloss(gloss: string, script: string): IndexedGloss {
  // Parts split on the same punctuation normalization turns into spaces, so their words are the gloss's words.
  const parts = new Set(splitParts(gloss, script));
  return { parts, tokens: new Set([...parts].flatMap(tokens)) };
}

/** 0 = no match, 1 = all query words appear in one gloss, 2 = the query is a whole gloss part. */
function glossScore(query: string, queryTokens: string[], glosses: IndexedGloss[]): number {
  let best = 0;
  for (const g of glosses) {
    if (g.parts.has(query)) return 2;
    if (queryTokens.length > 0 && queryTokens.every((t) => g.tokens.has(t))) best = 1;
  }
  return best;
}

function push(index: Index, key: string, ix: IndexedEntry) {
  const list = index.get(key);
  if (list) {
    if (list[list.length - 1] !== ix) list.push(ix);
  } else index.set(key, [ix]);
}

const collator = new Intl.Collator();

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

  // Indexes, built once. Every search starts from one of these instead of scanning all entries.
  private readonly byId = new Map<string, IndexedEntry>();
  private readonly byDialect: Index = new Map();
  private readonly byConcept: Index = new Map();
  /** Entries that list this id in `related` (the reverse direction of `related`). */
  private readonly relatedFrom: Index = new Map();
  /** Raw word/spelling → entries. */
  private readonly exactIndex: Index = new Map();
  /** Normalized word/spelling (each entry by its own dialect's rules) → entries. */
  private readonly formIndex: Index = new Map();
  private readonly fuzzyIndex: Index = new Map();
  private readonly romanIndex: Index = new Map();
  /** Written word only, script rules only → entries (for spoken → written sound variants). */
  private readonly writtenIndex: Index = new Map();
  private readonly glossTokenIndex: Record<Lang, Index> = { ar: new Map(), en: new Map() };
  private readonly glossPartIndex: Record<Lang, Index> = { ar: new Map(), en: new Map() };
  private readonly branches = new Map<string, string[]>();
  /** Words in the longest entry (after normalization), so phrase checks know how far to look. */
  readonly maxPhraseTokens: number;
  private conceptIndex?: Map<string, { cid: string; order: number }>;

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
          ar: entry.meanings.flatMap((m) => (m.ar ? [indexGloss(m.ar, 'arab')] : [])),
          en: entry.meanings.flatMap((m) => (m.en ? [indexGloss(m.en, 'latn')] : [])),
        },
      };
    });
    let longest = 1;
    for (const ix of this.indexed) {
      const { entry } = ix;
      this.byId.set(entry.id, ix);
      push(this.byDialect, entry.dialect, ix);
      if (entry.concept) push(this.byConcept, entry.concept, ix);
      for (const id of entry.related) push(this.relatedFrom, id, ix);
      for (const form of [entry.word, ...entry.spellings]) push(this.exactIndex, form, ix);
      for (const key of ix.wordKeys) push(this.formIndex, key, ix);
      for (const key of ix.fuzzyKeys) push(this.fuzzyIndex, key, ix);
      for (const key of ix.romanKeys) push(this.romanIndex, key, ix);
      push(this.writtenIndex, normalize(entry.word, ix.script), ix);
      for (const key of ix.wordKeys) longest = Math.max(longest, key.split(' ').length);
      for (const lang of ['ar', 'en'] as const) {
        for (const g of ix.glosses[lang]) {
          for (const t of g.tokens) push(this.glossTokenIndex[lang], t, ix);
          for (const part of g.parts) push(this.glossPartIndex[lang], part, ix);
        }
      }
    }
    this.maxPhraseTokens = longest;
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
    return (this.formIndex.get(this.normalizer(dialect)(form)) ?? []).map((ix) => ix.entry);
  }

  getEntry(id: string): BundledEntry | undefined {
    return this.byId.get(id)?.entry;
  }

  /** Entries in a dialect branch that mean the same as `entry` (explicit `related` links, a shared concept, or a shared gloss). */
  equivalentsIn(entry: BundledEntry, dialect: string): BundledEntry[] {
    const branch = this.branch(dialect);
    const found = new Set<IndexedEntry>();
    const add = (list: IndexedEntry[] | undefined) => {
      for (const ix of list ?? []) if (ix.entry.id !== entry.id && branch.includes(ix.entry.dialect)) found.add(ix);
    };
    for (const id of entry.related) add(this.byId.has(id) ? [this.byId.get(id)!] : undefined);
    add(this.relatedFrom.get(entry.id));
    if (entry.concept) add(this.byConcept.get(entry.concept));
    // Same meaning = the two glosses share a whole part ("you all; you (plural)" vs "you all").
    for (const m of entry.meanings) {
      for (const g of [m.en, m.ar]) {
        if (!g) continue;
        const script = glossScript(g);
        for (const part of splitParts(g, script)) add(this.glossPartIndex[langOf(script)].get(part));
      }
    }
    return this.rank(
      [...found].map((ix) => ({ entry: ix.entry, match: 'gloss' as const, inherited: ix.entry.dialect !== dialect })),
      branch,
    ).map((m) => m.entry);
  }

  getDialect(id: string): Dialect | undefined {
    return this.dialects.get(id);
  }

  /** The dialect and its ancestors, nearest first. Throws for an unknown dialect. */
  branch(id: string): string[] {
    const cached = this.branches.get(id);
    if (cached) return cached;
    this.requireDialect(id);
    const out: string[] = [];
    for (let d: Dialect | undefined = this.dialects.get(id); d; d = d.parent ? this.dialects.get(d.parent) : undefined) {
      if (out.includes(d.id)) break;
      out.push(d.id);
    }
    this.branches.set(id, out);
    return out;
  }

  /** Find entries by word form: exact, normalized, fuzzy, romanized/Arabizi, dialect sound variants, then gloss. */
  lookup(query: string, opts: { dialect?: string; limit?: number; offset?: number } = {}): Page<Match> {
    const q = query.trim();
    const branch = opts.dialect ? this.branch(opts.dialect) : undefined;
    const dialectsInScope = branch ?? [...this.dialects.keys()];
    const inScope = new Set(dialectsInScope);
    const qScript = detectScript(q);

    // Each entry keeps its best way of matching.
    const best = new Map<IndexedEntry, MatchKind>();
    const add = (list: IndexedEntry[] | undefined, kind: MatchKind, keep?: (ix: IndexedEntry) => boolean) => {
      for (const ix of list ?? []) {
        if (!inScope.has(ix.entry.dialect) || (keep && !keep(ix))) continue;
        const current = best.get(ix);
        if (!current || MATCH_RANK[kind] < MATCH_RANK[current]) best.set(ix, kind);
      }
    };

    add(this.exactIndex.get(q), 'exact');
    // The query is normalized the way each dialect normalizes its own entries.
    for (const level of ['canonical', 'fuzzy'] as const) {
      const dialectsByKey = new Map<string, Set<string>>();
      for (const id of dialectsInScope) {
        const key = this.normalizer(id, level)(q);
        if (!dialectsByKey.has(key)) dialectsByKey.set(key, new Set());
        dialectsByKey.get(key)!.add(id);
      }
      const index = level === 'canonical' ? this.formIndex : this.fuzzyIndex;
      for (const [key, ids] of dialectsByKey) {
        add(index.get(key), level === 'canonical' ? 'normalized' : 'fuzzy', (ix) => ids.has(ix.entry.dialect));
      }
    }
    if (qScript === 'latn') {
      add(this.romanIndex.get(normalize(q, 'latn')), 'romanized');
      for (const candidate of arabiziCandidates(q)) add(this.formIndex.get(candidate), 'romanized', (ix) => ix.script === 'arab');
    }
    if (qScript === 'arab') {
      // Sound rules add up along the branch: fallahi-tshaf gets its own تش rule plus fallahi's ق rule.
      const rules = branch?.flatMap((id) => this.dialects.get(id)?.sound_rules ?? []);
      // Spoken → written variants are compared with the written word only, not with spellings
      // (spellings hold spoken forms, and matching them would chain the rules).
      for (const v of soundVariants(q, 'arab', rules)) add(this.writtenIndex.get(v), 'sound');
    }
    const glossScriptOfQuery = qScript === 'arab' ? 'arab' : 'latn';
    add(this.glossCandidates(glossNorm(q, glossScriptOfQuery), langOf(glossScriptOfQuery)), 'gloss');

    const matches = [...best].map(([ix, match]) => ({
      entry: ix.entry,
      match,
      inherited: branch ? ix.entry.dialect !== branch[0] : false,
    }));
    return this.paginate(this.rank(this.applyOverrides(matches, branch), branch), opts);
  }

  /** Find how to say a meaning (English or Arabic gloss) in one or more dialects, grouped by dialect. */
  express(meaning: string, opts: { dialects: string[]; limit?: number }): (Page<Match> & { dialect: string })[] {
    const script = glossScript(meaning);
    const q = glossNorm(meaning, script);
    const qTokens = tokens(q);
    const lang = langOf(script);
    const concept = this.findConcept(meaning);
    const candidates = new Set([...(concept ? (this.byConcept.get(concept) ?? []) : []), ...this.glossCandidates(q, lang)]);
    return opts.dialects.map((dialect) => {
      const branch = this.branch(dialect);
      const scored: { m: Match; score: number }[] = [];
      for (const ix of candidates) {
        if (!branch.includes(ix.entry.dialect)) continue;
        // An entry linked to the matching core concept is the best answer there is.
        const conceptScore = concept && ix.entry.concept === concept ? 3 : 0;
        const score = Math.max(conceptScore, glossScore(q, qTokens, ix.glosses[lang]));
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
    if (!this.conceptIndex) {
      this.conceptIndex = new Map();
      Object.entries(this.bundle.concepts ?? {}).forEach(([cid, c], order) => {
        for (const g of [c.en, c.ar]) {
          const script = glossScript(g);
          for (const part of splitParts(g, script)) {
            const key = `${script}\u0000${part}`;
            if (!this.conceptIndex!.has(key)) this.conceptIndex!.set(key, { cid, order });
          }
        }
      });
    }
    const hits = (['latn', 'arab'] as const)
      .map((script) => this.conceptIndex!.get(`${script}\u0000${glossNorm(meaning, script)}`))
      .filter((h): h is { cid: string; order: number } => Boolean(h));
    return hits.sort((a, b) => a.order - b.order)[0]?.cid;
  }

  /** For each core concept, how a dialect says it: nearest dialect first, verified first. */
  coreWords(dialect: string): { concept: string; gloss: string; entries: BundledEntry[] }[] {
    const branch = this.branch(dialect);
    const out: { concept: string; gloss: string; entries: BundledEntry[] }[] = [];
    for (const [concept, c] of Object.entries(this.bundle.concepts ?? {})) {
      const matches = (this.byConcept.get(concept) ?? [])
        .filter((ix) => branch.includes(ix.entry.dialect))
        .map((ix) => ({ entry: ix.entry, match: 'exact' as const, inherited: ix.entry.dialect !== dialect }));
      if (matches.length) out.push({ concept, gloss: c.en, entries: this.rank(matches, branch).map((m) => m.entry) });
    }
    return out;
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
      const own = this.byDialect.get(d.id) ?? [];
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

  /** Entries whose gloss (in one meaning) contains every word of the query. */
  private glossCandidates(query: string, lang: Lang): IndexedEntry[] {
    const qTokens = [...new Set(tokens(query))];
    if (qTokens.length === 0) return [];
    const lists = qTokens.map((t) => this.glossTokenIndex[lang].get(t) ?? []);
    const smallest = lists.reduce((a, b) => (b.length < a.length ? b : a));
    return smallest.filter((ix) => glossScore(query, qTokens, ix.glosses[lang]) > 0);
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
        collator.compare(a.entry.id, b.entry.id),
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
