/**
 * Mock data for the redesigned app.
 *
 * Centralised so screens stay declarative. Replace with real API
 * data when the backend is ready — types are stable.
 *
 * Gradient pairs use the same hexes the palette declares
 * (lavender / primary / soft variants) so the visual identity is
 * consistent across the app.
 */

import { Ionicons } from '@expo/vector-icons';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type Gradient = readonly [string, string];

// ---------------------------------------------------------------------------
//  Home — Jump Back In
// ---------------------------------------------------------------------------

export interface MockRecent {
  id: string;
  title: string;
  subtitle: string;
  /** Hex pair for the artwork gradient */
  gradient: Gradient;
  icon: IconName;
  /** Optional duration label, e.g. "3:24" */
  duration?: string;
}

export const MOCK_RECENT: MockRecent[] = [
  { id: 'r1', title: 'Night Drive',     subtitle: 'Synthwave',        gradient: ['#7C3AED', '#3B82F6'], icon: 'car-sport' },
  { id: 'r2', title: 'Study Beats',     subtitle: 'Lo-Fi Hip Hop',     gradient: ['#EC4899', '#A78BFA'], icon: 'book' },
  { id: 'r3', title: 'Deep Focus',      subtitle: 'Electronic',        gradient: ['#A78BFA', '#60A5FA'], icon: 'infinite' },
  { id: 'r4', title: 'Liked Songs',     subtitle: '428 tracks',        gradient: ['#7C3AED', '#A78BFA'], icon: 'heart' },
];

// ---------------------------------------------------------------------------
//  Home — Made For Alex
// ---------------------------------------------------------------------------

export interface MockDailyMix {
  id: string;
  title: string;
  subtitle: string;
  gradient: Gradient;
  /** Tracks for a small progress strip at the bottom of the card */
  progress?: number;
}

export const MOCK_DAILY_MIXES: MockDailyMix[] = [
  { id: 'm1', title: 'Daily Mix 1', subtitle: 'The Weeknd, Daft Punk, Kavinsky, and more', gradient: ['#3B82F6', '#7C3AED'], progress: 0.35 },
  { id: 'm2', title: 'Daily Mix 2', subtitle: 'Olivia Rodrigo, Billie Eilish, Lorde, and more', gradient: ['#A78BFA', '#F472B6'], progress: 0.12 },
  { id: 'm3', title: 'Chill Vibes',  subtitle: 'Relaxing, Chill Beats', gradient: ['#C4B5FD', '#E9D5FF'] },
];

// ---------------------------------------------------------------------------
//  Home — Category chips
// ---------------------------------------------------------------------------

export const HOME_CATEGORIES = ['All', 'Electronic', 'Lo-Fi', 'Podcasts', 'Workout'] as const;
export type HomeCategory = (typeof HOME_CATEGORIES)[number];

// ---------------------------------------------------------------------------
//  Discover — Browse by Genre
// ---------------------------------------------------------------------------

export interface MockGenre {
  id: string;
  name: string;
  gradient: Gradient;
  icon: IconName;
}

export const MOCK_GENRES: MockGenre[] = [
  { id: 'g_pop',  name: 'Pop',        gradient: ['#FBCFE8', '#E9D5FF'], icon: 'musical-notes' },
  { id: 'g_rock', name: 'Rock',       gradient: ['#E9D5FF', '#A78BFA'], icon: 'git-network' },
  { id: 'g_hip',  name: 'Hip-Hop',    gradient: ['#DDD6FE', '#FBCFE8'], icon: 'mic' },
  { id: 'g_elec', name: 'Electronic', gradient: ['#C4B5FD', '#7C3AED'], icon: 'pulse' },
];

// ---------------------------------------------------------------------------
//  Discover — Mood Playlists
// ---------------------------------------------------------------------------

export interface MockMood {
  id: string;
  title: string;
  subtitle: string;
  gradient: Gradient;
  icon: IconName;
}

export const MOCK_MOODS: MockMood[] = [
  { id: 'md_chill',   title: 'Chill Vibes',     subtitle: 'Playlist • 50 songs', gradient: ['#E9D5FF', '#C4B5FD'], icon: 'leaf' },
  { id: 'md_workout', title: 'Workout Energy',  subtitle: 'Playlist • 45 songs', gradient: ['#FBCFE8', '#DDD6FE'], icon: 'flame' },
];

// ---------------------------------------------------------------------------
//  Library — Playlists / Songs / Artists / Albums / Podcasts
// ---------------------------------------------------------------------------

export type LibraryRowKind = 'liked' | 'playlist' | 'podcast' | 'artist' | 'album';

export interface MockLibraryRow {
  id: string;
  kind: LibraryRowKind;
  title: string;
  subtitle: string;
  gradient: Gradient;
  icon: IconName;
}

export const MOCK_LIBRARY_ROWS: MockLibraryRow[] = [
  { id: 'l_liked',    kind: 'liked',    title: 'Liked Songs',           subtitle: 'Playlist • 428 songs',     gradient: ['#7C3AED', '#A78BFA'], icon: 'heart' },
  { id: 'l_folk',     kind: 'playlist', title: 'Modern Folk Essentials', subtitle: 'Playlist • Updated yesterday', gradient: ['#86EFAC', '#A78BFA'], icon: 'musical-notes' },
  { id: 'l_tech',     kind: 'podcast',  title: 'Tech Weekly',           subtitle: 'Podcast • 12 episodes',     gradient: ['#FBCFE8', '#7C3AED'], icon: 'mic' },
  { id: 'l_daft',     kind: 'artist',   title: 'Daft Punk',             subtitle: 'Artist',                    gradient: ['#1F1F1F', '#7C3AED'], icon: 'person' },
];

// Downloaded — separate section
export const MOCK_DOWNLOADED: MockLibraryRow[] = [
  { id: 'd_sour', kind: 'album', title: 'Sour', subtitle: 'Olivia Rodrigo • Album', gradient: ['#F472B6', '#FBBF24'], icon: 'cloud-done' },
];

// ---------------------------------------------------------------------------
//  Library — tab strip
// ---------------------------------------------------------------------------

export const LIBRARY_TABS = ['Playlists', 'Songs', 'Artists', 'Albums', 'Podcasts'] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];

export const LIBRARY_FILTERS = ['Recently Added', 'Downloaded'] as const;
export type LibraryFilter = (typeof LIBRARY_FILTERS)[number];

// ---------------------------------------------------------------------------
//  Profile — Premium / Stats / Account
// ---------------------------------------------------------------------------

export interface MockStat {
  value: string;
  label: string;
}

export const MOCK_STATS: MockStat[] = [
  { value: '1.2k', label: 'Minutes' },
  { value: '42',   label: 'Artists' },
  { value: '15',   label: 'Playlists' },
];

export interface MockSetting {
  id: string;
  title: string;
  icon: IconName;
  /** Hex for the lavender icon container */
  tint: string;
}

export const MOCK_SETTINGS: MockSetting[] = [
  { id: 's_personal', title: 'Personal Details',          icon: 'person',           tint: '#A78BFA' },
  { id: 's_privacy',  title: 'Privacy & Security',        icon: 'shield-checkmark', tint: '#7C3AED' },
  { id: 's_devices',  title: 'Devices & Connected Apps',  icon: 'phone-portrait',   tint: '#A78BFA' },
];

// ---------------------------------------------------------------------------
//  User
// ---------------------------------------------------------------------------

export const MOCK_USER = {
  name: 'Alex Rivera',
  subtitle: 'Music Lover • Since 2024',
  initials: 'AR',
};
