# Launch kit

Drafts for announcing OpenAccent. **Post nothing until the blind test (`evals/blind/`) has a result**, and put that result, good or bad, in every post. Parts in `[brackets]` are filled in from the test.

## Before posting (checklist)

- [ ] Blind test for Levantine done, with 2 judges, and `report.md` published.
- [ ] One before/after screenshot from the test: the same question, without and with the prompt.
- [ ] Release `v0.1.0` tagged; `NPM_TOKEN` secret added so `npx openaccent-mcp` works.
- [ ] The Google Form below created, and its link added to `docs/prompts` (replacing or next to the GitHub links).
- [ ] Repository description, topics and Discussions set (below).

## Repository settings (GitHub → Settings / About)

- **Description:** `Make AI talk like people from your place: a community dialect dictionary, paste-in prompts and an MCP server. Arabic first.`
- **Topics:** `arabic`, `arabic-dialects`, `dialects`, `nlp`, `mcp`, `model-context-protocol`, `claude`, `chatgpt`, `prompt`, `open-data`
- **Website:** `https://github.com/c2do/OpenAccent/tree/main/docs/prompts`
- Turn on **Discussions** (for "how do you say X where you live?" threads).

## Google Form (for people without a GitHub account)

Title: **صحّح الذكاء الاصطناعي بلهجتك / Fix the AI in your dialect**

1. بأي لهجة كبرت؟ (مدينة أو منطقة) *(required, short answer)*
2. هاي 5 ردود كتبها ذكاء اصطناعي بلهجتك. لكل رد: «بقولها هيك» / «بفهمها بس ما بقولها» / «بتشبه لهجة ثانية» / «ما بنحكيها أبداً» *(grid; paste 5 replies from the blind test)*
3. كيف كنت رح تكتب الرد الأخير بلهجتك؟ *(paragraph)*
4. في كلمة بتحب الذكاء الاصطناعي يعرفها عن لهجتك؟ اكتبها ومعناها ومثال. *(paragraph)*
5. بتقبل ننشر مساهمتك برخصة CC BY-SA 4.0 (متل ويكيبيديا)؟ *(required checkbox)*
6. بدك نذكر اسمك كمساهم؟ إذا آه، شو الاسم؟ *(optional)*

Once a week, export the answers and turn them into issues or data files.

## Arabic post (Facebook / WhatsApp groups, X)

> الذكاء الاصطناعي بيفهم لهجتنا، بس لما يرد بيحكي فصحى أو بيخلط شامي بمصري.
>
> عملنا **OpenAccent**: مشروع مفتوح ومجاني بيخلّي ChatGPT وClaude وGemini يحكوا مثل الناس من بلدك. ما في إشي تنزّله: بتنسخ نص لهجتك وبتلصقه بالإعدادات.
>
> جرّبناه مع ناس من [البلد] بدون ما يعرفوا مين مين: فضّلوا الردود مع النص بـ [X%] من المرات. [صورة قبل/بعد]
>
> هلأ بدنا مساعدتكم: **كيف بتقولوا «[كلمة]» عندكم؟** واللي بيحب يجرّب ويقلّنا وين غلط:
> [رابط docs/prompts] · [رابط الفورم]
>
> كل كلمة لسا مسودة لحد ما حدا من أهل اللهجة يراجعها، فأي تصحيح بيفرق.

## English post (X / LinkedIn / Mastodon)

> AI models understand Arabic dialects but reply in Modern Standard Arabic, or mix Egyptian into Levantine. Research calls it dialect "hesitancy" (AL-QASIDA, 2025).
>
> OpenAccent is an open, community dialect dictionary that turns into a paste-in prompt for any AI app, plus an MCP server for Claude. In a blind test, native speakers preferred replies with the prompt [X%] of the time. [before/after image]
>
> Arabic first. Native speakers wanted as reviewers: [repo link]

## Show HN (only with test results)

**Title:** `Show HN: OpenAccent – make LLMs reply in your Arabic dialect instead of MSA`

> LLMs understand Arabic dialects well but tend to answer in Modern Standard Arabic or a blend of dialects. Papers in 2025–26 (AL-QASIDA, ArabCulture-Dialogue) describe this as hesitancy rather than inability, and find that a few in-dialect examples help.
>
> OpenAccent is a CC BY-SA dictionary organized by country and dialect. It generates a short paste-in prompt per dialect (markers, words to avoid, an example, verified words only) and runs as a local MCP server with a reply checker and a personal memory of how you talk.
>
> What we measured: [blind test setup and result, link to raw pairs]. What we don't know yet: [limits].
>
> Everything starts as a draft until a native speaker reviews it; confidence comes from independent open datasets agreeing, with an evidence ledger per word. Feedback from Arabic speakers is the most useful thing you can give us.

## r/learn_arabic

**Title:** `I made free prompts that keep ChatGPT/Claude in one Arabic dialect (no MSA drift). Looking for testers`

> If you practise Levantine or Egyptian with an AI, you've probably seen it slide back into MSA or mix dialects. These are free copy-paste instructions per dialect: [link]. They're drafts, so if you're a native speaker, corrections are very welcome.

## Email to Birzeit SinaLab (or another Arabic NLP lab)

> Subject: OpenAccent: an open (CC BY-SA) dialect dictionary for LLMs, and two small questions
>
> Dear SinaLab team,
>
> I'm building OpenAccent, an open dialect dictionary that helps LLMs reply in a user's own Arabic dialect instead of MSA (repository: [link]). Your Curras, Lisan, Nabra and Baladi corpora are listed as sources we'd like to use.
>
> Two questions: (1) could you confirm the license of Lisan? We have seen both CC BY 4.0 and CC BY-NC-SA mentioned. (2) Would two of your students be interested in reviewing 110 core words of one dialect? Reviewers are credited by name in the dataset.
>
> Thank you,
> [name]
