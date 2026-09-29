# OpenAccent

**English** · [العربية](docs/readme/README.ar.md) · [Español](docs/readme/README.es.md) · [Português](docs/readme/README.pt-BR.md) · [Français](docs/readme/README.fr.md) · [Deutsch](docs/readme/README.de.md) · [हिन्दी](docs/readme/README.hi.md) · [Türkçe](docs/readme/README.tr.md)

**Talk to AI like you'd talk to someone from home.**

OpenAccent is an open-source, community-built dictionary of the world's dialects, organized by country and verified by native speakers. It also keeps a personal memory of how *you* speak. Both are served to AI assistants like Claude through [MCP](https://modelcontextprotocol.io).

> **Status: early development.** The MCP server works locally, and the first 14 dialects are being filled from open sources. There is no installable release yet.

## The problem

AI models are bad at dialects:

- They **mix dialects** in one reply.
- They **drift**, switching words and dialect mid-conversation.
- They **invent words**, or use rare terms nobody says.
- They **forget your corrections** by the next chat.

It never feels like talking to a real person from your place.

## How OpenAccent fixes it

| Piece | What it does |
|---|---|
| 📖 **Dictionary** | One folder per country and one per dialect, one file per word. Every word cites its source, and nothing is marked *verified* until a native speaker approves it. |
| 🧭 **Dialect guides** | How each dialect sounds and works, and the mistakes AI models commonly make in it. |
| 🧠 **Personal memory** | Your dialect, your words, your corrections. It stays on your machine, and your corrections beat the dictionary. |
| 🔍 **Reply check** | Flags words from the wrong dialect, rare words, words written the way they sound, and words you've corrected before. |

## First wave: 14 dialects

🇺🇸 General American · 🇬🇧 British · 🇮🇳 Indian English · 🇲🇽 Mexican Spanish · 🇪🇸 Spanish (Spain) · 🇧🇷 Brazilian Portuguese · 🇫🇷 French (France) · 🇩🇪 German (Germany) · 🇹🇷 Turkish · 🇮🇳 Hindi · 🇪🇬 Egyptian Arabic · 🇸🇦 Saudi Arabic · 🇸🇾 Syrian Arabic · 🇱🇧 Lebanese Arabic · 🇲🇦 Moroccan Darija

Words come from [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), filtered by region and ranked by how common they are. Every imported word starts as a **draft** until a native speaker reviews it.

## Contribute

You don't need to code.

- **Native speaker of one of these dialects?** We need **reviewers** most of all. Open an issue and tell us which dialect you speak.
- **Want to add a word or a dialect?** Easy forms are coming. For now, see [`data/README.md`](data/README.md).
- **Can you improve a translation of this page?** Please do. They were drafted by AI, which is exactly the kind of thing this project exists to fix.

More detail: [`docs/design.md`](docs/design.md) · [`docs/plans/world-wave-1.md`](docs/plans/world-wave-1.md)

## License

- **Code:** [MIT](LICENSE)
- **Dictionary data** (`data/`): [CC BY-SA 4.0](data/LICENSE), the same license as Wikipedia. The data stays open forever.
- Country names and languages come from [Unicode CLDR](https://github.com/unicode-org/cldr-json). Word data comes from Wiktionary contributors, via [wiktextract](https://github.com/tatuylonen/wiktextract) / [kaikki.org](https://kaikki.org).
