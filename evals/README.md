# Evals: does OpenAccent actually help?

> **The deciding test is the blind one in [`blind/`](blind/README.md):** native speakers compare replies without and with the paste-in prompt, without knowing which is which. The automatic scores below use OpenAccent's own word lists, so they can show regressions but can't prove that replies sound like home.

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

## Run it without the API (free)

Use Claude Desktop on your normal plan and let OpenAccent score the replies on your machine:

1. `npm run eval:manual -- --dialect ar-ps-fallahi-kaf` writes `evals/manual/<date>-<dialect>.md`, with the prompts and the steps.
2. Ask Claude each prompt twice: once with the OpenAccent extension off, once with it on. Paste the replies into the file.
3. `npm run eval:manual -- --score evals/manual/<file>.md` prints the report and saves it next to the file.

Mixing is only detected for words the dictionary knows in *another* dialect. With only one dialect filled in, the mixing rate stays at 0% whatever the replies say.

## Run it with the API

- **On GitHub:** Actions → *Eval* → Run workflow. This needs an `ANTHROPIC_API_KEY` repository secret and **costs API money**: 10 prompts × 2 conditions per dialect.
- **Locally:** `npm run eval -- --dialects es-mx`.
- **Preview without API calls:** `npm run eval -- --dry-run`.
- **Re-score saved replies after the data changes:** `npm run eval -- --score evals/results/<file>.json`.
