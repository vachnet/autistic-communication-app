import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { createStorage } from './storageCore';

const storage = createStorage(AsyncStorage, name => new File(Paths.document, name).uri);
export const loadData = storage.load;
export const saveData = storage.save;
export type { SavedData } from './storageCore';

export function keepMedia(uri: string, name: string): string {
  const target = new File(Paths.document, name);
  new File(uri).copy(target);
  return target.uri;
}

export function deleteMedia(uri?: string) {
  if (!uri || !uri.startsWith(Paths.document.uri)) return;
  try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* Best effort cleanup. */ }
}
