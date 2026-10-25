import assert from 'node:assert/strict';
import test from 'node:test';
import { createStorage, decodeData, encodeData, defaultPreferences, type SavedData } from './storageCore.ts';

const resolve = (name: string) => `file:///current/Documents/${name}`;
const fixture = (): SavedData => ({ words: [{ id: 'custom-1', stage: 'subject', label: '', emoji: '📷', imageUri: 'file:///old/Documents/custom-1.jpg', audioUri: 'file:///old/Documents/custom-1.m4a' }], usage: { 'custom-1': 2 }, preferences: { palette: 'sand', autoSpeak: false } });
test('empty storage provides safe initial values', () => {
  assert.deepEqual(decodeData(null, resolve), { words: [], usage: {}, preferences: defaultPreferences() });
});
test('custom cards, frequencies and preferences round-trip with relative filenames', () => {
  const raw = encodeData(fixture());
  assert.ok(!raw.includes('/old/'));
  const decoded = decodeData(raw, resolve);
  assert.equal(decoded.words[0].imageUri, resolve('custom-1.jpg'));
  assert.equal(decoded.words[0].audioUri, resolve('custom-1.m4a'));
  assert.deepEqual(decoded.preferences, { palette: 'sand', autoSpeak: false });
  assert.equal(decoded.usage['custom-1'], 2);
});
test('old absolute iOS media paths rebase and old saves gain default preferences', () => {
  const old: Partial<SavedData> = fixture(); delete old.preferences;
  const result = decodeData(JSON.stringify(old), resolve);
  assert.equal(result.words[0].imageUri, resolve('custom-1.jpg'));
  assert.deepEqual(result.preferences, defaultPreferences());
});
test('corrupt JSON and invalid structure are rejected', () => {
  for (const raw of ['{', 'null', '[]', '{}', '{"words":[],"usage":[]}']) assert.throws(() => decodeData(raw, resolve));
});
test('invalid cards, duplicates and unsafe filenames are rejected', () => {
  for (const patch of [{ id: 'i' }, { stage: 'other' }, { audioUri: '' }, { imageUri: '../..' }, { label: null }]) {
    const data = fixture(); Object.assign(data.words[0], patch);
    assert.throws(() => decodeData(JSON.stringify(data), resolve));
  }
  const duplicate = fixture(); duplicate.words.push({ ...duplicate.words[0] });
  assert.throws(() => decodeData(JSON.stringify(duplicate), resolve));
});
test('negative, fractional, nonfinite or malicious usage data cannot load', () => {
  for (const usage of [{ i: -1 }, { i: 1.5 }, { i: null }, JSON.parse('{"__proto__":2}')]) {
    assert.throws(() => decodeData(JSON.stringify({ ...fixture(), usage }), resolve));
  }
});
test('unknown palette or invalid sound preferences cannot load', () => {
  for (const preferences of [{ palette: 'missing', autoSpeak: true }, { palette: 'sage', autoSpeak: 1 }, null]) {
    assert.throws(() => decodeData(JSON.stringify({ ...fixture(), preferences }), resolve));
  }
});
test('save snapshots cannot be changed by mutating the caller afterwards', async () => {
  const values: string[] = [];
  const storage = createStorage({ getItem: async () => null, setItem: async (_key, value) => { values.push(value); } }, resolve);
  const data = fixture(); const pending = storage.save(data);
  data.usage['custom-1'] = 100;
  await pending;
  assert.equal(JSON.parse(values[0]).usage['custom-1'], 2);
});
test('overlapping writes execute serially and newest data is last', async () => {
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  const counts: number[] = [];
  const storage = createStorage({ getItem: async () => null, setItem: async (_key, raw) => {
    const count = JSON.parse(raw).usage['custom-1']; counts.push(count);
    if (count === 2) await gate;
  } }, resolve);
  const first = storage.save(fixture());
  const newer = fixture(); newer.usage['custom-1'] = 3;
  const second = storage.save(newer);
  await new Promise<void>(r => setImmediate(r));
  assert.deepEqual(counts, [2]);
  release(); await Promise.all([first, second]);
  assert.deepEqual(counts, [2, 3]);
});
test('a failed write is reported and does not poison later saves', async () => {
  let attempt = 0;
  const storage = createStorage({ getItem: async () => null, setItem: async () => { if (++attempt === 1) throw new Error('disk full'); } }, resolve);
  await assert.rejects(storage.save(fixture()), /disk full/);
  await storage.save(fixture()); assert.equal(attempt, 2);
});
test('read failures propagate instead of returning empty data that could overwrite a save', async () => {
  let writes = 0;
  const storage = createStorage({ getItem: async () => { throw new Error('unavailable'); }, setItem: async () => { writes++; } }, resolve);
  await assert.rejects(storage.load(), /unavailable/);
  assert.equal(writes, 0);
});
