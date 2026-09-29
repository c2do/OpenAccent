import type { Dictionary } from './dictionary.js';

export interface ParsedGuide {
  title: string;
  /** From the `<!-- Status: ... -->` comment at the top; guides without one count as draft. */
  status: 'draft' | 'verified';
  /** Section heading (the `## ` line) → body. */
  sections: Record<string, string>;
}

export function parseGuide(markdown: string): ParsedGuide {
  const statusMatch = markdown.match(/<!--\s*Status:\s*(\w+)/i);
  const status = statusMatch?.[1]?.toLowerCase() === 'verified' ? 'verified' : 'draft';
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? '';
  const sections: Record<string, string> = {};
  const parts = markdown.split(/^##\s+/m).slice(1);
  for (const part of parts) {
    const [heading = '', ...body] = part.split('\n');
    sections[heading.trim()] = body.join('\n').trim();
  }
  return { title, status, sections };
}

export interface MergedGuide {
  dialect: string;
  /** Guides that contributed, nearest dialect first. */
  guides: { dialect: string; title: string; status: ParsedGuide['status'] }[];
  /** Each section lists the dialect's own text first, then its ancestors'. */
  sections: Record<string, { dialect: string; body: string }[]>;
}

/** The guide for a dialect, inheriting sections from its ancestors (child first). */
export function mergedGuide(dict: Dictionary, dialect: string): MergedGuide {
  const merged: MergedGuide = { dialect, guides: [], sections: {} };
  for (const id of dict.branch(dialect)) {
    const md = dict.bundle.guides[id];
    if (!md) continue;
    const g = parseGuide(md);
    merged.guides.push({ dialect: id, title: g.title, status: g.status });
    for (const [heading, body] of Object.entries(g.sections)) {
      if (!body) continue;
      (merged.sections[heading] ??= []).push({ dialect: id, body });
    }
  }
  return merged;
}
