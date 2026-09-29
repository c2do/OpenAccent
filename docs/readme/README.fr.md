<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Parle à l’IA comme tu parlerais à quelqu’un de chez toi.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/dialects-14%20in%20wave%201-4338CA" alt="14 dialects in wave 1">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <b>Français</b> · <a href="README.de.md">Deutsch</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 Cette traduction a été rédigée par une IA. Si le français est ta langue, aide-nous à l’améliorer — c’est exactement le genre de chose que ce projet veut corriger.

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

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Anglais américain</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>britannique</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>indien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>espagnol du Mexique</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>d’Espagne</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>portugais du Brésil</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>français de France</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>allemand d’Allemagne</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>turc</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>hindi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>arabe égyptien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saoudien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>syrien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanais</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>darija marocaine</b></td></tr>
</table>

Les mots viennent du [Wiktionnaire](https://en.wiktionary.org) (CC BY-SA 4.0), filtrés par région et classés par fréquence. Chaque mot importé reste un **brouillon** jusqu’à ce qu’un locuteur natif le relise.

## Contribuer

Pas besoin de coder.

- **Tu parles un de ces dialectes ?** Nous avons surtout besoin de **relecteurs**. Ouvre une issue et dis-nous lequel.
- **Tu veux ajouter un mot ou un dialecte ?** Des formulaires simples arrivent. En attendant, vois [`data/README.md`](../../data/README.md).
- **Tu peux améliorer cette traduction ?** Avec plaisir !

## Licence

- **Code :** [MIT](../../LICENSE)
- **Données du dictionnaire** (`data/`) : [CC BY-SA 4.0](../../data/LICENSE), la même licence que Wikipédia. Les données resteront ouvertes pour toujours.
