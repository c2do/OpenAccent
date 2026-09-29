/** Pre-filled GitHub issue-form links for contributing to the dictionary. */

export const REPO_URL = 'https://github.com/c2do/OpenAccent';
const MAX_URL_LENGTH = 2000;

/** Must match the field `id`s in .github/ISSUE_TEMPLATE/add-word.yml and fix-word.yml. */
export const ISSUE_FIELD_IDS = [
  'word',
  'dialect',
  'meaning_ar',
  'meaning_en',
  'example',
  'spellings',
  'romanized',
  'register',
  'familiarity',
  'notes',
] as const;
export type IssueField = (typeof ISSUE_FIELD_IDS)[number];

export interface SuggestionLink {
  url: string;
  /** Fields left out to keep the URL short enough. */
  dropped: IssueField[];
  note: string;
}

// When the URL is too long, drop the least important fields first.
const DROP_ORDER: IssueField[] = ['example', 'notes', 'spellings', 'romanized', 'meaning_ar', 'meaning_en'];

export function buildSuggestionUrl(
  template: 'add-word' | 'fix-word',
  fields: Partial<Record<IssueField, string>>,
): SuggestionLink {
  const values = { ...fields };
  const dropped: IssueField[] = [];

  const make = () => {
    const params = new URLSearchParams({ template: `${template}.yml` });
    const title = `${template === 'add-word' ? '[Add]' : '[Fix]'} ${values.word ?? ''}${values.dialect ? ` (${values.dialect})` : ''}`;
    params.set('title', title.trim());
    for (const id of ISSUE_FIELD_IDS) {
      const v = values[id]?.trim();
      if (v) params.set(id, v);
    }
    return `${REPO_URL}/issues/new?${params.toString()}`;
  };

  let url = make();
  for (const field of DROP_ORDER) {
    if (url.length <= MAX_URL_LENGTH) break;
    if (values[field]) {
      delete values[field];
      dropped.push(field);
      url = make();
    }
  }

  const notes = [
    'Open this link in a web browser (not the GitHub mobile app, which drops the pre-filled fields).',
    'A GitHub account is needed to submit.',
  ];
  if (dropped.length) notes.push(`To keep the link short, these fields were left for you to fill in: ${dropped.join(', ')}.`);
  return { url, dropped, note: notes.join(' ') };
}
