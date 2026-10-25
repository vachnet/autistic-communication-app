import { STAGES, type Word, type Usage } from './domain.ts';
import { PALETTES, type PaletteId } from './design.ts';

export interface Preferences { palette: PaletteId; autoSpeak: boolean }
export interface SavedData { words: Word[]; usage: Usage; preferences: Preferences }
export const defaultPreferences = (): Preferences => ({ palette: 'sage', autoSpeak: true });
export const STORAGE_KEY = 'communicate-together:v1';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function filename(uri: string): string {
  const name = uri.split('/').pop()!;
  if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(name)) throw new Error('Invalid media filename');
  return name;
}
export function decodeData(raw: string | null, resolveMedia: (name: string) => string): SavedData {
  if (!raw) return { words: [], usage: {}, preferences: defaultPreferences() };
  const data: unknown = JSON.parse(raw);
  if (!record(data) || !Array.isArray(data.words) || !record(data.usage)) throw new Error('Invalid saved data');
  const ids = new Set<string>();
  const words = data.words.map((w: unknown): Word => {
    if (!record(w) || typeof w.id !== 'string' || !w.id.startsWith('custom-') || ids.has(w.id) ||
      !STAGES.includes(w.stage as never) || typeof w.label !== 'string' || typeof w.emoji !== 'string' ||
      typeof w.imageUri !== 'string' || typeof w.audioUri !== 'string') throw new Error('Invalid saved card');
    ids.add(w.id);
    return { id: w.id, stage: w.stage as Word['stage'], label: w.label, emoji: w.emoji,
      imageUri: resolveMedia(filename(w.imageUri)), audioUri: resolveMedia(filename(w.audioUri)) };
  });
  const usage: Usage = {};
  for (const [id, count] of Object.entries(data.usage)) {
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 || ['__proto__', 'constructor', 'prototype'].includes(id)) throw new Error('Invalid usage');
    usage[id] = count;
  }
  const preferences = defaultPreferences();
  if (data.preferences !== undefined) {
    if (!record(data.preferences) || typeof data.preferences.palette !== 'string' ||
      !Object.hasOwn(PALETTES, data.preferences.palette) || typeof data.preferences.autoSpeak !== 'boolean') throw new Error('Invalid preferences');
    preferences.palette = data.preferences.palette as PaletteId;
    preferences.autoSpeak = data.preferences.autoSpeak;
  }
  return { words, usage, preferences };
}
export function encodeData(data: SavedData) {
  const normalized = { ...data, words: data.words.map(w => ({ ...w,
    imageUri: filename(w.imageUri ?? ''), audioUri: filename(w.audioUri ?? ''),
  })) };
  const raw = JSON.stringify(normalized);
  decodeData(raw, name => name);
  return raw;
}
export function createStorage(backend: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> }, resolveMedia: (name: string) => string) {
  let writes = Promise.resolve();
  return {
    async load(): Promise<SavedData> { return decodeData(await backend.getItem(STORAGE_KEY), resolveMedia); },
    save(data: SavedData): Promise<void> {
      const json = encodeData(data);
      writes = writes.catch(() => {}).then(() => backend.setItem(STORAGE_KEY, json));
      return writes;
    },
  };
}
