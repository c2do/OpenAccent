<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Fale com a IA como você falaria com alguém da sua terra.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <b>Português</b> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 Esta tradução foi rascunhada por uma IA. Se o português é a sua língua, ajude a melhorá-la — é exatamente o tipo de coisa que este projeto quer consertar.

OpenAccent é um dicionário de código aberto dos dialetos do mundo, organizado por país, construído pela comunidade e verificado por falantes nativos. Ele também guarda uma memória pessoal de como *você* fala. Os dois chegam a assistentes de IA como o Claude via [MCP](https://modelcontextprotocol.io).

> **Status: desenvolvimento inicial.** Tudo roda localmente, no seu computador. Estamos começando pelos dialetos árabes mais falados, preenchidos com fontes abertas e revisados por falantes nativos. Instalação: [`docs/setup.md`](../../docs/setup.md).

## O problema

Modelos de IA são ruins com dialetos:

- **Misturam dialetos** na mesma resposta.
- **Mudam** de palavras e de dialeto no meio da conversa.
- **Inventam palavras** ou usam termos raros que ninguém fala.
- **Esquecem suas correções** na conversa seguinte.

Nunca parece uma conversa com uma pessoa de verdade da sua terra.

## Como o OpenAccent resolve

| Parte | O que faz |
|---|---|
| 📖 **Dicionário** | Uma pasta por país e por dialeto, um arquivo por palavra. Cada palavra cita a fonte, e nada é marcado como *verificado* até um falante nativo aprovar. |
| 🧭 **Guias de dialeto** | Como cada dialeto soa e funciona, e os erros que a IA costuma cometer nele. |
| 🧠 **Memória pessoal** | Seu dialeto, suas palavras, suas correções. Fica no seu computador, e suas correções valem mais que o dicionário. |
| 🗣️ **Aprende como você fala** | Fala mais de um dialeto? Mistura com inglês? Escreve curto, ou em arabizi? O OpenAccent aprende com as suas próprias mensagens (só contagens, nunca as mensagens) e pede para a IA acompanhar você. |
| 🔍 **Checagem de resposta** | Aponta palavras do dialeto errado, palavras raras, palavras escritas como se pronunciam e palavras que você já corrigiu. |

## Além do chat: histórias, músicas, roteiros e jogos

O dialeto é o que faz um personagem parecer real. O OpenAccent dá a qualquer IA que escreve as palavras, os sons e as regras de um dialeto, e depois confere cada fala.

| Escreva… | O que o OpenAccent faz |
|---|---|
| 📚 **Contos e romances** | Uma avó do Cairo e o neto de Casablanca podem dividir uma cena, cada um no seu dialeto: cada personagem ganha um cartão de dialeto, e cada fala é conferida com o dialeto daquele personagem. Palavras antigas ou raras são permitidas quando a história pede. |
| 🎵 **Letras de música** | Palavras do dia a dia que as pessoas cantam de verdade, num dialeto só e consistente. Palavras raras e antiquadas tudo bem, quando combinam com a música. |
| 🎬 **Roteiros de cinema, TV e podcast** | Falas escritas do jeito que os atores devem dizê-las (*تشيف* fallahi para كيف). Os personagens podem xingar se a cena pedir; ofensas preconceituosas são sempre sinalizadas. |
| 🎮 **Diálogos de jogos** | NPCs que soam como se viessem de um lugar específico, e continuam assim por centenas de falas. |

Experimente pedir ao Claude, com o OpenAccent instalado:

- *"Escreva uma cena curta: um taxista iraquiano discute com um turista libanês sobre o preço da corrida. Mantenha cada um no seu dialeto."*
- *"Escreva um refrão para uma música de casamento marroquina."*
- *"Reescreva este diálogo para os personagens soarem egípcios, e não como árabe padrão moderno."*

### Ideias para construir em cima

O OpenAccent é um servidor MCP, uma CLI e um conjunto de dados aberto (CC BY-SA), então dá para construir em cima dele:

- Um assistente de letras ou de roteiro que mantém cada personagem no seu dialeto.
- Uma ferramenta de diálogos de jogos que confere milhares de falas de NPC procurando mistura de dialetos.
- Controle de qualidade de legendas e dublagem: rode `check_reply` num roteiro para pegar falas no dialeto errado.
- Um chatbot para o comércio local que fala como as pessoas daquela cidade.
- Um app de idiomas que ensina o dialeto que as pessoas falam de verdade.

**Devs, boas primeiras contribuições:** um normalizador de texto para um idioma novo, prompts de avaliação para o seu dialeto, um importador para outro conjunto de dados com licença aberta, ou um plugin de editor em volta da CLI. Veja [`docs/design.md`](../../docs/design.md).

## Dialetos

**Árabe primeiro.** Estamos começando pelos dialetos árabes mais falados:

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Egípcio</b><br><sub>Egito</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Levantino</b><br><sub>Síria · Líbano · Jordânia · Palestina</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Saudita e do Golfo</b><br><sub>Arábia Saudita · o Golfo</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>Iraquiano</b><br><sub>Iraque</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>Sudanês</b><br><sub>Sudão</sub></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Darija marroquino</b><br><sub>Marrocos</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>Darja argelino</b><br><sub>Argélia</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>Derja tunisiano</b><br><sub>Tunísia</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Libanês</b><br><sub>Líbano</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>Jordaniano</b><br><sub>Jordânia</sub></td></tr>
</table>

**Também começados:** espanhol do México, espanhol da Espanha, francês e turco já têm palavras em rascunho. Inglês americano, britânico e indiano, alemão, português do Brasil e híndi estão configurados e esperando fontes melhores.

<details>
<summary>A primeira leva mundial (14 dialetos)</summary>

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Inglês americano</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>britânico</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>indiano</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>espanhol do México</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>da Espanha</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>português do Brasil</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>francês da França</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>alemão da Alemanha</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>turco</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>híndi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>árabe egípcio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saudita</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>sírio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanês</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>darija marroquino</b></td></tr>
</table>

</details>

As palavras vêm do [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), filtradas por região e ordenadas por frequência. Toda palavra importada começa como **rascunho** até um falante nativo revisar.

## Contribua

Não precisa programar.

- **Fala um desses dialetos?** O que mais precisamos são **revisores**. Abra uma issue e conte qual você fala. Cada dialeto tem um guia curto (como soa, os erros que a IA comete nele) escrito como rascunho, esperando alguém que cresceu falando esse dialeto.
- **Quer adicionar uma palavra ou um dialeto?** Formulários simples vêm aí. Por enquanto, veja [`data/README.md`](../../data/README.md).
- **Consegue melhorar esta tradução?** Por favor!

## Licença

- **Código:** [MIT](../../LICENSE)
- **Dados do dicionário** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), a mesma licença da Wikipédia. Os dados ficam abertos para sempre.
