<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Habla con la IA como hablarías con alguien de tu tierra.</b></p>

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
  <a href="README.es.md"><img src="https://img.shields.io/badge/Espa%C3%B1ol-4338CA?style=for-the-badge" alt="Español"></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/Portugu%C3%AAs-64748B?style=for-the-badge" alt="Português"></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/Fran%C3%A7ais-64748B?style=for-the-badge" alt="Français"></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/Deutsch-64748B?style=for-the-badge" alt="Deutsch"></a>
  <a href="README.hi.md"><img src="https://img.shields.io/badge/%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-64748B?style=for-the-badge" alt="हिन्दी"></a>
  <a href="README.tr.md"><img src="https://img.shields.io/badge/T%C3%BCrk%C3%A7e-64748B?style=for-the-badge" alt="Türkçe"></a>
</p>

> 🤖 Esta traducción la redactó una IA. Si el español es tu lengua, ayúdanos a mejorarla: es justo el tipo de cosa que este proyecto quiere arreglar.

OpenAccent es un diccionario de código abierto de los dialectos del mundo, organizado por país, construido por la comunidad y verificado por hablantes nativos. También guarda una memoria personal de cómo hablas *tú*. Ambos llegan a asistentes de IA como Claude a través de [MCP](https://modelcontextprotocol.io).

> **Estado: desarrollo temprano.** El servidor MCP funciona en local y los primeros 14 dialectos se están llenando con fuentes abiertas. Todavía no hay versión para instalar.

## El problema

Los modelos de IA son malos con los dialectos:

- **Mezclan dialectos** en una misma respuesta.
- **Cambian** de palabras y de dialecto a mitad de la conversación.
- **Inventan palabras** o usan términos raros que nadie dice.
- **Olvidan tus correcciones** en el siguiente chat.

Nunca se siente como hablar con una persona real de tu tierra.

## Cómo lo resuelve OpenAccent

| Pieza | Qué hace |
|---|---|
| 📖 **Diccionario** | Una carpeta por país y por dialecto, un archivo por palabra. Cada palabra cita su fuente, y nada se marca como *verificado* hasta que lo apruebe un hablante nativo. |
| 🧭 **Guías de dialecto** | Cómo suena y funciona cada dialecto, y los errores que la IA suele cometer en él. |
| 🧠 **Memoria personal** | Tu dialecto, tus palabras, tus correcciones. Se queda en tu equipo, y tus correcciones mandan sobre el diccionario. |
| 🔍 **Revisión de respuestas** | Señala palabras del dialecto equivocado, palabras raras, palabras escritas como se pronuncian y palabras que ya corregiste. |

## Primera ola: 14 dialectos

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Inglés estadounidense</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>británico</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>de la India</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>español de México</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>de España</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>portugués de Brasil</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>francés de Francia</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>alemán de Alemania</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>turco</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>hindi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>árabe egipcio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saudí</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>sirio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanés</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>darija marroquí</b></td></tr>
</table>

Las palabras vienen de [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), filtradas por región y ordenadas por frecuencia. Cada palabra importada empieza como **borrador** hasta que la revise un hablante nativo.

## Contribuye

No hace falta programar.

- **¿Hablas uno de estos dialectos?** Lo que más necesitamos son **revisores**. Abre un issue y dinos cuál hablas.
- **¿Quieres añadir una palabra o un dialecto?** Pronto habrá formularios sencillos. Por ahora, mira [`data/README.md`](../../data/README.md).
- **¿Puedes mejorar esta traducción?** ¡Por favor!

## Licencia

- **Código:** [MIT](../../LICENSE)
- **Datos del diccionario** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), la misma licencia que Wikipedia. Los datos serán abiertos para siempre.
