# Attestation: how OpenAccent decides that sources agree

Few entries are reviewed by native speakers yet. Until they are, an entry's confidence comes from open
datasets that confirm it (`attested_by`). This makes attestation one of OpenAccent's strongest features,
and one of its biggest risks: a loose check makes wrong words look trustworthy. This page explains the rules.

## Confidence

| Level | Needs |
|---|---|
| verified | a native-speaker reviewer approved the entry |
| high | two or more **independent** sources: the entry's own dataset plus attestations that count |
| medium | one source, or a contributor |
| low | an AI draft, or disputed |

Computed in `src/core/confidence.ts`; the dictionary build precomputes each entry's independent sources.

## Independence groups

Two datasets are two witnesses only if neither was built from the other. Every allowed dataset in
`data/sources.yaml` has an `independence_group`; datasets in one group count once. For example, Birzeit's
Curras, Lisan, Nabra and Baladi share annotation guidelines and annotators, so they are one group
(`birzeit-currasat`). A new dataset gets its own group only if it was built without copying another one
(say so in its `note`).

## The evidence ledger

Every attestation says how it was made:

```yaml
attested_by:
  - name: flores
    ref: https://github.com/facebookresearch/flores
    method: parallel-corpus
    method_version: 2
    support: 7          # sentence pairs with the word and its meaning
    occurrences: 9      # sentence pairs with the word
    precision: 0.778    # support / occurrences
    lift: 41.3          # how much likelier the meaning is next to the word than anywhere
    run_id: "36769686596"
    source_revision: "flores200_dataset.tar.gz sha256:…"
```

The validator rejects an attestation without `method` and `method_version`.

`ATTESTATION_METHODS` in `src/core/confidence.ts` lists each method's current version and the oldest
version that still counts. If a version turns out to be too loose, raise its `counts`: every attestation it
made stops counting at once, and the next run of the method recomputes them. Nobody has to work out which
entries were confirmed by which logic.

| Method | Script | Version | What it checks |
|---|---|---|---|
| dictionary-match | `scripts/attest.ts` | 1 | another dictionary lists the same normalized word with a shared whole gloss part |
| parallel-corpus | `scripts/attest-corpus.ts` | 1 (retired) | the word and its meaning co-occur in 2+ sentence pairs |
| parallel-corpus | `scripts/attest-corpus.ts` | 2 | the checks below |

## parallel-corpus v2

Co-occurrence alone confirms wrong pairings. Take a sentence with "ولد" and "بيت" translated "the boy is in
the house": after a few such sentences, v1 would confirm ولد = house. v2 needs all three of these:

- **support ≥ 2**: at least two sentence pairs where the dialect side has the word (clitics removed too) and
  the English side has one of its meanings as a whole word.
- **precision**: support / occurrences, judged by its Wilson lower bound (80%, one-sided), so "2 of 2" is not
  treated as certain. It must be at least `THRESHOLDS.minPrecision`.
- **lift**: precision divided by the share of *all* English sentences that carry the meaning. A meaning that
  is in most translations anyway ("go", "be") confirms nothing. It must be at least `THRESHOLDS.minLift`.

Each run recomputes the corpus's attestations: new passes are added, old ones are updated, and ones that no
longer pass (including every v1 attestation) are removed. A dialect the corpus has no sentences for (a
failed download, say) is left alone.

### Checking the thresholds

The workflow writes `reports/attestation/corpora-<run>.tsv`, with one line per entry the corpus has anything
to say about. Each line has the numbers, the decision (added, kept, removed, none) and one supporting
sentence pair. To check the thresholds, take a random sample of passing and failing lines, judge each by
hand (is the word really used with this meaning in the sentence?), and record the result below. Change the
thresholds only with a new sample.

