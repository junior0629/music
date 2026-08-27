/**
 * Library store — playlists, favorites, recently played.
 *
 * Phase 1: shape only. State is in-memory.
 * Phase 3: hydrate from SQLite, write-through on mutations.
 */
import { create } from 'zustand';
import { Track } from '@/types/player';

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface LibraryState {
  favorites: Track[];
  playlists: Playlist[];
  recentlyPlayed: Track[];

  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => void;
  removeFavorite: (trackId: string) => void;

  addPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylist: (playlistId: string, from: number, to: number) => void;

  pushRecentlyPlayed: (track: Track) => void;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  favorites: [],
  playlists: [],
  recentlyPlayed: [],

  isFavorite: (trackId) => get().favorites.some((t) => t.id === trackId),

  toggleFavorite: (track) => {
    const exists = get().favorites.some((t) => t.id === track.id);
    set((s) => ({
      favorites: exists ? s.favorites.filter((t) => t.id !== track.id) : [track, ...s.favorites],
    }));
  },

  removeFavorite: (trackId) => {
    set((s) => ({ favorites: s.favorites.filter((t) => t.id !== trackId) }));
  },

  addPlaylist: (name) => {
    const id = makeId('pl');
    const now = Date.now();
    set((s) => ({
      playlists: [{ id, name, trackIds: [], createdAt: now, updatedAt: now }, ...s.playlists],
    }));
    return id;
  },

  renamePlaylist: (id, name) => {
    set((s) => ({
      playlists: s.playlists.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p)),
    }));
  },

  deletePlaylist: (id) => {
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
  },

  addTrackToPlaylist: (playlistId, track) => {
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === playlistId
          ? p.trackIds.includes(track.id)
            ? p
            : { ...p, trackIds: [...p.trackIds, track.id], updatedAt: Date.now() }
          : p,
      ),
    }));
  },

  removeTrackFromPlaylist: (playlistId, trackId) => {
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === playlistId
          ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() }
          : p,
      ),
    }));
  },

  reorderPlaylist: (playlistId, from, to) => {
    set((s) => ({
      playlists: s.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        const next = [...p.trackIds];
        const [moved] = next.splice(from, 1);
        if (moved === undefined) return p;
        next.splice(to, 0, moved);
        return { ...p, trackIds: next, updatedAt: Date.now() };
      }),
    }));
  },

  pushRecentlyPlayed: (track) => {
    set((s) => {
      const without = s.recentlyPlayed.filter((t) => t.id !== track.id);
      return { recentlyPlayed: [track, ...without].slice(0, 50) };
    });
  },
}));
