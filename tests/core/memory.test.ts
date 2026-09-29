import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileMemoryStore, resolveMemoryPath } from '../../src/core/memory.js';

let dir: string;
let path: string;
let tick = 0;
const clock = () => new Date(Date.UTC(2026, 8, 29, 12, 0, tick++));

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'oa-mem-'));
  path = join(dir, 'nested', 'memory.json');
  tick = 0;
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const store = () => new FileMemoryStore(path, clock);

describe('FileMemoryStore', () => {
  it('starts empty when the file does not exist', () => {
    expect(store().read()).toEqual({ version: 1, profile: {}, words: [], corrections: [], style: [] });
    expect(existsSync(path)).toBe(false);
  });

  it('remembers profile fields, merging with what is there', () => {
    const s = store();
    s.remember({ kind: 'profile', dialect: 'ar-ps-fallahi' });
    s.remember({ kind: 'profile', region: 'قرى رام الله' });
    expect(s.read().profile).toEqual({ dialect: 'ar-ps-fallahi', region: 'قرى رام الله' });
  });

  it('remembers words, corrections and style with ids and timestamps', () => {
    const s = store();
    const w = s.remember({ kind: 'word', say: 'هسّا', instead_of: 'هلأ', meaning: 'now' });
    const c = s.remember({ kind: 'correction', wrong: 'كويس', right: 'منيح' });
    const st = s.remember({ kind: 'style', text: 'Prefers short replies' });
    expect(w).toMatchObject({ created: true, item: { id: 'w1', say: 'هسّا' } });
    expect(c.item).toMatchObject({ id: 'c1', created_at: '2026-09-29T12:00:01.000Z' });
    expect(st.item).toMatchObject({ id: 's1' });
    // Persisted: a fresh instance sees the same data.
    expect(store().read().corrections).toHaveLength(1);
  });

  it('does not duplicate the same item', () => {
    const s = store();
    s.remember({ kind: 'correction', wrong: 'كويس', right: 'منيح' });
    const again = s.remember({ kind: 'correction', wrong: 'كويس', right: 'منيح' });
    expect(again.created).toBe(false);
    s.remember({ kind: 'style', text: 'Short replies' });
    s.remember({ kind: 'style', text: 'Short replies' });
    expect(s.read().corrections).toHaveLength(1);
    expect(s.read().style).toHaveLength(1);
  });

  it('updates a correction when the same wrong word gets a new right word', () => {
    const s = store();
    s.remember({ kind: 'correction', wrong: 'كويس', right: 'منيح' });
    const r = s.remember({ kind: 'correction', wrong: 'كويس', right: 'زاكي' });
    expect(r).toMatchObject({ created: false, item: { id: 'c1', right: 'زاكي' } });
    expect(s.read().corrections).toHaveLength(1);
  });

  it('assigns increasing ids after deletions', () => {
    const s = store();
    s.remember({ kind: 'style', text: 'a' });
    s.remember({ kind: 'style', text: 'b' });
    s.forget({ ids: ['s1'] });
    expect(s.remember({ kind: 'style', text: 'c' }).item.id).toBe('s3');
  });

  it('forgets by id and by text, returning what was removed', () => {
    const s = store();
    s.remember({ kind: 'word', say: 'هسّا', instead_of: 'هلأ' });
    s.remember({ kind: 'correction', wrong: 'كويس', right: 'منيح' });
    s.remember({ kind: 'style', text: 'Short replies' });
    expect(s.forget({ ids: ['s1'] }).map((i) => i.id)).toEqual(['s1']);
    expect(s.forget({ text: 'منيح' }).map((i) => i.id)).toEqual(['c1']);
    expect(s.read()).toMatchObject({ words: [{ id: 'w1' }], corrections: [], style: [] });
  });

  it('forgets the profile', () => {
    const s = store();
    s.remember({ kind: 'profile', dialect: 'ar-ps-fallahi' });
    expect(s.forget({ profile: true })).toEqual([{ id: 'profile', dialect: 'ar-ps-fallahi' }]);
    expect(s.read().profile).toEqual({});
  });

  it('writes atomically, leaving no temp files behind', () => {
    const s = store();
    s.remember({ kind: 'style', text: 'x' });
    expect(readdirSync(join(dir, 'nested'))).toEqual(['memory.json']);
    expect(JSON.parse(readFileSync(path, 'utf8')).version).toBe(1);
  });

  it('backs up a corrupt file, starts empty, and reports a warning', () => {
    const s = store();
    s.remember({ kind: 'style', text: 'x' });
    writeFileSync(path, '{ not json');
    const fresh = store();
    expect(fresh.read().style).toEqual([]);
    expect(fresh.warnings[0]).toMatch(/could not be read.*backed up/i);
    const files = readdirSync(join(dir, 'nested'));
    expect(files.some((f) => f.startsWith('memory.json.bak-'))).toBe(true);
    // Writing works again afterwards.
    fresh.remember({ kind: 'style', text: 'y' });
    expect(store().read().style).toHaveLength(1);
  });
});

describe('resolveMemoryPath', () => {
  it('uses OPENACCENT_MEMORY_PATH when set', () => {
    expect(resolveMemoryPath({ OPENACCENT_MEMORY_PATH: '/tmp/x.json' })).toBe('/tmp/x.json');
  });
  it('defaults to ~/.openaccent/memory.json', () => {
    expect(resolveMemoryPath({})).toBe(join(homedir(), '.openaccent', 'memory.json'));
  });
});
