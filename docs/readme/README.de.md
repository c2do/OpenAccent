# OpenAccent

[English](../../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · **Deutsch** · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md)

> 🤖 Diese Übersetzung wurde von einer KI entworfen. Wenn Deutsch deine Sprache ist, hilf uns, sie zu verbessern – genau so etwas will dieses Projekt beheben.

**Sprich mit der KI so, wie du mit jemandem von zu Hause sprechen würdest.**

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

🇺🇸 · 🇬🇧 · 🇮🇳 · 🇲🇽 · 🇪🇸 · 🇧🇷 · 🇫🇷 · 🇩🇪 · 🇹🇷 · 🇮🇳 · 🇪🇬 · 🇸🇦 · 🇸🇾 · 🇱🇧 · 🇲🇦

Amerikanisches · britisches · indisches Englisch · mexikanisches · spanisches Spanisch · brasilianisches Portugiesisch · Französisch (Frankreich) · Deutsch (Deutschland) · Türkisch · Hindi · ägyptisches · saudisches · syrisches · libanesisches Arabisch · marokkanisches Darija

Die Wörter stammen aus dem [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), nach Region gefiltert und nach Häufigkeit sortiert. Jedes importierte Wort ist ein **Entwurf**, bis ein Muttersprachler es prüft.

## Mitmachen

Programmieren ist nicht nötig.

- **Du sprichst einen dieser Dialekte?** Am dringendsten brauchen wir **Prüfer**. Eröffne ein Issue und sag uns, welchen.
- **Du willst ein Wort oder einen Dialekt hinzufügen?** Einfache Formulare kommen bald. Bis dahin: [`data/README.md`](../../data/README.md).
- **Du kannst diese Übersetzung verbessern?** Sehr gern!

## Lizenz

- **Code:** [MIT](../../LICENSE)
- **Wörterbuchdaten** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), dieselbe Lizenz wie Wikipedia. Die Daten bleiben für immer offen.
