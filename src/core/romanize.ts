import { normalize } from './normalize.js';

/**
 * Arabizi (Franco-Arabic) → candidate Arabic spellings.
 * Arabizi is ambiguous (vowels may or may not be written; "t" can be ت or ط), so this returns
 * a ranked, capped list of normalized Arabic candidates to match against the dictionary.
 */

// Options are ordered by preference. '' means "not written in Arabic" (short vowel).
const TOKENS: [string, string[]][] = [
  // Multi-letter tokens first (longest match wins).
  ["3'", ['غ']],
  ["7'", ['خ']],
  ["9'", ['ض']],
  ['tsh', ['تش', 'ش']],
  ['sh', ['ش']],
  ['ch', ['تش', 'ش']],
  ['kh', ['خ']],
  ['gh', ['غ']],
  ['th', ['ث', 'ت']],
  ['dh', ['ذ', 'ض']],
  ['ou', ['و']],
  ['oo', ['و']],
  ['ee', ['ي']],
  ['ei', ['ي']],
  ['ai', ['ي']],
  ['aa', ['ا']],
  // Digit letters.
  ['2', ['ء', 'ا']],
  ['3', ['ع']],
  ['5', ['خ']],
  ['6', ['ط']],
  ['7', ['ح']],
  ['8', ['غ', 'ق']],
  ['9', ['ق', 'ص']],
  // Single letters.
  ['a', ['ا', '']],
  ['e', ['', 'ي', 'ا']],
  ['i', ['ي', '']],
  ['o', ['و', '']],
  ['u', ['', 'و']],
  ['b', ['ب']],
  ['p', ['ب']],
  ['t', ['ت', 'ط']],
  ['j', ['ج']],
  ['g', ['ج', 'ق', 'غ']],
  ['d', ['د', 'ض']],
  ['r', ['ر']],
  ['z', ['ز', 'ظ']],
  ['s', ['س', 'ص']],
  ['f', ['ف']],
  ['v', ['ف']],
  ['q', ['ق']],
  ['k', ['ك']],
  ['l', ['ل']],
  ['m', ['م']],
  ['n', ['ن']],
  ['h', ['ه', 'ح']],
  ['w', ['و']],
  ['y', ['ي']],
];

// Word-final vowels are usually written: -a/-e as ا or ة (ه after normalization), -i as ي.
const FINAL: Record<string, string[]> = {
  a: ['ا', 'ه', ''],
  e: ['ه', 'ي', ''],
  eh: ['ه'],
  an: ['ان', 'ا'], // tanween: shukran → شكرا
  ah: ['ه', 'ا'],
  i: ['ي'],
  o: ['و'],
  u: ['و'],
};

const MAX_CANDIDATES = 20;
const BEAM = 64;

/** True when the text is Latin letters mixed with Arabizi digit letters (2 3 5 6 7 8 9). */
export function looksLikeArabizi(text: string): boolean {
  return /[a-z]/i.test(text) && /[235-9]/.test(text) && !/[؀-ۿ]/.test(text);
}

function tokenizeWord(word: string): string[][] {
  const out: string[][] = [];
  let i = 0;
  while (i < word.length) {
    const rest = word.slice(i);
    // Word-final vowel (optionally followed by h).
    const final = Object.keys(FINAL)
      .sort((a, b) => b.length - a.length)
      .find((k) => rest === k);
    if (final && i > 0) {
      out.push(FINAL[final]!);
      break;
    }
    const token = TOKENS.find(([t]) => rest.startsWith(t));
    if (!token) {
      i += 1; // Unknown character: skip it.
      continue;
    }
    const [t, options] = token;
    // A doubled consonant is one Arabic letter with shadda (dropped by normalization).
    const doubled = t.length === 1 && /[b-df-hj-np-tv-z]/.test(t) && word[i + 1] === t;
    out.push(options);
    i += t.length + (doubled ? 1 : 0);
  }
  return out;
}

function wordCandidates(word: string): string[] {
  let beam: { text: string; cost: number }[] = [{ text: '', cost: 0 }];
  for (const options of tokenizeWord(word)) {
    const next = beam.flatMap((b) => options.map((o, rank) => ({ text: b.text + o, cost: b.cost + rank })));
    next.sort((a, b) => a.cost - b.cost);
    beam = next.slice(0, BEAM);
  }
  return beam.map((b) => b.text);
}

/** Ranked, de-duplicated, normalized Arabic candidates for an Arabizi phrase (capped at 20). */
export function arabiziCandidates(input: string): string[] {
  const words = input.toLowerCase().split(/\s+/).filter(Boolean);
  let phrases: string[] = [''];
  for (const word of words) {
    const options = wordCandidates(word).slice(0, MAX_CANDIDATES);
    phrases = phrases.flatMap((p) => options.map((o) => (p ? `${p} ${o}` : o))).slice(0, BEAM);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of phrases) {
    const n = normalize(p, 'arab');
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
      if (out.length === MAX_CANDIDATES) break;
    }
  }
  return out;
}
