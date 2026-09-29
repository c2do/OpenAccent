# OpenAccent — Design Document

**Status:** Approved in brainstorming (2026-09-27) · **Scope:** v0.1 → v0.3 · **Owner:** @c2do

> ## ملخص بالعربي
> **OpenAccent** مشروع مفتوح المصدر لقاموس لهجات بيبنيه المجتمع، ومعه ذاكرة شخصية، والاثنين موصولين بـ Claude (أو أي ذكاء اصطناعي) عن طريق MCP.
>
> **الهدف:** الشخص يحس إنه بيحكي مع إنسان حقيقي من بلده، مش مع AI. وهاد لكل الدول واللهجات.
>
> **المشكلة:**
> - الموديلات بتلخبط اللهجات، يعني بتخلط فلاحي بمدني بمصري.
> - كل شوي بتغيّر كلماتها ولهجتها بنص المحادثة.
> - بتحكي مصطلحات نادرة أو مش مفهومة.
> - وما بتتعلم من تصحيحاتك من محادثة للتانية.
>
> **الحل، 4 قطع:**
> 1. **قاموس** بالريبو: كل كلمة ملف، والكلمة ما بتصير "مؤكدة" إلا إذا وافق عليها حدا من أهل اللهجة.
> 2. **دليل لكل لهجة:** لفظها، قواعدها، وأغلاط الموديلات الشائعة فيها.
> 3. **ذاكرة شخصية** على جهازك: لهجتك، كلماتك، تصحيحاتك، وأسلوبك. وتصحيحك بيغلب القاموس.
> 4. **نظام مساهمة:** فورمات GitHub بالعربي والإنجليزي، وبوت بيفحص، ومراجعين لكل لهجة.
>
> **البداية (بالتوازي):**
> - اللهجة الفلسطينية الفلاحية، وإنت المراجع.
> - الإنجليزي الأمريكي العام. Claude بيجهّز المسودة، وبتضل "مسودة" لحد ما نلاقي مراجع أمريكي.
> - أداة `check_reply` بتفحص رد الموديل: في كلمات من لهجة تانية؟ مصطلحات غريبة؟ غيّر كلمة؟
> - الفلاحي: أول مسودة من قاموس "مكنونة" المفتوح ومن اقتراحات Claude، وصاحب المشروع بيأكّد.
> - المشروع بيشتغل أولاً على Claude Desktop، وبعدين على الإنترنت للموبايل.
>
> **الرخص:** الكود MIT، والقاموس CC BY-SA 4.0.

---

## 1. Problem

LLMs are weak at dialects, especially rural and under-represented ones:

- **They mix dialects.** A single reply can blend rural Palestinian (fallahi) with urban Palestinian, Egyptian and Gulf forms.
- **They invent words** and state them confidently.
- **They exaggerate.** Stereotyped slang gets stuffed into every sentence.
- **They drift.** The model switches words and dialect mid-conversation.
- **They use obscure terms.** Rare, dated or overly literary words the user wouldn't say or understand.
- **They don't retain corrections.** A user corrects the model and the same mistake comes back in the next chat.

The result: talking to the model never feels like talking to a real person from your place. That feeling is the product goal, in every country and dialect.

Existing open-source work covers pieces of this: pronunciation trainers, accent classifiers, research corpora. Nothing combines a **verified, community-built dialect dictionary** with **per-user dialect memory**, exposed to AI assistants.

## 2. Goals and non-goals

**Goals**

1. A community-built dictionary that scales to *all world dialects*. Two starting points in parallel:
   - Palestinian **fallahi** Arabic, reviewed by the owner.
   - **General American** English, drafted by Claude and kept `draft` until a native reviewer joins.
2. Trust by construction: nothing is presented as fact unless a native speaker of that dialect verified it.
3. **Contribution is the #1 priority for v0.1.** A non-technical person can add a word in under 3 minutes, and anyone can add a new dialect by following a written guide.
4. Personal memory: the user's dialect, words, corrections and style persist across conversations. Personal corrections override the dictionary for that user.
5. **Consistency and naturalness.** Once the user's dialect is known, the model stays in it (the "dialect lock": the profile dialect is the default for every tool). Every entry carries a `familiarity` level, so rare or dated words are flagged. `openaccent_check_reply` lets the model check a draft reply before sending it.
6. One core, two deployments: a local stdio server first (Claude Desktop), then a remote Streamable-HTTP server (Claude web and mobile).

**Non-goals (for now)**

- Personas or "character" modes. The project describes dialects; it doesn't role-play.
- Audio recordings, speech recognition or accent scoring (see the roadmap).
- Machine translation. The model does the translating; OpenAccent gives it verified vocabulary and rules.
- Our own website and accounts (planned for v0.3).

## 3. Architecture overview

```
                 ┌──────────────────────────── repo: c2do/openaccent ───────────────────────────┐
 contributors ──►│ GitHub Issue Forms ─► issue-to-PR bot ─► PR ─► dialect reviewer ─► merge     │
                 │                                                     │                        │
                 │  data/dialects/*.yaml   data/guides/*.md   data/entries/<dialect>/*.yaml      │
                 │                         │ build (validate + compile)                          │
                 │                         ▼                                                     │
                 │                  dist/dictionary.json  (bundled in the package)               │
                 └─────────────────────────┬────────────────────────────────────────────────────┘
                                           │
                        ┌──────────────────▼──────────────────┐
                        │ OpenAccent core (TypeScript)        │
                        │  dictionary · search · guides       │
                        │  memory store · briefing · links    │
                        └───────┬─────────────────────┬───────┘
                                │                     │
                   v0.1: stdio server        v0.3: Streamable HTTP server
                   (.mcpb, Claude Desktop)   (Claude web/mobile; dictionary public,
                   memory = local JSON file   memory behind lazy OAuth sign-in)
```

## 4. Data model

### 4.1 Dialect tree

Dialects form a tree. Every node is one file, `data/dialects/<id>.yaml`. Entries **inherit down the tree**: a word filed under `ar-ps` (general Palestinian) applies to every Palestinian sub-dialect unless a more specific entry overrides it.

```
ar                      Arabic
└── ar-levantine        Levantine
    └── ar-ps           Palestinian
        ├── ar-ps-fallahi   Rural (fallahi): ق said ك   ← v0.1 focus
        │   ├── ar-ps-fallahi-kaf    keeps ك (كيف)
        │   └── ar-ps-fallahi-tshaf  ك said تش in some words (تشيف)
        ├── ar-ps-madani    Urban (madani)
        ├── ar-ps-khalili   Hebron
        └── ar-ps-gazawi    Gaza

en                      English
└── en-us               American
    ├── en-us-general   General American   ← v0.1 focus (draft until a native reviewer joins)
    ├── en-us-south     Southern
    └── en-us-nyc       New York
```

```yaml
# data/dialects/ar-ps-fallahi.yaml
id: ar-ps-fallahi
parent: ar-ps
name: { en: Palestinian Rural (Fallahi), ar: فلسطيني فلاحي }
region: { en: Rural Palestine (West Bank villages, Galilee), ar: قرى فلسطين }
codes:
  bcp47: apc-PS-x-fallahi   # ISO 639-3 'apc' (Levantine), since 'ajp' was merged into it in 2023
  glottocode: fell1238      # Glottolog "Fellahi", under sout3123 (South Levantine)
reviewers: [c2do]           # GitHub handles; a dialect needs at least one before it is accepted
status: active              # proposed | active
```

**IDs.**

- Our own readable slugs (`ar-ps-fallahi`) are the primary key. Standard codes go in `codes` as metadata.
- Input `ajp` is accepted and mapped to `apc`.
- Every language follows the same pattern, e.g. `en` → `en-gb` → `en-gb-scouse`.
- Each dialect declares its `script` (`arab`, `latn`, …). Search normalization and romanization are chosen per script (§8).

### 4.2 Entry

One word or expression in one dialect is **one file**: `data/entries/<dialect-id>/<slug>.yaml`. One file per entry means community PRs almost never conflict.

```yaml
word: حاكورة
dialect: ar-ps-fallahi
type: word                     # word | phrase | expression | proverb
spellings: [حاكوره]            # alternative spellings
romanized: [7akoura, hakoura]  # other-script input people actually type (Arabizi for Arabic); optional
pronunciation: { simple: "ḥā-kō-ra" }   # optional: ipa
part_of_speech: noun           # optional
meanings:
  - ar: جنينة صغيرة جنب الدار، بتنزرع فيها خضرة وشجر
    en: small garden next to the house
    examples:
      - text: روحي اقطفي شوية نعنع من الحاكورة
        en: Go pick some mint from the garden
register: casual               # casual | neutral | formal | vulgar
familiarity: common            # common (everyone understands) | regional | rare | dated
regions: []                    # optional finer locations
related: [ar-ps-madani/jneineh]   # equivalents in other dialects (entry IDs)
notes: ""
status: draft                  # draft | verified | disputed
verified_by: []                # GitHub handles of native-speaker reviewers
source:
  kind: ai-draft               # ai-draft | contributor | reviewer | dataset
  name: ""                     # dataset name from data/sources.yaml (required when kind is dataset), e.g. maknuune
  ref: ""                      # e.g. Maknuune entry ID
  license: CC-BY-SA-4.0
added_by: ""
```

**Rules**

- Required fields: `word`, `dialect`, `type`, `status`, `source`, and at least one meaning with `ar` or `en`.
- **`word` is the written form**, the way native speakers write it in chat. How it sounds goes in `pronunciation`. Example: fallahi speakers say "تشيف" but write كيف, so `word: كيف`, `pronunciation.simple: تشيف`, and `تشيف` is listed in `spellings` so search still finds it. (Owner review, 2026-09-29.)
- `status: verified` requires at least one handle in `verified_by`, and that handle must be listed in the dialect's `reviewers`. CI enforces this.
- **Tools never present `draft` as fact.** Draft results are labeled "unverified" and ranked below verified ones.
- `familiarity` defaults to `common`. Tools warn when a reply uses `rare` or `dated` words.
- An entry's ID is `<dialect>/<slug>`. The slug is ASCII, derived from the first romanized form (or a transliteration), with `-2`, `-3`… added on collision.

### 4.3 Dialect guide

`data/guides/<dialect-id>.md` is written by native speakers. It has fixed headings so tools can extract sections:

- `## Pronunciation`: e.g. fallahi ك → تش (تشيف حالك), ق → ك (كال).
- `## Grammar & markers`: distinctive forms and function words.
- `## Common AI mistakes`: **this section is the heart of the project.** Examples:
  - fallahi: mixing in Egyptian or urban forms, over-using slang, inventing words.
  - General American: overly formal phrasing, words people rarely say ("delve", "tapestry"), British spellings, forced or dated slang.
- `## Natural usage`: mirror the user's register, and prefer a plain word over an invented dialect word.

A guide inherits from its parent guide, the same way entries do.

### 4.4 Personal memory

Memory is stored as local, human-readable JSON:

- Default path: `~/.openaccent/memory.json`.
- It can be overridden with the `OPENACCENT_MEMORY_PATH` environment variable, or through the `.mcpb` `user_config`.
- Every item has an `id` and a `created_at`.

```json
{
  "version": 1,
  "profile": { "dialect": "ar-ps-fallahi", "region": "", "notes": "" },
  "words":       [{ "id": "w1", "say": "هسّا", "instead_of": "هلأ", "meaning": "now" }],
  "corrections": [{ "id": "c1", "wrong": "كويس", "right": "منيح", "context": "" }],
  "style":       [{ "id": "s1", "text": "Prefers short replies" }]
}
```

**Precedence:** personal memory beats a verified dictionary entry, which beats a draft entry.

**Privacy**

- Memory never leaves the machine in v0.1.
- `openaccent_forget` deletes items.
- Sharing to the public dictionary only happens through an explicit, user-approved link (§6).

## 5. MCP tools (v0.1) — 8 tools

All tools are prefixed `openaccent_`, accept Arabic, English and Arabizi, and return both text and `structuredContent`. Every result ends with a one-line **profile footer** (the user's dialect plus their top corrections), so the model learns who the user is even if it skipped the briefing.

| Tool | Purpose | Annotations |
|---|---|---|
| `openaccent_get_briefing` | Call first. Returns profile, dialect guide (inherited), personal words/corrections/style, in one call. Onboarding hint if no profile yet. | read-only |
| `openaccent_lookup` | Word → entries (meanings, examples, register, status). Searches the dialect tree with inheritance; verified first. | read-only |
| `openaccent_express` | Meaning/concept → how to say it in a dialect (or compare across dialects). | read-only |
| `openaccent_list_dialects` | Dialect tree with entry counts and verified %. | read-only |
| `openaccent_remember` | Save a profile field, word, correction or style note. | write, idempotent-ish |
| `openaccent_forget` | Delete memory items by ID or text match. | destructive |
| `openaccent_check_reply` | Check a draft reply before sending. Flags words from other dialects, `rare`/`dated` words, and words the user corrected or replaced. Returns suggested swaps. | read-only |
| `openaccent_suggest_entry` | Build a pre-filled GitHub issue-form URL (add or fix a word) for the user to open. Only after the user agrees. | read-only (no network) |

### `check_reply` in detail

It works at the word level, from data we already have. It needs no conversation state and no LLM call:

1. Tokenize the reply and look up each token (and 2–3-word phrases) with the normal search keys.
2. Flag a match whose dialect is **outside** the user's dialect branch (neither the dialect nor its ancestors), when the user's branch has an equivalent (via `related` or a shared gloss).
3. Flag `familiarity: rare | dated`.
4. Flag words that appear as `wrong` in personal corrections or `instead_of` in personal words. This is how "don't switch back to the word I replaced" works.

The output is a list of `{ word, reason, suggestion }` plus a one-line verdict. Limits: it cannot judge grammar or tone. The dialect guide covers those.

### Why tools, not server instructions

Research showed two limits in Claude's apps:

- They ignore the MCP `instructions` field.
- Prompts are user-picked only; the model never invokes them.

So we use three layers:

1. `get_briefing`'s name and description say "call at the start of any conversation in a dialect".
2. Every tool result carries the profile footer.
3. The setup guide gives users a one-line personal preference to paste into Claude: *"Use OpenAccent at the start of every conversation."*

Expected reliability is high but not guaranteed, and the docs say so.

## 6. Contribution system

**Issue forms** live in `.github/ISSUE_TEMPLATE/`, bilingual AR/EN:

| Form | Purpose |
|---|---|
| `add-word.yml` | Add a new word |
| `fix-word.yml` | Correct an existing word |
| `new-dialect.yml` | Propose a new dialect |
| `become-reviewer.yml` | Volunteer to review a dialect |

Form rules:

- Fields that should be pre-fillable are `input`/`textarea` only (GitHub can't pre-fill dropdowns or checkboxes).
- Labels are set in the template YAML.
- Each form has a required checkbox agreeing to CC BY-SA 4.0.

**Pipeline**

1. The issue is opened, either directly or through a `suggest_entry` link.
2. The `issue-to-pr` GitHub Action parses the form and validates it: required fields, dialect exists, no duplicate.
   - If something is wrong, it comments on the issue saying what to fix.
   - Otherwise it opens a PR that adds or updates the YAML file, and links the issue.
3. `CODEOWNERS` routes `data/entries/<dialect>/**` to that dialect's reviewers.
4. CI runs the schema validator and tests.
5. A reviewer approves and merges.
   - Merging a contributor entry by a listed reviewer sets `status: verified` with `verified_by: [reviewer]`. The bot does this at merge time.
   - Bulk imports and AI drafts stay `draft` until a reviewer verifies them individually, by editing `status` and `verified_by` in a PR.
6. Nothing lands without review. Branch protection is on `main`.

**New dialect.** The `new-dialect` issue needs a parent, a name and at least one volunteer reviewer who speaks it. It is accepted as `status: proposed` and becomes `active` when it has a reviewer and 20 entries.

**Mobile caveat.** The GitHub mobile app drops pre-filled values. `suggest_entry` output and the docs tell users to open links in a browser. Pre-fill URLs are kept short (Arabic percent-encodes at about 6 bytes per letter, and URL size is limited).

## 7. Initial data (v0.1)

1. **Dialect tree:** `ar`, `ar-levantine`, `ar-ps` and the four Palestinian children. Only `ar-ps-fallahi` is `active`, with reviewer @c2do.
2. **Maknuune import.** Maknuune is an open Palestinian lexicon from CAMeL Lab, NYU Abu Dhabi.
   - The import goes into `ar-ps` as `draft`, `source: {kind: dataset, name: maknuune}`, and must credit the source.
   - Its license (CC BY-SA 4.0) must be **confirmed on the official download page before importing**.
   - The import is a curated subset of ≤2,000 entries: the most common ones, preferring entries with examples. A full import can come later.
3. **Fallahi drafts from Claude:** about 150 fallahi-specific words and phrases, `source.kind: ai-draft`, `draft`.
4. **Owner verification:** @c2do verifies fallahi entries. The v0.2 target is 200 verified.
5. **Fallahi guide:** Claude drafts it, and @c2do reviews it before it's marked verified.
6. **General American (parallel track):**
   - Tree nodes `en`, `en-us` and three children. `en-us-general` is `active` only once it has a native reviewer; until then it is `proposed` but still served, clearly labeled draft.
   - ~150 Claude-drafted entries focused on everyday words and on the `Common AI mistakes` list (e.g. entries for words to avoid, with natural alternatives), plus an `en-us` guide.
   - Recruit a native American reviewer through the `become-reviewer` form and the README.

**Sources**

| | Sources |
|---|---|
| Allowed | Maknuune (CC BY-SA 4.0); Curras (CC BY 4.0, with attribution); Wiktionary / kaikki (CC BY-SA); Tatoeba (CC BY); Glottolog metadata (CC BY) |
| **Blocked** (in `data/sources.yaml`, enforced by review) | MADAR, NADI (research-only); Living Arabic Project (all rights reserved); Qabas (no derivatives); PADIC (GPL, incompatible); DARE (*Dictionary of American Regional English*, copyrighted). Print dictionaries are references only, never copied. |
| To check before use | Harvard Dialect Survey / Cambridge dialect survey data: licenses unconfirmed |

## 8. Search

Normalization is chosen by the dialect's `script`. Every entry is indexed under several keys:

1. **Normalized text.**
   - Latin script: lowercase, strip accents (NFKD), fold US/UK spelling pairs (`-our/-or`, `-ise/-ize`), straight quotes.
   - Arabic script: Strip diacritics (U+064B–U+0652, U+0670) and tatweel; unify إأآٱ→ا, ى→ي, ة→ه, ؤ→و, ئ→ي; convert Arabic-Indic digits to ASCII.
2. **Spoken → written variants** (optional, from the dialect's `sound_rules`, which are `[spoken, written]` pairs). Fallahi: `[تش, ك]` and `[ك, ق]`, so `تشيف` finds `كيف` and `كال` finds `قال`. Each rule applies once per position and is **never chained**, and variants are compared with the written `word` only: `تشال` finds nothing, because the ك that comes from ق is never pronounced تش (owner review, 2026-09-29).
3. **Romanization keys** (Arabic: Arabizi). Digits 2 3 5 6 7 8 9 and the digraphs gh, kh, sh, ch/tsh map to candidate Arabic spellings, which are matched against keys 1 and 2.
4. **English and MSA glosses**, for `express`.

**Ranking:** exact match first, then normalized, then sound-folded, then gloss. Verified entries rank above drafts, and the requested dialect ranks above its ancestors. The normalizer is written in-house with tests, not taken from a third-party library.

## 9. Tech stack

- **TypeScript**, Node 20+, ESM.
  - **MCP TypeScript SDK v2** (`@modelcontextprotocol/server`), with Zod v4 schemas plus `outputSchema`.
  - **Decision (Task 1, 2026-09-29):** SDK v2 (`@modelcontextprotocol/server@2.2.0`, requires Node ≥20). The MCPB docs confirm Node ships with Claude Desktop on macOS and Windows but don't state its version. Claude Desktop is an Electron app, and Electron has bundled Node ≥20 since 2024, so v2 is expected to work (medium confidence). The `.mcpb` manifest declares `compatibility.runtimes.node: ">=20"` so an incompatible install fails clearly; the owner confirms in Task 23.
  - Fallback: if that check fails, pin the v1 SDK (`@modelcontextprotocol/sdk@1.x`). Server code stays isolated in `src/server/` to keep this swap small.
- Data is YAML, validated by the same Zod schemas and compiled by `scripts/build-data.ts` into `dist/dictionary.json`.
- Tests use Vitest. MCP integration tests use an in-memory client/server transport.
- **Distribution**
  - A `.mcpb` bundle, installed by double-clicking in Claude Desktop, published on GitHub Releases.
  - `npx openaccent-mcp` for technical users.
- **CI:** GitHub Actions running validate data, typecheck, test and build on every PR, plus the `issue-to-pr` workflow.
- **Remote (v0.3):** stateless Streamable HTTP. Dictionary tools are public. Memory tools use lazy OAuth (401 + `WWW-Authenticate`), and memory is stored per OAuth subject behind a `MemoryStore` interface that the file store also implements.

## 10. Licensing

- **Code:** MIT (`LICENSE`).
- **Data:** CC BY-SA 4.0 (`data/LICENSE`). This is required to include Maknuune and Wiktionary-derived content.
- Every entry records `source.kind` (plus `source.name` for datasets) and `source.license`. Contributors agree through the issue-form checkbox, and PR authors through a DCO sign-off.

## 11. Testing and success criteria

**Automated**

- Schema validation of all data.
- Unit tests: normalizer, Arabizi, sound folding, inheritance, ranking, memory store (including atomic writes and a corrupt-file recovery path), URL builder.
- MCP integration tests for each tool.

**Behavioural evaluation** (`evals/`)

- 20 fallahi prompts. Claude answers each with and without OpenAccent, and @c2do judges which is more natural and correct.
- 10 General American prompts, same method, judged by a native speaker when one is available.
- Plus 10 Q&A tool-use evaluations in the `mcp-builder` XML format.

**v0.1 is done when**

1. A non-technical tester adds a word via the form in under 3 minutes.
2. A tester adds a new dialect using only `docs/adding-a-dialect.md`.
3. With OpenAccent, Claude uses fallahi forms consistently and retains a correction across two separate chats.
3b. In a 20-turn conversation, Claude doesn't drift out of the user's dialect, and `check_reply` catches planted cross-dialect and `rare` words.
4. CI is green, and the `.mcpb` installs and runs in Claude Desktop.

## 12. Roadmap

| Version | Scope |
|---|---|
| **v0.1** | Data format and validator, issue forms and bot, Maknuune subset import, ~150 fallahi drafts + fallahi guide, ~150 General American drafts + guide, 8-tool stdio server (incl. `check_reply`), file memory, `.mcpb` |
| **v0.2** | 200 verified fallahi entries; first native American reviewer; reviewers for madani, khalili and gazawi; behavioural eval run; tool polish from eval findings |
| **v0.3** | Remote HTTP server for Claude web/mobile; OAuth memory; simple website that files issues for people without GitHub |
| After v0.2 | "Hook" features that make people *want* to use it, chosen from `docs/ideas.md` once the base is proven |
| Later | Consented audio pronunciations; other languages' dialects; `openaccent_verify` flow for reviewers from chat |

## 13. Risks and open questions

| Risk / question | Mitigation |
|---|---|
| Maknuune's download host is unreachable from the build container, and its license is only medium-confidence | The owner downloads the TSV manually and confirms the license on the official page. The import script takes a local path. |
| The model skips tools | Three-layer approach (§5); measured in the eval |
| Draft data seen as truth | `draft` labeling in every result; ranking; the guide's "prefer plain words" rule |
| Few reviewers per dialect | A dialect stays `proposed` until it has a reviewer; recruit through the `become-reviewer` form |
| Claude Desktop's bundled Node version vs SDK v2 (needs Node 20+) | Verify early (plan task 1); v1 SDK fallback |
| No native reviewer for General American yet | Everything stays `draft` and labeled; recruit via README and `become-reviewer` |
| Caricaturing dialects tied to specific communities (e.g. African American English, Southern) | Such dialects are added only with reviewers from that community; guides describe, never mock |
| `check_reply` false positives (a word shared by many dialects) | Only flag when the user's branch has an equivalent; show reasons, never auto-rewrite |
| Pre-filled links on phones | "Open in browser" hint; keep URLs short |
