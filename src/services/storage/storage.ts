/**
 * Storage service abstraction.
 *
 * Phase 1: thin wrapper around AsyncStorage for theme + small KV.
 * Phase 3: SQLite-backed queries for playlists/favorites/history.
 *
 * The interface stays the same so consumers don't change.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

export interface StorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class AsyncStorageBackend implements StorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      logger.warn('storage.getItem failed', { key, e: String(e) });
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      logger.warn('storage.setItem failed', { key, e: String(e) });
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      logger.warn('storage.removeItem failed', { key, e: String(e) });
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      logger.warn('storage.clear failed', { e: String(e) });
    }
  }
}

export const storage: StorageService = new AsyncStorageBackend();
