<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Fale com a IA como você falaria com alguém da sua terra.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/dialects-14%20in%20wave%201-4338CA" alt="14 dialects in wave 1">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  <a href="../../README.md"><img src="https://img.shields.io/badge/English-64748B?style=for-the-badge" alt="English"></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-64748B?style=for-the-badge" alt="العربية"></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/Espa%C3%B1ol-64748B?style=for-the-badge" alt="Español"></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/Portugu%C3%AAs-4338CA?style=for-the-badge" alt="Português"></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/Fran%C3%A7ais-64748B?style=for-the-badge" alt="Français"></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/Deutsch-64748B?style=for-the-badge" alt="Deutsch"></a>
  <a href="README.hi.md"><img src="https://img.shields.io/badge/%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-64748B?style=for-the-badge" alt="हिन्दी"></a>
  <a href="README.tr.md"><img src="https://img.shields.io/badge/T%C3%BCrk%C3%A7e-64748B?style=for-the-badge" alt="Türkçe"></a>
</p>

> 🤖 Esta tradução foi rascunhada por uma IA. Se o português é a sua língua, ajude a melhorá-la — é exatamente o tipo de coisa que este projeto quer consertar.

OpenAccent é um dicionário de código aberto dos dialetos do mundo, organizado por país, construído pela comunidade e verificado por falantes nativos. Ele também guarda uma memória pessoal de como *você* fala. Os dois chegam a assistentes de IA como o Claude via [MCP](https://modelcontextprotocol.io).

> **Status: desenvolvimento inicial.** O servidor MCP funciona localmente, e os primeiros 14 dialetos estão sendo preenchidos com fontes abertas. Ainda não há versão para instalar.

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
| 🔍 **Checagem de resposta** | Aponta palavras do dialeto errado, palavras raras, palavras escritas como se pronunciam e palavras que você já corrigiu. |

## Primeira leva: 14 dialetos

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Inglês americano</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>britânico</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>indiano</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>espanhol do México</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>da Espanha</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>português do Brasil</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>francês da França</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>alemão da Alemanha</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>turco</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>híndi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>árabe egípcio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saudita</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>sírio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanês</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>darija marroquino</b></td></tr>
</table>

As palavras vêm do [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), filtradas por região e ordenadas por frequência. Toda palavra importada começa como **rascunho** até um falante nativo revisar.

## Contribua

Não precisa programar.

- **Fala um desses dialetos?** O que mais precisamos são **revisores**. Abra uma issue e conte qual você fala.
- **Quer adicionar uma palavra ou um dialeto?** Formulários simples vêm aí. Por enquanto, veja [`data/README.md`](../../data/README.md).
- **Consegue melhorar esta tradução?** Por favor!

## Licença

- **Código:** [MIT](../../LICENSE)
- **Dados do dicionário** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), a mesma licença da Wikipédia. Os dados ficam abertos para sempre.
