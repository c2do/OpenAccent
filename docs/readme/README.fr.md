# OpenAccent

[English](../../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · **Français** · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md)

> 🤖 Cette traduction a été rédigée par une IA. Si le français est ta langue, aide-nous à l’améliorer — c’est exactement le genre de chose que ce projet veut corriger.

**Parle à l’IA comme tu parlerais à quelqu’un de chez toi.**

OpenAccent est un dictionnaire open source des dialectes du monde, organisé par pays, construit par la communauté et vérifié par des locuteurs natifs. Il garde aussi une mémoire personnelle de ta façon de parler. Les deux sont servis aux assistants IA comme Claude via [MCP](https://modelcontextprotocol.io).

> **Statut : début de développement.** Le serveur MCP fonctionne en local, et les 14 premiers dialectes se remplissent à partir de sources ouvertes. Pas encore de version à installer.

## Le problème

Les modèles d’IA sont mauvais avec les dialectes :

- Ils **mélangent les dialectes** dans une même réponse.
- Ils **dérivent**, changeant de mots et de dialecte en pleine conversation.
- Ils **inventent des mots** ou utilisent des termes rares que personne ne dit.
- Ils **oublient tes corrections** à la conversation suivante.

On n’a jamais l’impression de parler à une vraie personne de chez soi.

## Comment OpenAccent règle ça

| Élément | Rôle |
|---|---|
| 📖 **Dictionnaire** | Un dossier par pays et par dialecte, un fichier par mot. Chaque mot cite sa source, et rien n’est *vérifié* tant qu’un locuteur natif ne l’a pas approuvé. |
| 🧭 **Guides de dialecte** | Comment chaque dialecte sonne et fonctionne, et les erreurs que l’IA y fait souvent. |
| 🧠 **Mémoire personnelle** | Ton dialecte, tes mots, tes corrections. Elle reste sur ta machine, et tes corrections l’emportent sur le dictionnaire. |
| 🔍 **Vérification des réponses** | Signale les mots du mauvais dialecte, les mots rares, les mots écrits comme ils se prononcent et ceux que tu as déjà corrigés. |

## Première vague : 14 dialectes

🇺🇸 · 🇬🇧 · 🇮🇳 · 🇲🇽 · 🇪🇸 · 🇧🇷 · 🇫🇷 · 🇩🇪 · 🇹🇷 · 🇮🇳 · 🇪🇬 · 🇸🇦 · 🇸🇾 · 🇱🇧 · 🇲🇦

Anglais américain · britannique · indien · espagnol du Mexique · d’Espagne · portugais du Brésil · français de France · allemand d’Allemagne · turc · hindi · arabe égyptien · saoudien · syrien · libanais · darija marocaine

Les mots viennent du [Wiktionnaire](https://en.wiktionary.org) (CC BY-SA 4.0), filtrés par région et classés par fréquence. Chaque mot importé reste un **brouillon** jusqu’à ce qu’un locuteur natif le relise.

## Contribuer

Pas besoin de coder.

- **Tu parles un de ces dialectes ?** Nous avons surtout besoin de **relecteurs**. Ouvre une issue et dis-nous lequel.
- **Tu veux ajouter un mot ou un dialecte ?** Des formulaires simples arrivent. En attendant, vois [`data/README.md`](../../data/README.md).
- **Tu peux améliorer cette traduction ?** Avec plaisir !

## Licence

- **Code :** [MIT](../../LICENSE)
- **Données du dictionnaire** (`data/`) : [CC BY-SA 4.0](../../data/LICENSE), la même licence que Wikipédia. Les données resteront ouvertes pour toujours.
