/**
 * Theme store.
 * Holds: current theme mode (dark / light / system) + hydration flag.
 * Persisted to AsyncStorage under one key. Single source of truth for the theme.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '@/theme';
import { logger } from '@/utils/logger';
import { isWeb, isNative } from '@/theme';

const STORAGE_KEY = 'music.theme.v1';
// On web, AsyncStorage is a localStorage shim — same API.

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;

  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  hydrated: false,

  setMode: (mode) => {
    set({ mode });
    persist(mode).catch((e) => logger.warn('themeStore: persist failed', { e: String(e) }));
    logger.info('Theme mode set', { mode });
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw === 'dark' || raw === 'light' || raw === 'system') {
        set({ mode: raw, hydrated: true });
        logger.debug('themeStore: hydrated', { mode: raw, storage: isWeb ? 'localStorage' : isNative ? 'AsyncStorage' : 'unknown' });
        return;
      }
      set({ hydrated: true });
    } catch (e) {
      logger.warn('themeStore: hydrate failed, using default', { e: String(e) });
      set({ hydrated: true });
    }
  },
}));

async function persist(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, mode);
}
