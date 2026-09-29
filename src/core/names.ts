import type { Dialect } from './schema.js';

const plain = (t: string) => t.replace(/\s*\([^)]*\)/g, '').trim();

/** "Palestinian Rural — Kaf (فلاحي كاف)": English name plus the Arabic one, without nested notes. */
export function displayName(dialect: Pick<Dialect, 'name'>): string {
  const en = plain(dialect.name.en);
  return dialect.name.ar ? `${en} (${plain(dialect.name.ar)})` : en;
}
