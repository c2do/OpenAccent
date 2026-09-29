# OpenAccent dictionary data

[العربية ⬇](#بالعربي)

```
data/
├── countries/                  one folder per country or territory (ISO 3166-1, from Unicode CLDR)
│   └── eg/                     Egypt
│       ├── country.yaml        name, population, main languages
│       └── ar-eg/              one folder per dialect spoken there
│           ├── dialect.yaml    what the dialect is, its parent, reviewers
│           ├── guide.md        how it sounds and works, and the mistakes AI makes in it
│           └── entries/        the dictionary: one file per word or expression
├── languages/                  shared, cross-border levels (ar, ar-levantine, en, es, ...)
├── sources.yaml                datasets we may (or may not) use
└── LICENSE                     CC BY-SA 4.0
```

- **Find your dialect:** open `countries/<your country code>/`.
- **Inheritance:** a dialect's `parent` can live elsewhere (e.g. `countries/ps/ar-ps` → `languages/ar-levantine`). Words filed at a parent apply to all its children.
- **Adding a dialect:** create `countries/<cc>/<dialect-id>/dialect.yaml`. The folder name must equal the `id`.
- Country names and language shares come from [Unicode CLDR](https://github.com/unicode-org/cldr-json) (Unicode License v3).

<div dir="rtl">

## بالعربي

- **كل دولة إلها مجلد** جوّا `countries/`، واسمه رمز الدولة (مثلاً `eg` لمصر، `ps` لفلسطين).
- **جوّا مجلد الدولة**، في مجلد لكل لهجة، فيه كل إشي عنها: معلوماتها (`dialect.yaml`)، الدليل (`guide.md`)، والقاموس (`entries/`).
- **المشترك بين دول** (العربي، الشامي، الإنجليزي...) موجود بـ `languages/`.
- **الكلمة المكتوبة بمستوى أعلى** (مثلاً "شامي") بتنطبق على كل اللهجات اللي تحته.

</div>
