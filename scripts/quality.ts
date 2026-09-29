/**
 * Data quality rules shared by the Wiktionary importer (what never gets imported) and the audit
 * (what gets flagged in data that is already there).
 */

// Offensive, sexual and slur senses are never imported automatically: models read these words as
// "how people talk here", and a draft slur is worse than a missing word. Contributors can still add
// vulgar words by hand, with a reviewer.
export const SENSITIVE_TAGS = new Set(['vulgar', 'offensive', 'derogatory', 'slur', 'ethnic', 'pejorative', 'sexual', 'sexuality']);
export const SENSITIVE_GLOSS =
  /\b(slurs?|offensive|derogatory|pejorative|racist|sex(ual(ly)?)?|intercourse|fuck\w*|cunt|penis|vagina|vulva|testic\w*|scrotum|anus|buttocks?|breasts?|masturbat\w*|orgasm|erection|semen|prostitut\w*|whores?|sluts?|rap(e|es|ed|ing|ist|ists)|p(a)?edophil\w*|homosexual\w*|gay|lesbian\w*|fag\w*|heroin|cocaine|marijuana|drugs?|suicide|kill (oneself|himself|herself)|diarrh\w*|excrement|f(a)?eces|shit\w*|urinat\w*|piss\w*|menstrua\w*|nigg\w*|retard\w*|untouchables?|caste)\b/i;
/** Words that are only a clitic, however they are tagged. */
export const BARE_CLITICS = new Set(['ال', 'لل']);
// Grammar words: not what makes a dialect recognisable, unless they express a core concept.
export const FUNCTION_POS = new Set(['article', 'det', 'prep', 'postp', 'conj', 'particle', 'pron', 'contraction']);

/** A sense we would never want a model to pick up as everyday speech. */
export function isSensitive(sense: { glosses?: string[]; tags?: string[] }): boolean {
  return (sense.tags ?? []).some((t) => SENSITIVE_TAGS.has(t)) || (sense.glosses ?? []).some((g) => SENSITIVE_GLOSS.test(g));
}

/**
 * Letters in a word, ignoring harakat, accents and tatweel. Spacing vowel signs count as letters:
 * in Devanagari हाँ ("yes") and की are written with one consonant plus a vowel sign.
 */
export const letterCount = (word: string) => [...word].filter((c) => /[\p{L}\p{Mc}]/u.test(c) && c !== 'ـ').length;

