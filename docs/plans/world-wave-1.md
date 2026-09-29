# World wave 1 — plan

**Status:** in progress · **Owner decision (2026-09-29):** pause the Palestinian work; start with the world's most widely spoken dialects, organized by country, based on trusted external sources.

> **بالعربي:** بنبلّش بـ 14 لهجة من أكثر لهجات العالم انتشاراً. الكلمات بتيجي من **ويكاموس** (رخصته نفس رخصتنا)، مفلترة حسب علامات المنطقة، ومرتبة حسب الأكثر استعمالاً. كلها بتدخل كمسودة مع رابط مصدرها، وبتستنى مراجع من أهل اللهجة.

## Dialects

| Country | Dialect | Wiktionary source | Filter |
|---|---|---|---|
| 🇺🇸 us | `en-us-general` | English | tag `US` |
| 🇬🇧 gb | `en-gb` | English | tags `UK`, `British` |
| 🇮🇳 in | `en-in` | English | tags `India`, `Indian-English` |
| 🇲🇽 mx | `es-mx` | Spanish | tag `Mexico` |
| 🇪🇸 es | `es-es` | Spanish | tag `Spain` |
| 🇧🇷 br | `pt-br` | Portuguese | tag `Brazil` |
| 🇫🇷 fr | `fr-fr` | French | tag `France` |
| 🇩🇪 de | `de-de` | German | tag `Germany` |
| 🇹🇷 tr | `tr-tr` | Turkish | all senses, ranked by frequency |
| 🇮🇳 in | `hi-in` | Hindi | all senses, ranked by frequency |
| 🇪🇬 eg | `ar-eg` | Egyptian Arabic | whole file |
| 🇸🇦 sa | `ar-sa` | Gulf, Hijazi, Najdi Arabic | whole files |
| 🇸🇾 sy | `ar-sy` | North Levantine Arabic | tags `Syria`, `Syrian` |
| 🇱🇧 lb | `ar-lb` | North Levantine Arabic | tags `Lebanon`, `Lebanese` |
| 🇲🇦 ma | `ar-ma` | Moroccan Arabic | whole file |

## Pipeline

1. `scripts/import-wiktextract.ts` reads a kaikki.org per-language JSONL in one streaming pass for every dialect that uses it.
   - **Skipped:** proper names, affixes, obsolete, archaic and historical senses, inflected forms, and quotations (only Wiktionary's own usage examples are kept).
2. Words are ranked with FrequencyWords (CC BY-SA 4.0). The top *N* new words per dialect are written as `status: draft`, `source: {kind: dataset, name: wiktionary, ref: <page URL>}`.
3. `.github/workflows/import-wiktionary.yml` runs this on GitHub's runners (kaikki.org is not reachable from the dev container), validates, and pushes an `import/wiktionary-<run>` branch for review.
4. Native reviewers verify entries. Dialects become `active` when they have a reviewer.

## Not reusable (reference only)

MADAR, DODa (CC BY-NC), KeNet (GPL), Hindi WordNet (GFDL), OpenThesaurus (LGPL), and all commercial dictionaries. See `data/sources.yaml`.

## Next

- Dialect guides (common AI mistakes), each citing its sources.
- Recruit native reviewers per dialect.
