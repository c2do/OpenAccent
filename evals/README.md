# Evals: does OpenAccent actually help?

Every prompt in `prompts/<dialect>.yaml` is sent to Claude twice:

- **baseline:** no system prompt.
- **openaccent:** the OpenAccent briefing for a user of that dialect.

Each reply gets an **automatic word-level score**:

| Score | Better when |
|---|---|
| Mixing rate: replies containing words from another dialect | Lower |
| Words written the way they sound | Fewer |
| Core-word rate: replies using the dialect's own everyday words | Higher |

All replies are saved in the report so **native speakers can judge** tone and grammar, which the automatic score cannot.

## Run it

- **On GitHub:** Actions → *Eval* → Run workflow. This needs an `ANTHROPIC_API_KEY` repository secret and **costs API money**: 10 prompts × 2 conditions per dialect.
- **Locally:** `npm run eval -- --dialects es-mx`.
- **Preview without API calls:** `npm run eval -- --dry-run`.
- **Re-score saved replies after the data changes:** `npm run eval -- --score evals/results/<file>.json`.
