<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Habla con la IA como hablarías con alguien de tu tierra.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <b>Español</b> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 Esta traducción la redactó una IA. Si el español es tu lengua, ayúdanos a mejorarla: es justo el tipo de cosa que este proyecto quiere arreglar.

OpenAccent es un diccionario de código abierto de los dialectos del mundo, organizado por país, construido por la comunidad y verificado por hablantes nativos. También guarda una memoria personal de cómo hablas *tú*. Ambos llegan a asistentes de IA como Claude a través de [MCP](https://modelcontextprotocol.io).

> **Estado: desarrollo temprano.** Todo funciona en local, en tu equipo. Empezamos por los dialectos árabes más hablados, llenados con fuentes abiertas y revisados por hablantes nativos. Instalación: [`docs/setup.md`](../../docs/setup.md).

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
| 🗣️ **Aprende cómo hablas** | ¿Hablas más de un dialecto? ¿Mezclas con inglés? ¿Escribes corto, o en arabizi? OpenAccent lo aprende de tus propios mensajes (solo guarda recuentos, nunca los mensajes) y le pide a la IA que se adapte a ti. |
| 🔍 **Revisión de respuestas** | Señala palabras del dialecto equivocado, palabras raras, palabras escritas como se pronuncian y palabras que ya corregiste. |

## Más allá del chat: cuentos, canciones, guiones y juegos

El dialecto es lo que hace que un personaje parezca real. OpenAccent le da a cualquier IA que escribe las palabras, los sonidos y las reglas de un dialecto, y luego revisa cada línea.

| Escribe… | Qué hace OpenAccent |
|---|---|
| 📚 **Cuentos y novelas** | Una abuela de El Cairo y su nieto de Casablanca pueden compartir una escena, cada uno en su dialecto: cada personaje tiene su tarjeta de dialecto, y cada línea se revisa según el dialecto de ese personaje. Las palabras antiguas o raras se permiten cuando la historia las pide. |
| 🎵 **Letras de canciones** | Palabras cotidianas que la gente canta de verdad, en un solo dialecto coherente. Las palabras raras o anticuadas están bien cuando encajan en la canción. |
| 🎬 **Guiones de cine, TV y pódcast** | Frases escritas como los actores deben decirlas (*تشيف* fallahi por كيف). Los personajes pueden decir palabrotas si la escena lo pide; los insultos discriminatorios siempre se señalan. |
| 🎮 **Diálogos de videojuegos** | NPC que suenan a un lugar concreto, y siguen sonando así a lo largo de cientos de líneas. |

Prueba a pedirle a Claude, con OpenAccent instalado:

- *"Escribe una escena corta: un taxista iraquí discute con un turista libanés por el precio del viaje. Que cada uno hable en su dialecto."*
- *"Escribe un estribillo para una canción de boda marroquí."*
- *"Reescribe este diálogo para que los personajes suenen egipcios, no a árabe estándar moderno."*

### Ideas para construir encima

OpenAccent es un servidor MCP, una CLI y un conjunto de datos abierto (CC BY-SA), así que puedes construir sobre él:

- Un asistente de letras o de guion que mantenga a cada personaje en su dialecto.
- Una herramienta de diálogos para juegos que revise miles de líneas de NPC en busca de mezclas de dialectos.
- Control de calidad de subtítulos y doblaje: pasa `check_reply` por un guion para detectar líneas en el dialecto equivocado.
- Un chatbot para negocios locales que hable como la gente de esa ciudad.
- Una app para aprender idiomas que enseñe el dialecto que la gente habla de verdad.

**Desarrolladores, buenas primeras contribuciones:** un normalizador de texto para un idioma nuevo, prompts de evaluación para tu dialecto, un importador para otro conjunto de datos con licencia abierta, o un plugin de editor alrededor de la CLI. Mira [`docs/design.md`](../../docs/design.md).

## Dialectos

**Primero el árabe.** Empezamos por los dialectos árabes más hablados:

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Egipcio</b><br><sub>Egipto</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Levantino</b><br><sub>Siria · Líbano · Jordania · Palestina</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Saudí y del Golfo</b><br><sub>Arabia Saudí · el Golfo</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>Iraquí</b><br><sub>Irak</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>Sudanés</b><br><sub>Sudán</sub></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Darija marroquí</b><br><sub>Marruecos</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>Darja argelina</b><br><sub>Argelia</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>Derja tunecina</b><br><sub>Túnez</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Libanés</b><br><sub>Líbano</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>Jordano</b><br><sub>Jordania</sub></td></tr>
</table>

**También empezados:** el español de México, el español de España, el francés y el turco ya tienen palabras en borrador. El inglés estadounidense, británico e indio, el alemán, el portugués de Brasil y el hindi están preparados y esperando mejores fuentes.

<details>
<summary>La primera ola mundial (14 dialectos)</summary>

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Inglés estadounidense</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>británico</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>de la India</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>español de México</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>de España</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>portugués de Brasil</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>francés de Francia</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>alemán de Alemania</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>turco</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>hindi</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>árabe egipcio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>saudí</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>sirio</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>libanés</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>darija marroquí</b></td></tr>
</table>

</details>

Las palabras vienen de [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), filtradas por región y ordenadas por frecuencia. Cada palabra importada empieza como **borrador** hasta que la revise un hablante nativo.

## Contribuye

No hace falta programar.

- **¿Hablas uno de estos dialectos?** Lo que más necesitamos son **revisores**. Abre un issue y dinos cuál hablas. Cada dialecto tiene una guía breve (cómo suena, los errores que comete la IA en él) escrita como borrador, que espera a alguien que haya crecido hablándolo.
- **¿Quieres añadir una palabra o un dialecto?** Pronto habrá formularios sencillos. Por ahora, mira [`data/README.md`](../../data/README.md).
- **¿Puedes mejorar esta traducción?** ¡Por favor!

## Licencia

- **Código:** [MIT](../../LICENSE)
- **Datos del diccionario** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), la misma licencia que Wikipedia. Los datos serán abiertos para siempre.
