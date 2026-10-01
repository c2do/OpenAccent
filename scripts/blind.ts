/**
 * A blind test that people judge, not a script: does the paste-in prompt make replies sound like
 * people from your place? No API needed. (The automatic eval in scripts/eval.ts scores replies with
 * OpenAccent's own word lists, which can't answer that.)
 *
 *   npm run blind -- --new ar-levantine          # evals/blind/<date>-<dialect>/answers.md: questions + steps
 *   (ask each question twice, without and with the prompt, and paste the replies)
 *   npm run blind -- --sheet <dir>                # judge-sheet.md (shuffled, unlabelled) + key.json
 *   (copy judge-sheet.md to judge-<name>.md for each judge; they fill in 1, 2 or = per question)
 *   npm run blind -- --score <dir>                # who won, per kind of question
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

export type Kind = 'same' | 'english' | 'long';
export interface Question {
  id: string;
  kind: Kind;
  text: string;
}
export const SLOTS = ['without', 'with'] as const;
export const PLACEHOLDER = '(الصق الرد هون)';
/** The prompt wins a kind of question when judges prefer it in at least this share of decided pairs. */
export const WIN_SHARE = 0.6;

export function loadQuestions(file: string): { dialect: string; questions: Question[] } {
  return parse(readFileSync(file, 'utf8')) as { dialect: string; questions: Question[] };
}

export function answersTemplate(dialect: string, questions: Question[], date: string): string {
  const lines = [
    `<!-- blind test: ${dialect}, ${date} -->`,
    `# اختبار أعمى: ${dialect}`,
    '',
    '## الخطوات (تقريباً ساعة)',
    '',
    `1. **بدون (without):** افتح ChatGPT أو Claude، **طفّي الذاكرة** والتعليمات المخصّصة، وافتح محادثة جديدة لكل سؤال. الصق الرد تحت \`### without\`.`,
    `2. **مع (with):** الصق النص من \`docs/prompts/${dialect}.md\` في التعليمات المخصّصة، وافتح محادثة جديدة لكل سؤال. الصق الرد تحت \`### with\`.`,
    '3. نفس التطبيق ونفس النموذج بالحالتين. استبدل سطر الـ placeholder بس.',
    `4. بعدها: \`npm run blind -- --sheet <هالمجلد>\` بيعمل ورقة للحكّام ما فيها مين مين.`,
    '',
  ];
  for (const q of questions) {
    lines.push(`## ${q.id} (${q.kind})`, '', `> ${q.text}`, '');
    for (const s of SLOTS) lines.push(`### ${s}`, '', PLACEHOLDER, '');
  }
  return lines.join('\n');
}

/** Replies by question id and slot; empty slots are left out. */
export function readAnswers(markdown: string): Map<string, Partial<Record<(typeof SLOTS)[number], string>>> {
  const out = new Map<string, Partial<Record<(typeof SLOTS)[number], string>>>();
  for (const block of markdown.split(/^## /m).slice(1)) {
    const id = block.match(/^(q\d+)/)?.[1];
    if (!id) continue;
    const entry: Partial<Record<(typeof SLOTS)[number], string>> = {};
    for (const s of SLOTS) {
      const m = block.match(new RegExp(`^### ${s}\\n([\\s\\S]*?)(?=^### |$(?![\\s\\S]))`, 'm'));
      const text = m?.[1]?.trim();
      if (text && text !== PLACEHOLDER) entry[s] = text;
    }
    out.set(id, entry);
  }
  return out;
}

/** Deterministic coin flip per question, so the same answers always give the same sheet. */
export const flip = (seed: string, id: string) => (createHash('sha256').update(`${seed}:${id}`).digest()[0]! & 1) === 1;

export function judgeSheet(dialect: string, questions: Question[], answers: ReturnType<typeof readAnswers>, seed: string) {
  const key: Record<string, { '1': string; '2': string; kind: Kind }> = {};
  const lines = [
    `# ورقة الحكم: ${dialect}`,
    '',
    'لكل سؤال في ردّين. ما حدا بيعرف مين كتب أي واحد. **أي رد بيحكي أكثر مثل حدا من بلدك؟**',
    'اكتب `1` أو `2` بعد «اختياري:»، أو `=` إذا ما في فرق. وإذا في كلمة ما حدا عندكم بيحكيها، اكتبها بالملاحظة.',
    '',
  ];
  for (const q of questions) {
    const a = answers.get(q.id);
    if (!a?.with || !a.without) continue;
    const [one, two] = flip(seed, q.id) ? (['with', 'without'] as const) : (['without', 'with'] as const);
    key[q.id] = { '1': one, '2': two, kind: q.kind };
    lines.push(`## ${q.id}`, '', `> ${q.text}`, '', '**رد 1:**', '', a[one]!, '', '**رد 2:**', '', a[two]!, '', 'اختياري: ', '', 'ملاحظة: ', '');
  }
  return { sheet: lines.join('\n'), key };
}

/** Choices from a filled-in sheet: question id → "1" | "2" | "=". */
export function readChoices(markdown: string): Map<string, '1' | '2' | '='> {
  const out = new Map<string, '1' | '2' | '='>();
  for (const block of markdown.split(/^## /m).slice(1)) {
    const id = block.match(/^(q\d+)/)?.[1];
    const choice = block.match(/^اختياري:\s*([12=])/m)?.[1] as '1' | '2' | '=' | undefined;
    if (id && choice) out.set(id, choice);
  }
  return out;
}

export interface Tally {
  with: number;
  without: number;
  same: number;
}

export function score(key: ReturnType<typeof judgeSheet>['key'], judges: Map<string, '1' | '2' | '='>[]) {
  const byKind: Record<Kind, Tally> = { same: { with: 0, without: 0, same: 0 }, english: { with: 0, without: 0, same: 0 }, long: { with: 0, without: 0, same: 0 } };
  for (const choices of judges) {
    for (const [id, choice] of choices) {
      const k = key[id];
      if (!k) continue;
      if (choice === '=') byKind[k.kind].same++;
      else byKind[k.kind][k[choice] as 'with' | 'without']++;
    }
  }
  const share = (t: Tally) => (t.with + t.without ? t.with / (t.with + t.without) : undefined);
  return { byKind, share, wins: (t: Tally) => (share(t) ?? 0) >= WIN_SHARE };
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const dialectNew = arg('new');
  const sheetDir = arg('sheet');
  const scoreDir = arg('score');
  if (dialectNew) {
    const { questions } = loadQuestions(join(root, 'evals/blind/questions', `${dialectNew}.yaml`));
    const date = new Date().toISOString().slice(0, 10);
    const dir = join(root, 'evals/blind', `${date}-${dialectNew}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'answers.md'), answersTemplate(dialectNew, questions, date));
    console.log(`✓ ${join(dir, 'answers.md')}`);
  } else if (sheetDir) {
    const md = readFileSync(join(sheetDir, 'answers.md'), 'utf8');
    const dialect = md.match(/blind test: ([\w-]+)/)?.[1] ?? '';
    const { questions } = loadQuestions(join(root, 'evals/blind/questions', `${dialect}.yaml`));
    const { sheet, key } = judgeSheet(dialect, questions, readAnswers(md), md);
    writeFileSync(join(sheetDir, 'judge-sheet.md'), sheet);
    writeFileSync(join(sheetDir, 'key.json'), JSON.stringify(key, null, 2));
    console.log(`✓ judge-sheet.md with ${Object.keys(key).length} pairs. Don't show key.json to the judges.`);
  } else if (scoreDir) {
    const key = JSON.parse(readFileSync(join(scoreDir, 'key.json'), 'utf8'));
    const files = readdirSync(scoreDir).filter((f) => /^judge-(?!sheet).+\.md$/.test(f));
    if (!files.length || !existsSync(join(scoreDir, 'key.json'))) throw new Error('Need key.json and at least one judge-<name>.md');
    const { byKind, share, wins } = score(key, files.map((f) => readChoices(readFileSync(join(scoreDir, f), 'utf8'))));
    const rows = (Object.keys(byKind) as Kind[]).map((k) => {
      const t = byKind[k];
      const s = share(t);
      return `| ${k} | ${t.with} | ${t.without} | ${t.same} | ${s === undefined ? '-' : `${Math.round(s * 100)}%`} | ${s === undefined ? '-' : wins(t) ? 'prompt wins' : 'no clear win'} |`;
    });
    const report = [`Judges: ${files.length}`, '', '| Questions | Prefer with prompt | Prefer without | Same | Share with | Verdict |', '|---|---|---|---|---|---|', ...rows, '', `The prompt "wins" a kind of question at ${WIN_SHARE * 100}% or more of decided pairs.`].join('\n');
    writeFileSync(join(scoreDir, 'report.md'), report + '\n');
    console.log(report);
  } else {
    console.log('Usage: npm run blind -- --new <dialect> | --sheet <dir> | --score <dir>');
  }
}
