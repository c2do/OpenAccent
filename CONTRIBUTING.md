# Contributing to OpenAccent

<div dir="rtl">

**بالعربي باختصار:** أهم مساهمة هي إنك تعرف لهجتك. ما بدك تكون مبرمج.
- جرّبت النص الجاهز لهجتك ([docs/prompts](docs/prompts/README.md))؟ [احكيلنا إذا صار يحكي مثل أهلك](https://github.com/c2do/OpenAccent/issues/new?template=feedback.yml).
- بتعرف كلمة؟ [ضيفها](https://github.com/c2do/OpenAccent/issues/new?template=add-word.yml). شفت غلط؟ [صحّحه](https://github.com/c2do/OpenAccent/issues/new?template=fix-word.yml).
- كبرت وإنت بتحكي لهجة؟ [صير مراجع إلها](https://github.com/c2do/OpenAccent/issues/new?template=reviewer.yml).

</div>

The most valuable thing you can bring is your dialect, not code.

## Ways to help, most needed first

1. **Review your dialect.** If you grew up speaking it, [become a reviewer](https://github.com/c2do/OpenAccent/issues/new?template=reviewer.yml). Reviewers are listed in the dialect's `dialect.yaml` and are the only people who can mark words `verified`. Nothing is marked verified automatically.
2. **Try the prompt and tell us.** Copy your dialect's prompt from [`docs/prompts`](docs/prompts/README.md) into ChatGPT, Claude or Gemini, then [tell us](https://github.com/c2do/OpenAccent/issues/new?template=feedback.yml) whether it sounded like people from your place, and which words it got wrong.
3. **Add or fix words** with the [add](https://github.com/c2do/OpenAccent/issues/new?template=add-word.yml) and [fix](https://github.com/c2do/OpenAccent/issues/new?template=fix-word.yml) forms. A GitHub account is all you need; maintainers turn issues into data files.
4. **Write real examples.** A short exchange the way people actually text (3 to 6 lines) teaches a model more than a word list. Open an issue with it, or add a sample file (see `data/countries/ps/ar-ps-fallahi-kaf/samples/`).

## Rules for data

- **Licenses.** Data is CC BY-SA 4.0, code is MIT. Only use sources listed as `allowed` in [`data/sources.yaml`](data/sources.yaml); never copy from a dictionary or dataset that isn't, even "just a few words". Contributions are shared under the same licenses.
- **Write words the way people type them** in chat, not how a textbook would spell them.
- **Say where you're from.** Dialects vary by city and village. Every form asks which dialect you grew up speaking, so reviewers know whose ear a word comes from.
- **Mark sensitive meanings.** Vulgar, sexual, offensive or slur senses stay in the dictionary (language is language) but must carry a `sensitive` label so models never use them unprompted.
- **AI drafts are welcome, labelled as drafts.** Set `source.kind: ai-draft`. They never count as evidence (see [docs/attestation.md](docs/attestation.md)).

## Code

```bash
npm ci
npm test            # unit, data and end-to-end tests
npm run validate    # data schema, licenses, sensitive labels
npm run audit       # data quality report
npm run build:prompts  # regenerate docs/prompts after data changes
```

Keep pull requests small and focused, and add a test for every bug you fix. `tests/data/check-native.test.ts` holds ordinary sentences that `check_reply` must never flag: when someone reports a false flag, add their sentence there.

## Conduct

Be kind: people here are sharing the way their families talk. See the [Code of Conduct](CODE_OF_CONDUCT.md).
