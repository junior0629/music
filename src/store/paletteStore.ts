/**
 * Palette store — extracted colors from the currently playing artwork.
 *
 * Phase 2: set by playerStore when a track loads, read by
 * GradientBackground to tint the page background. Not persisted
 * (the palette is per-track; no need to save across restarts).
 *
 * Falls back to null when no track is loaded or extraction fails
 * — the GradientBackground then uses its default theme gradient.
 */
import { create } from 'zustand';
import type { ExtractedPalette } from '@/utils/dominantColor';

interface PaletteState {
  palette: ExtractedPalette | null;
  setPalette: (p: ExtractedPalette | null) => void;
}

export const usePaletteStore = create<PaletteState>((set) => ({
  palette: null,
  setPalette: (palette) => set({ palette }),
}));
