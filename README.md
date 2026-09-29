<p align="center">
  <img src="docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Talk to AI like you'd talk to someone from home.</b></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/dialects-14%20in%20wave%201-4338CA" alt="14 dialects in wave 1">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <b>English</b> · <a href="docs/readme/README.ar.md">العربية</a> · <a href="docs/readme/README.es.md">Español</a> · <a href="docs/readme/README.pt-BR.md">Português</a> · <a href="docs/readme/README.fr.md">Français</a> · <a href="docs/readme/README.de.md">Deutsch</a> · <a href="docs/readme/README.hi.md">हिन्दी</a> · <a href="docs/readme/README.tr.md">Türkçe</a>
</p>

OpenAccent is an open-source, community-built dictionary of the world's dialects, organized by country and verified by native speakers. It also keeps a personal memory of how *you* speak. Both are served to AI assistants like Claude through [MCP](https://modelcontextprotocol.io).

> **Status: early development.** Everything runs locally on your computer. The first 14 dialects are being filled from open sources. Install: [`docs/setup.md`](docs/setup.md).

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
| 🎭 **Dialect cards** | For stories, songs, scripts and game dialogue: voice characters from any dialect, with rules for each kind of writing. |
| 📋 **Portable prompt** | A short text for any AI's custom instructions (Claude, ChatGPT, …), generated on your machine: `openaccent-mcp export <dialect>`. |

## First wave: 14 dialects

<table>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/us.svg" width="44" alt="United States"><br><b>General American</b><br><sub>United States</sub></td><td align="center" width="20%"><img src="docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>British English</b><br><sub>United Kingdom</sub></td><td align="center" width="20%"><img src="docs/assets/flags/in.svg" width="44" alt="India"><br><b>Indian English</b><br><sub>India</sub></td><td align="center" width="20%"><img src="docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>Mexican Spanish</b><br><sub>Mexico</sub></td><td align="center" width="20%"><img src="docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>Spanish (Spain)</b><br><sub>Spain</sub></td></tr>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>Brazilian Portuguese</b><br><sub>Brazil</sub></td><td align="center" width="20%"><img src="docs/assets/flags/fr.svg" width="44" alt="France"><br><b>French (France)</b><br><sub>France</sub></td><td align="center" width="20%"><img src="docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>German (Germany)</b><br><sub>Germany</sub></td><td align="center" width="20%"><img src="docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>Turkish</b><br><sub>Turkey</sub></td><td align="center" width="20%"><img src="docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hindi</b><br><sub>India</sub></td></tr>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Egyptian Arabic</b><br><sub>Egypt</sub></td><td align="center" width="20%"><img src="docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Saudi Arabic</b><br><sub>Saudi Arabia</sub></td><td align="center" width="20%"><img src="docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Syrian Arabic</b><br><sub>Syria</sub></td><td align="center" width="20%"><img src="docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Lebanese Arabic</b><br><sub>Lebanon</sub></td><td align="center" width="20%"><img src="docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Moroccan Darija</b><br><sub>Morocco</sub></td></tr>
</table>

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
- Country names and languages come from [Unicode CLDR](https://github.com/unicode-org/cldr-json). Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT). Word data comes from Wiktionary contributors, via [wiktextract](https://github.com/tatuylonen/wiktextract) / [kaikki.org](https://kaikki.org).
