/**
 * Theme store — light only.
 *
 * The app has a single visual identity (light lavender). This store
 * is kept as a thin stub so existing imports still resolve, but the
 * mode is fixed to 'light' and `setMode` is a no-op.
 */
import { create } from 'zustand';

export type ThemeMode = 'light';

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  hydrated: true,
  setMode: () => {
    // no-op: the app is light only
  },
  hydrate: async () => {
    // no-op
  },
}));
