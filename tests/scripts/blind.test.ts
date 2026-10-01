import { describe, expect, it } from 'vitest';
import { answersTemplate, flip, judgeSheet, PLACEHOLDER, readAnswers, readChoices, score, type Question } from '../../scripts/blind.js';

const questions: Question[] = [
  { id: 'q01', kind: 'same', text: 'كيفك؟' },
  { id: 'q02', kind: 'english', text: 'Say hi in Levantine' },
];
const filled = answersTemplate('ar-levantine', questions, '2026-10-01')
  .replace(`### without\n\n${PLACEHOLDER}`, '### without\n\nأنا بخير، شكراً لك.')
  .replace(`### with\n\n${PLACEHOLDER}`, '### with\n\nمنيح الحمدلله، وإنت؟')
  .replace(`### without\n\n${PLACEHOLDER}`, '### without\n\nمرحباً')
  .replace(`### with\n\n${PLACEHOLDER}`, '### with\n\nهلا والله');

describe('blind test', () => {
  it('reads pasted replies and skips empty slots', () => {
    const a = readAnswers(filled);
    expect(a.get('q01')).toEqual({ without: 'أنا بخير، شكراً لك.', with: 'منيح الحمدلله، وإنت؟' });
    expect(readAnswers(answersTemplate('ar-levantine', questions, 'x')).get('q01')).toEqual({});
  });

  it('builds an unlabelled sheet whose key maps choices back, the same way every time', () => {
    const { sheet, key } = judgeSheet('ar-levantine', questions, readAnswers(filled), 'seed');
    expect(sheet).not.toMatch(/\bwith\b|without/);
    expect(judgeSheet('ar-levantine', questions, readAnswers(filled), 'seed').key).toEqual(key);
    expect(key.q01!['1']).toBe(flip('seed', 'q01') ? 'with' : 'without');
  });

  it('scores judges’ choices per kind of question', () => {
    const { sheet, key } = judgeSheet('ar-levantine', questions, readAnswers(filled), 'seed');
    const pick = (id: string) => (key[id]!['1'] === 'with' ? '1' : '2');
    const judge = sheet.replace(/(## q01[\s\S]*?اختياري: )/, `$1${pick('q01')}`).replace(/(## q02[\s\S]*?اختياري: )/, '$1=');
    const choices = readChoices(judge);
    expect(choices.get('q01')).toBe(pick('q01'));
    const { byKind, wins } = score(key, [choices]);
    expect(byKind.same).toEqual({ with: 1, without: 0, same: 0 });
    expect(byKind.english).toEqual({ with: 0, without: 0, same: 1 });
    expect(wins(byKind.same)).toBe(true);
    expect(wins(byKind.english)).toBe(false);
  });
});
