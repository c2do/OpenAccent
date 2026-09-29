/**
 * Evals without the API: you ask Claude yourself (in Claude Desktop, on your normal plan), paste the
 * replies into a file, and the replies are scored here, on your machine.
 *
 *   npm run eval:manual -- --dialect ar-ps-fallahi-kaf     # writes evals/manual/<date>-<dialect>.md
 *   (paste each reply under its heading, with OpenAccent off, then on)
 *   npm run eval:manual -- --score evals/manual/<file>.md  # prints the report and saves <file>.report.md
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Dictionary } from '../src/core/dictionary.js';
import { buildBundle } from './build-data.js';
import { loadEvalSets, renderReport, scoreReply, type Condition, type EvalSet, type ReplyRecord } from './eval.js';

const CONDITIONS: Condition[] = ['baseline', 'openaccent'];
export const PLACEHOLDER = '(paste the reply here)';

/** The file you fill in: instructions, then each prompt with a slot per condition. */
export function manualTemplate(set: EvalSet, date: string): string {
  const lines = [
    `# OpenAccent manual eval: ${set.dialect}`,
    '',
    `<!-- dialect: ${set.dialect} -->`,
    `<!-- date: ${date} -->`,
    '',
    '## How to fill this in (about 15 minutes)',
    '',
    '1. **baseline:** in Claude Desktop, open *Settings → Extensions* and turn **OpenAccent off**. Start a new chat and send the prompts below one by one. Paste each reply under `### baseline`.',
    '2. **openaccent:** turn **OpenAccent on** and start a new chat. If you have no profile yet, tell Claude your dialect first. Send the same prompts and paste each reply under `### openaccent`.',
    '3. Replace only the placeholder line under each heading. Leave a slot as it is to skip it.',
    `4. Score it: \`npm run eval:manual -- --score <this file>\``,
    '',
    ...(set.notes ? [`What a native speaker would expect: ${set.notes}`, ''] : []),
  ];
  for (const p of set.prompts) {
    lines.push(`## ${p.id}`, '', `> ${p.text}`, '');
    for (const c of CONDITIONS) lines.push(`### ${c}`, '', PLACEHOLDER, '');
  }
  return lines.join('\n');
}

export interface ParsedManual {
  dialect: string;
  date?: string;
  /** Replies that were filled in. */
  replies: { promptId: string; prompt: string; condition: Condition; reply: string }[];
  /** Slots left empty. */
  missing: number;
}

/** Reads a filled-in file back. */
export function parseManual(markdown: string): ParsedManual {
  const dialect = /<!--\s*dialect:\s*([^\s]+)\s*-->/.exec(markdown)?.[1];
  if (!dialect) throw new Error('This file has no "<!-- dialect: ... -->" line. Create it with --dialect.');
  const date = /<!--\s*date:\s*([^\s]+)\s*-->/.exec(markdown)?.[1];
  const replies: ParsedManual['replies'] = [];
  let missing = 0;
  // Each prompt is a "## id" section that holds a "> prompt" line and "### condition" subsections.
  for (const section of markdown.split(/^## /m).slice(1)) {
    const [heading, ...rest] = section.split('\n');
    const promptId = heading!.trim();
    const body = rest.join('\n');
    const prompt = /^> (.*)$/m.exec(body)?.[1]?.trim();
    if (!prompt) continue; // the "How to" section
    for (const part of body.split(/^### /m).slice(1)) {
      const [name, ...replyLines] = part.split('\n');
      const condition = name!.trim() as Condition;
      if (!CONDITIONS.includes(condition)) continue;
      const reply = replyLines.join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();
      if (!reply || reply === PLACEHOLDER) {
        missing++;
        continue;
      }
      replies.push({ promptId, prompt, condition, reply });
    }
  }
  return { dialect, ...(date ? { date } : {}), replies, missing };
}

export function scoreManual(dict: Dictionary, parsed: ParsedManual): ReplyRecord[] {
  return parsed.replies.map((r) => ({ dialect: parsed.dialect, ...r, score: scoreReply(dict, parsed.dialect, r.reply) }));
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main() {
  const root = process.cwd();
  const scoreFile = arg('score');
  if (scoreFile) {
    const parsed = parseManual(readFileSync(scoreFile, 'utf8'));
    if (parsed.replies.length === 0) throw new Error(`No replies pasted in ${scoreFile} yet.`);
    const dict = new Dictionary(buildBundle(join(root, 'data')));
    const records = scoreManual(dict, parsed);
    const date = parsed.date ?? new Date().toISOString().slice(0, 10);
    const report = renderReport(records, { model: 'Claude Desktop (manual)', effort: 'n/a', date }).replace(
      '# OpenAccent eval',
      '# OpenAccent manual eval',
    );
    const note = parsed.missing ? `\n_${parsed.missing} slot(s) left empty and skipped._\n` : '';
    const out = scoreFile.replace(/\.md$/, '') + '.report.md';
    writeFileSync(out, report + note);
    console.log(report + note);
    console.log(`Saved ${out}`);
    return;
  }

  const dialect = arg('dialect');
  const sets = loadEvalSets(join(root, 'evals', 'prompts'));
  const set = sets.find((s) => s.dialect === dialect);
  if (!set) {
    throw new Error(`Pass --dialect with one of: ${sets.map((s) => s.dialect).join(', ')}`);
  }
  const date = new Date().toISOString().slice(0, 10);
  const dir = join(root, 'evals', 'manual');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${date}-${set.dialect}.md`);
  if (existsSync(file)) throw new Error(`${file} already exists: fill that one in, or delete it to start over.`);
  writeFileSync(file, manualTemplate(set, date));
  console.log(`Wrote ${file}\nOpen it, follow the steps at the top, then run:\n  npm run eval:manual -- --score ${file}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
