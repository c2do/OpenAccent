<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Sprich mit der KI so, wie du mit jemandem von zu Hause sprechen würdest.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/dialects-14%20in%20wave%201-4338CA" alt="14 dialects in wave 1">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <b>Deutsch</b> · <a href="README.hi.md">हिन्दी</a> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 Diese Übersetzung wurde von einer KI entworfen. Wenn Deutsch deine Sprache ist, hilf uns, sie zu verbessern – genau so etwas will dieses Projekt beheben.

OpenAccent ist ein Open-Source-Wörterbuch der Dialekte der Welt, nach Ländern geordnet, von der Community aufgebaut und von Muttersprachlern geprüft. Dazu kommt ein persönliches Gedächtnis dafür, wie *du* sprichst. Beides steht KI-Assistenten wie Claude über [MCP](https://modelcontextprotocol.io) zur Verfügung.

> **Status: frühe Entwicklung.** Der MCP-Server läuft lokal, und die ersten 14 Dialekte werden aus offenen Quellen gefüllt. Noch keine installierbare Version.

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
| 🔍 **Antwort-Check** | Markiert Wörter aus dem falschen Dialekt, seltene Wörter, Wörter, die so geschrieben sind, wie man sie spricht, und Wörter, die du schon korrigiert hast. |

## Erste Welle: 14 Dialekte

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Amerikanisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>britisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>indisches Englisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>mexikanisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>spanisches Spanisch</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>brasilianisches Portugiesisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>Französisch (Frankreich)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>Deutsch (Deutschland)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>Türkisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hindi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>ägyptisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saudisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>syrisches</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanesisches Arabisch</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>marokkanisches Darija</b></td></tr>
</table>

Die Wörter stammen aus dem [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), nach Region gefiltert und nach Häufigkeit sortiert. Jedes importierte Wort ist ein **Entwurf**, bis ein Muttersprachler es prüft.

## Mitmachen

Programmieren ist nicht nötig.

- **Du sprichst einen dieser Dialekte?** Am dringendsten brauchen wir **Prüfer**. Eröffne ein Issue und sag uns, welchen.
- **Du willst ein Wort oder einen Dialekt hinzufügen?** Einfache Formulare kommen bald. Bis dahin: [`data/README.md`](../../data/README.md).
- **Du kannst diese Übersetzung verbessern?** Sehr gern!

## Lizenz

- **Code:** [MIT](../../LICENSE)
- **Wörterbuchdaten** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), dieselbe Lizenz wie Wikipedia. Die Daten bleiben für immer offen.
