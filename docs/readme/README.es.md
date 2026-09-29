# OpenAccent

[English](../../README.md) · [العربية](README.ar.md) · **Español** · [Português](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [Türkçe](README.tr.md)

> 🤖 Esta traducción la redactó una IA. Si el español es tu lengua, ayúdanos a mejorarla: es justo el tipo de cosa que este proyecto quiere arreglar.

**Habla con la IA como hablarías con alguien de tu tierra.**

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

🇺🇸 · 🇬🇧 · 🇮🇳 · 🇲🇽 · 🇪🇸 · 🇧🇷 · 🇫🇷 · 🇩🇪 · 🇹🇷 · 🇮🇳 · 🇪🇬 · 🇸🇦 · 🇸🇾 · 🇱🇧 · 🇲🇦

Inglés estadounidense · británico · de la India · español de México · de España · portugués de Brasil · francés de Francia · alemán de Alemania · turco · hindi · árabe egipcio · saudí · sirio · libanés · darija marroquí

Las palabras vienen de [Wiktionary](https://en.wiktionary.org) (CC BY-SA 4.0), filtradas por región y ordenadas por frecuencia. Cada palabra importada empieza como **borrador** hasta que la revise un hablante nativo.

## Contribuye

No hace falta programar.

- **¿Hablas uno de estos dialectos?** Lo que más necesitamos son **revisores**. Abre un issue y dinos cuál hablas.
- **¿Quieres añadir una palabra o un dialecto?** Pronto habrá formularios sencillos. Por ahora, mira [`data/README.md`](../../data/README.md).
- **¿Puedes mejorar esta traducción?** ¡Por favor!

## Licencia

- **Código:** [MIT](../../LICENSE)
- **Datos del diccionario** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), la misma licencia que Wikipedia. Los datos serán abiertos para siempre.
