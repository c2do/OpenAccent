<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Sprich mit der KI so, wie du mit jemandem von zu Hause sprechen würdest.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <b>Deutsch</b> · <a href="README.hi.md">हिन्दी</a> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 Diese Übersetzung wurde von einer KI entworfen. Wenn Deutsch deine Sprache ist, hilf uns, sie zu verbessern – genau so etwas will dieses Projekt beheben.

OpenAccent ist ein Open-Source-Wörterbuch der Dialekte der Welt, nach Ländern geordnet, von der Community aufgebaut. Es beginnt mit offenen Quellen und KI-Entwürfen, und Muttersprachler prüfen es Wort für Wort: Bisher sind erst wenige Wörter geprüft, und jede Antwort sagt, wie sicher sie ist. Dazu kommt ein persönliches Gedächtnis dafür, wie *du* sprichst. Beides steht KI-Assistenten wie Claude über [MCP](https://modelcontextprotocol.io) zur Verfügung.

> **Status: frühe Entwicklung.** Alles läuft lokal auf deinem Rechner. Wir fangen mit den meistgesprochenen arabischen Dialekten an, gefüllt aus offenen Quellen, die noch auf die Prüfung durch Muttersprachler warten. Installation: [`docs/setup.md`](../../docs/setup.md).

## Das Problem

KI-Modelle sind schlecht bei Dialekten:

- Sie **mischen Dialekte** in einer Antwort.
- Sie **driften**, wechseln mitten im Gespräch Wörter und Dialekt.
- Sie **erfinden Wörter** oder nutzen seltene Begriffe, die niemand sagt.
- Sie **vergessen deine Korrekturen** im nächsten Chat.

Es fühlt sich nie an wie ein Gespräch mit einem echten Menschen von daheim.

## Wie OpenAccent das löst

| Baustein | Was er tut |
|---|---|
| 📖 **Wörterbuch** | Ein Ordner pro Land und pro Dialekt, eine Datei pro Wort. Jedes Wort nennt seine Quelle, und nichts gilt als *geprüft*, bevor ein Muttersprachler zustimmt. |
| 🧭 **Dialekt-Leitfäden** | Wie jeder Dialekt klingt und funktioniert – und welche Fehler KI darin typischerweise macht. |
| 🧠 **Persönliches Gedächtnis** | Dein Dialekt, deine Wörter, deine Korrekturen. Es bleibt auf deinem Rechner, und deine Korrekturen haben Vorrang vor dem Wörterbuch. |
| 🗣️ **Lernt, wie du sprichst** | Du sprichst mehr als einen Dialekt? Mischst Englisch hinein? Schreibst kurz oder in Arabizi? OpenAccent erkennt das an deinen eigenen Nachrichten (nur Zählungen, nie die Nachrichten selbst) und sagt der KI, sich dir anzupassen. |
| 🔍 **Antwort-Check** | Markiert Wörter aus dem falschen Dialekt, seltene Wörter, Wörter, die so geschrieben sind, wie man sie spricht, und Wörter, die du schon korrigiert hast. |
| 🎭 **Dialektkarten** | Für Geschichten, Songs, Drehbücher und Spieldialoge: Gib Figuren aus jedem Dialekt eine Stimme, mit Regeln für jede Textart. |
| 📋 **Mitnehm-Prompt** | Ein kurzer Text für die benutzerdefinierten Anweisungen jeder KI (Claude, ChatGPT, …), erzeugt auf deinem Rechner: `openaccent-mcp export <dialect>`. |

## Mehr als Chat: Geschichten, Songs, Drehbücher und Spiele

Erst der Dialekt macht eine Figur echt. OpenAccent gibt jeder schreibenden KI die Wörter, Laute und Regeln eines Dialekts und prüft dann jede Zeile.

| Du schreibst… | Was OpenAccent tut |
|---|---|
| 📚 **Geschichten und Romane** | Eine Großmutter aus Kairo und ihr Enkel aus Casablanca können sich eine Szene teilen, jeder in seinem Dialekt: Jede Figur bekommt eine Dialektkarte, und jede Zeile wird am Dialekt dieser Figur geprüft. Alte oder seltene Wörter sind erlaubt, wenn eine Geschichte sie braucht. |
| 🎵 **Songtexte** | Alltagswörter, die Leute wirklich singen, in einem einheitlichen Dialekt. Seltene und altmodische Wörter sind in Ordnung, wenn sie zum Song passen. |
| 🎬 **Film-, Serien- und Podcast-Skripte** | Zeilen so geschrieben, wie Schauspieler sie sprechen sollen (fallahi *تشيف* für كيف). Figuren dürfen fluchen, wenn die Szene es verlangt; herabwürdigende Beschimpfungen werden immer markiert. |
| 🎮 **Spieldialoge** | NPCs, die klingen, als kämen sie von einem bestimmten Ort – und das über Hunderte Zeilen hinweg. |

Frag Claude mit installiertem OpenAccent zum Beispiel:

- *„Schreib eine kurze Szene: Ein irakischer Taxifahrer streitet mit einem libanesischen Touristen über den Fahrpreis. Lass jeden in seinem eigenen Dialekt sprechen.“*
- *„Schreib einen Refrain für ein marokkanisches Hochzeitslied.“*
- *„Schreib diesen Dialog so um, dass die Figuren ägyptisch klingen und nicht nach modernem Hocharabisch.“*

### Ideen, die darauf aufbauen

OpenAccent ist ein MCP-Server, eine CLI und ein offener Datensatz (CC BY-SA) – du kannst also darauf aufbauen:

- Ein Assistent für Songtexte oder Drehbücher, der jede Figur in ihrem Dialekt hält.
- Ein Tool für Spieldialoge, das Tausende NPC-Zeilen auf Dialektmischung prüft.
- Qualitätskontrolle für Untertitel und Synchronisation: Lass `check_reply` über ein Skript laufen, um Zeilen im falschen Dialekt zu finden.
- Ein Chatbot für lokale Geschäfte, der redet wie die Leute in dieser Stadt.
- Eine Sprachlern-App, die den Dialekt beibringt, den die Leute wirklich sprechen.

**Entwickler, gute erste Beiträge:** ein Textnormalisierer für eine neue Sprache, Eval-Prompts für deinen Dialekt, ein Importer für einen weiteren offen lizenzierten Datensatz oder ein Editor-Plugin rund um die CLI. Siehe [`docs/design.md`](../../docs/design.md).

## Dialekte

**Arabisch zuerst.** Wir fangen mit den meistgesprochenen arabischen Dialekten an:

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Ägyptisch</b><br><sub>Ägypten</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Levantinisch</b><br><sub>Syrien · Libanon · Jordanien · Palästina</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Saudisch und Golf</b><br><sub>Saudi-Arabien · Golfstaaten</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>Irakisch</b><br><sub>Irak</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>Sudanesisch</b><br><sub>Sudan</sub></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Marokkanisches Darija</b><br><sub>Marokko</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>Algerisches Darja</b><br><sub>Algerien</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>Tunesisches Derja</b><br><sub>Tunesien</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Libanesisch</b><br><sub>Libanon</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>Jordanisch</b><br><sub>Jordanien</sub></td></tr>
</table>

**Ebenfalls begonnen:** Mexikanisches Spanisch, Spanisch (Spanien), Französisch und Türkisch haben Wortentwürfe. Amerikanisches, britisches und indisches Englisch, Deutsch, brasilianisches Portugiesisch und Hindi sind eingerichtet und warten auf bessere Quellen.

<details>
<summary>Die erste weltweite Welle (14 Dialekte)</summary>

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Amerikanisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>britisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>indisches Englisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>mexikanisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>spanisches Spanisch</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>brasilianisches Portugiesisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>Französisch (Frankreich)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>Deutsch (Deutschland)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>Türkisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hindi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>ägyptisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saudisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>syrisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanesisches Arabisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>marokkanisches Darija</b></td></tr>
</table>

</details>

Die Wörter stammen aus dem [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), nach Region gefiltert und nach Häufigkeit sortiert. Jedes importierte Wort ist ein **Entwurf**, bis ein Muttersprachler es prüft.

## Mitmachen

Programmieren ist nicht nötig.

- **Du sprichst einen dieser Dialekte?** Am dringendsten brauchen wir **Prüfer**. Eröffne ein Issue und sag uns, welchen. Jeder Dialekt hat einen kurzen Leitfaden (wie er klingt, welche Fehler KI darin macht), als Entwurf geschrieben, der auf jemanden wartet, der mit diesem Dialekt aufgewachsen ist.
- **Du willst ein Wort oder einen Dialekt hinzufügen?** Einfache Formulare kommen bald. Bis dahin: [`data/README.md`](../../data/README.md).
- **Du kannst diese Übersetzung verbessern?** Sehr gern! Sie wurde von einer KI entworfen – genau die Art von Sache, die dieses Projekt beheben will.

## Lizenz

- **Code:** [MIT](../../LICENSE)
- **Wörterbuchdaten** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), dieselbe Lizenz wie Wikipedia. Die Daten bleiben für immer offen.
