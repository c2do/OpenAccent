<p align="center">
  <img src="docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Talk to AI like you'd talk to someone from home.</b></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <b>English</b> · <a href="docs/readme/README.ar.md">العربية</a> · <a href="docs/readme/README.es.md">Español</a> · <a href="docs/readme/README.pt-BR.md">Português</a> · <a href="docs/readme/README.fr.md">Français</a> · <a href="docs/readme/README.de.md">Deutsch</a> · <a href="docs/readme/README.hi.md">हिन्दी</a> · <a href="docs/readme/README.tr.md">Türkçe</a>
</p>

OpenAccent is an open-source, community-built dictionary of the world's dialects, organized by country. It starts from open sources and AI drafts, and native speakers review it word by word: today only a handful of words are verified, and every answer says how sure it is. It also keeps a personal memory of how *you* speak. Both are served to AI assistants like Claude through [MCP](https://modelcontextprotocol.io).

> **Status: early development.** Everything runs locally on your computer. We're starting with the most widely spoken Arabic dialects, filled from open sources and waiting for native speakers to review them. Install: [`docs/setup.md`](docs/setup.md).

**Try it in 30 seconds, no install:** copy your dialect's prompt from [`docs/prompts`](docs/prompts/README.md) into ChatGPT, Claude or Gemini.

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
| 🗣️ **Learns how you speak** | Speak more than one dialect? Mix in English? Write short, or in Arabizi? OpenAccent picks it up from your own messages (counts only, never the messages) and tells the AI to match you. |
| 🔍 **Reply check** | Flags words from the wrong dialect, rare words, words written the way they sound, and words you've corrected before. |
| 🎭 **Dialect cards** | For stories, songs, scripts and game dialogue: voice characters from any dialect, with rules for each kind of writing. |
| 📋 **Portable prompt** | A short text for any AI's custom instructions (Claude, ChatGPT, …), generated on your machine: `openaccent-mcp export <dialect>`. |

## Beyond chat: stories, songs, scripts and games

Dialect is what makes a character feel real. OpenAccent gives any AI writer the words, sounds and rules of a dialect, then checks every line.

| Write… | What OpenAccent does |
|---|---|
| 📚 **Stories and novels** | A grandmother from Cairo and her grandson from Casablanca can share a scene, each in their own dialect: every character gets a dialect card, and each line is checked against that character's dialect. Old or rare words are allowed when a story wants them. |
| 🎵 **Song lyrics** | Everyday words people actually sing, in one consistent dialect. Rare and old-fashioned words are fine when they fit the song. |
| 🎬 **Film, TV and podcast scripts** | Lines spelled the way actors should say them (fallahi *تشيف* for كيف). Characters can swear if the scene calls for it; slurs are always flagged. |
| 🎮 **Game dialogue** | NPCs that sound like they come from somewhere specific, and stay that way across hundreds of lines. |

Try asking Claude with OpenAccent installed:

- *"Write a short scene: an Iraqi taxi driver argues with a Lebanese tourist about the fare. Keep each in their own dialect."*
- *"Write a chorus for a Moroccan wedding song."*
- *"Rewrite this dialogue so the characters sound Egyptian, not Modern Standard Arabic."*

### Ideas to build on it

OpenAccent is an MCP server, a CLI and an open dataset (CC BY-SA), so you can build on top of it:

- A lyrics or screenwriting assistant that keeps every character in their dialect.
- A game-dialogue tool that checks thousands of NPC lines for dialect mixing.
- Subtitles and dubbing QA: run `check_reply` over a script to catch lines in the wrong dialect.
- A local-business chatbot that talks like people in that city.
- A language-learning app that teaches the dialect people actually speak.

**Developers, good first contributions:** a text normalizer for a new language, eval prompts for your dialect, an importer for another openly licensed dataset, or an editor plugin around the CLI. See [`docs/design.md`](docs/design.md).

## Dialects

**Arabic first.** We're starting with the most widely spoken Arabic dialects:

<table>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Egyptian</b><br><sub>Egypt</sub></td><td align="center" width="20%"><img src="docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Levantine</b><br><sub>Syria · Lebanon · Jordan · Palestine</sub></td><td align="center" width="20%"><img src="docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Saudi and Gulf</b><br><sub>Saudi Arabia · the Gulf</sub></td><td align="center" width="20%"><img src="docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>Iraqi</b><br><sub>Iraq</sub></td><td align="center" width="20%"><img src="docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>Sudanese</b><br><sub>Sudan</sub></td></tr>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Moroccan Darija</b><br><sub>Morocco</sub></td><td align="center" width="20%"><img src="docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>Algerian Darja</b><br><sub>Algeria</sub></td><td align="center" width="20%"><img src="docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>Tunisian Derja</b><br><sub>Tunisia</sub></td><td align="center" width="20%"><img src="docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Lebanese</b><br><sub>Lebanon</sub></td><td align="center" width="20%"><img src="docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>Jordanian</b><br><sub>Jordan</sub></td></tr>
</table>

**Also started:** Mexican Spanish, Spanish (Spain), French and Turkish have draft words. General American, British and Indian English, German, Brazilian Portuguese and Hindi are set up and waiting for better sources.

<details>
<summary>The first world wave (14 dialects)</summary>


<table>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/us.svg" width="44" alt="United States"><br><b>General American</b><br><sub>United States</sub></td><td align="center" width="20%"><img src="docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>British English</b><br><sub>United Kingdom</sub></td><td align="center" width="20%"><img src="docs/assets/flags/in.svg" width="44" alt="India"><br><b>Indian English</b><br><sub>India</sub></td><td align="center" width="20%"><img src="docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>Mexican Spanish</b><br><sub>Mexico</sub></td><td align="center" width="20%"><img src="docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>Spanish (Spain)</b><br><sub>Spain</sub></td></tr>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>Brazilian Portuguese</b><br><sub>Brazil</sub></td><td align="center" width="20%"><img src="docs/assets/flags/fr.svg" width="44" alt="France"><br><b>French (France)</b><br><sub>France</sub></td><td align="center" width="20%"><img src="docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>German (Germany)</b><br><sub>Germany</sub></td><td align="center" width="20%"><img src="docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>Turkish</b><br><sub>Turkey</sub></td><td align="center" width="20%"><img src="docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hindi</b><br><sub>India</sub></td></tr>
  <tr><td align="center" width="20%"><img src="docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Egyptian Arabic</b><br><sub>Egypt</sub></td><td align="center" width="20%"><img src="docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Saudi Arabic</b><br><sub>Saudi Arabia</sub></td><td align="center" width="20%"><img src="docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Syrian Arabic</b><br><sub>Syria</sub></td><td align="center" width="20%"><img src="docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Lebanese Arabic</b><br><sub>Lebanon</sub></td><td align="center" width="20%"><img src="docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Moroccan Darija</b><br><sub>Morocco</sub></td></tr>
</table>

</details>

Words come from [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), filtered by region and ranked by how common they are. Every imported word starts as a **draft** until a native speaker reviews it.

## Contribute

You don't need to code.

- **Native speaker of one of these dialects?** We need **reviewers** most of all: [become one](https://github.com/c2do/OpenAccent/issues/new?template=reviewer.yml). Every dialect has a short guide (how it sounds, the mistakes AI makes in it) written as a draft and waiting for someone who grew up speaking it.
- **Tried the prompt?** [Tell us](https://github.com/c2do/OpenAccent/issues/new?template=feedback.yml) whether it sounded like people from your place.
- **Know a word, or spotted a mistake?** [Add a word](https://github.com/c2do/OpenAccent/issues/new?template=add-word.yml) or [fix one](https://github.com/c2do/OpenAccent/issues/new?template=fix-word.yml). Just a form, no code.
- **Can you improve a translation of this page?** Please do. They were drafted by AI, which is exactly the kind of thing this project exists to fix.

How to contribute: [`CONTRIBUTING.md`](CONTRIBUTING.md) · More detail: [`docs/design.md`](docs/design.md) · [`docs/plans/world-wave-1.md`](docs/plans/world-wave-1.md)

## License

- **Code:** [MIT](LICENSE)
- **Dictionary data** (`data/`): [CC BY-SA 4.0](data/LICENSE), the same license as Wikipedia. The data stays open forever.
- Country names and languages come from [Unicode CLDR](https://github.com/unicode-org/cldr-json). Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT). Word data comes from Wiktionary contributors, via [wiktextract](https://github.com/tatuylonen/wiktextract) / [kaikki.org](https://kaikki.org).
