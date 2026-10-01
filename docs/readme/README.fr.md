<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Parle à l’IA comme tu parlerais à quelqu’un de chez toi.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <b>Français</b> · <a href="README.de.md">Deutsch</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 Cette traduction a été rédigée par une IA. Si le français est ta langue, aide-nous à l’améliorer — c’est exactement le genre de chose que ce projet veut corriger.

OpenAccent est un dictionnaire open source des dialectes du monde, organisé par pays, construit par la communauté. Il part de sources ouvertes et de brouillons d’IA, que des locuteurs natifs relisent mot par mot : pour l’instant, seuls quelques mots sont vérifiés, et chaque réponse indique son degré de confiance. Il garde aussi une mémoire personnelle de ta façon de parler. Les deux sont servis aux assistants IA comme Claude via [MCP](https://modelcontextprotocol.io).

> **Statut : début de développement.** Tout tourne en local, sur ton ordinateur. Nous commençons par les dialectes arabes les plus parlés, remplis à partir de sources ouvertes, en attente de relecture par des locuteurs natifs. Installation : [`docs/setup.md`](../../docs/setup.md).

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
| 🗣️ **Apprend ta façon de parler** | Tu parles plusieurs dialectes ? Tu mélanges avec l’anglais ? Tu écris court, ou en arabizi ? OpenAccent le repère dans tes propres messages (des comptages seulement, jamais les messages) et demande à l’IA de s’adapter à toi. |
| 🔍 **Vérification des réponses** | Signale les mots du mauvais dialecte, les mots rares, les mots écrits comme ils se prononcent et ceux que tu as déjà corrigés. |
| 🎭 **Fiches de dialecte** | Pour les histoires, les chansons, les scénarios et les dialogues de jeux : fais parler des personnages de n’importe quel dialecte, avec des règles pour chaque type d’écriture. |
| 📋 **Prompt portable** | Un court texte pour les instructions personnalisées de n’importe quelle IA (Claude, ChatGPT, …), généré sur ta machine : `openaccent-mcp export <dialect>`. |

## Au-delà du chat : histoires, chansons, scénarios et jeux

C’est le dialecte qui rend un personnage vivant. OpenAccent donne à n’importe quelle IA qui écrit les mots, les sons et les règles d’un dialecte, puis vérifie chaque réplique.

| Écrire… | Ce que fait OpenAccent |
|---|---|
| 📚 **Histoires et romans** | Une grand-mère du Caire et son petit-fils de Casablanca peuvent partager une scène, chacun dans son dialecte : chaque personnage a sa fiche de dialecte, et chaque réplique est vérifiée selon le dialecte de ce personnage. Les mots anciens ou rares sont permis quand l’histoire les demande. |
| 🎵 **Paroles de chansons** | Des mots de tous les jours que les gens chantent vraiment, dans un seul dialecte cohérent. Les mots rares ou vieillis passent quand ils vont avec la chanson. |
| 🎬 **Scénarios de films, séries et podcasts** | Des répliques écrites comme les acteurs doivent les dire (*تشيف* fallahi pour كيف). Les personnages peuvent jurer si la scène le demande ; les insultes discriminatoires sont toujours signalées. |
| 🎮 **Dialogues de jeux vidéo** | Des PNJ qui sonnent comme venant d’un endroit précis, et qui le restent sur des centaines de répliques. |

Essaie de demander à Claude, avec OpenAccent installé :

- *« Écris une courte scène : un chauffeur de taxi irakien se dispute avec un touriste libanais à propos du prix de la course. Garde chacun dans son dialecte. »*
- *« Écris un refrain pour une chanson de mariage marocaine. »*
- *« Réécris ce dialogue pour que les personnages sonnent égyptiens, et pas arabe standard moderne. »*

### Idées à construire dessus

OpenAccent est un serveur MCP, une CLI et un jeu de données ouvert (CC BY-SA), donc tu peux construire par-dessus :

- Un assistant d’écriture de paroles ou de scénarios qui garde chaque personnage dans son dialecte.
- Un outil de dialogues de jeu qui vérifie des milliers de répliques de PNJ pour repérer les mélanges de dialectes.
- Contrôle qualité des sous-titres et du doublage : passe `check_reply` sur un script pour attraper les répliques dans le mauvais dialecte.
- Un chatbot pour un commerce local qui parle comme les gens de sa ville.
- Une appli d’apprentissage des langues qui enseigne le dialecte que les gens parlent vraiment.

**Développeurs, bonnes premières contributions :** un normaliseur de texte pour une nouvelle langue, des prompts d’évaluation pour ton dialecte, un importeur pour un autre jeu de données sous licence ouverte, ou un plugin d’éditeur autour de la CLI. Voir [`docs/design.md`](../../docs/design.md).

## Dialectes

**L’arabe d’abord.** Nous commençons par les dialectes arabes les plus parlés :

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Égyptien</b><br><sub>Égypte</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Levantin</b><br><sub>Syrie · Liban · Jordanie · Palestine</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Saoudien et du Golfe</b><br><sub>Arabie saoudite · le Golfe</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>Irakien</b><br><sub>Irak</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>Soudanais</b><br><sub>Soudan</sub></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Darija marocaine</b><br><sub>Maroc</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>Darja algérienne</b><br><sub>Algérie</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>Derja tunisienne</b><br><sub>Tunisie</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Libanais</b><br><sub>Liban</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>Jordanien</b><br><sub>Jordanie</sub></td></tr>
</table>

**Aussi commencés :** l’espagnol du Mexique, l’espagnol d’Espagne, le français et le turc ont des mots en brouillon. L’anglais américain, britannique et indien, l’allemand, le portugais du Brésil et le hindi sont en place et attendent de meilleures sources.

<details>
<summary>La première vague mondiale (14 dialectes)</summary>

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Anglais américain</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>britannique</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>indien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>espagnol du Mexique</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>d’Espagne</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>portugais du Brésil</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>français de France</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>allemand d’Allemagne</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>turc</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>hindi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>arabe égyptien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saoudien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>syrien</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanais</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>darija marocaine</b></td></tr>
</table>

</details>

Les mots viennent du [Wiktionnaire](https://en.wiktionary.org) (CC BY-SA 4.0), filtrés par région et classés par fréquence. Chaque mot importé reste un **brouillon** jusqu’à ce qu’un locuteur natif le relise.

## Contribuer

Pas besoin de coder.

- **Tu parles un de ces dialectes ?** Nous avons surtout besoin de **relecteurs**. Ouvre une issue et dis-nous lequel. Chaque dialecte a un petit guide (comment il sonne, les erreurs que l’IA y fait) rédigé comme brouillon, qui attend quelqu’un qui a grandi en le parlant.
- **Tu veux ajouter un mot ou un dialecte ?** Des formulaires simples arrivent. En attendant, vois [`data/README.md`](../../data/README.md).
- **Tu peux améliorer cette traduction ?** Avec plaisir ! Elle a été rédigée par une IA, et c’est exactement le genre de chose que ce projet existe pour corriger.

## Licence

- **Code :** [MIT](../../LICENSE)
- **Données du dictionnaire** (`data/`) : [CC BY-SA 4.0](../../data/LICENSE), la même licence que Wikipédia. Les données resteront ouvertes pour toujours.
