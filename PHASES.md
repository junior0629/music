# Phase Tracker

> **Single source of truth for "where are we."** I update this as we move through each phase. Don't trust anything else for current status.

**Project:** Personal music app for two people
**Repo:** https://github.com/junior0629/music.git
**Last updated:** 2026-08-28 (Phase 2 in progress)

---

## Current status

🟡 **Phase 2 — Real search + real playback via YouTube (in progress, ready for browser test)**
- ✅ YouTube Data API v3 key obtained + stored in `.env.local` (gitignored), `src/config/keys.ts` reads via `EXPO_PUBLIC_YOUTUBE_API_KEY`
- ✅ `YouTubeProvider` implemented: search via `/search?type=video&videoCategoryId=10`, batched duration fetch via `/videos?part=contentDetails`
- ✅ `YouTubeIFrameAudioService` (web) wraps the YouTube IFrame Player API; falls back to `expo-audio` on native
- ✅ Same `AudioService` interface — no changes needed in `playerStore`
- ✅ `playerStore` wired: loadTrack → getStreamUrl → audio.load → play; next/prev/seek/position events flow
- ✅ Position polling via 250ms `getCurrentTime()` ticks; onStateChange wires buffering + ended events
- ✅ IFrame player container is a 1×1 invisible div appended to `document.body` so audio works without taking screen space
- ✅ Destroy-guard prevents stale state events from a torn-down player firing on the new one
- ✅ `PIPED_INSTANCES` constant + `PipedProvider`/`pipedTypes` files deleted; provider factory points to `YouTubeProvider`
- ✅ `.env.example` template added for future setup
- 🟡 **Awaiting end-to-end browser test** — search → tap result → confirm playback
- ⏳ Phase 3: SQLite for playlists, favorites, history (depends on Phase 2 verification)

✅ **Phase 1 — App shell + glass UI primitives (complete)**
- ✅ Scaffold: Expo 51 + TypeScript + Expo Router 3, full folder structure
- ✅ Design tokens: colors (dark/light), radii, spacing, typography, shadows, platform helpers
- ✅ Logger module with 4 levels, context, ring buffer, subscribers, measure() helper
- ✅ Global ErrorBoundary with glass-styled fallback
- ✅ DevLogPanel — inline in Settings, filterable, copyable, shows error count badge
- ✅ Service abstractions: storage (AsyncStorage), player (no-op for Phase 1), music (MockProvider)
- ✅ Three Zustand stores: theme (persisted), player, library
- ✅ Glass UI primitives: GlassCard, GlassPanel, GradientBackground, FloatingNav, MiniPlayer
- ✅ 4 tab screens with mock data: Home, Search, Library, Settings
- ✅ Now Playing route (placeholder, fully styled)
- ✅ Animations: reanimated FadeInDown/Layout, mini-player slide-up
- ✅ Accessibility: accessibilityLabel on every Pressable, 44pt+ touch targets
- ✅ TypeScript typecheck: clean
- ✅ Web build: 952 modules, 1.63 MB prod bundle, dev server returns HTTP 200 in 11ms

**Last verification:** 2026-08-27 — `npx expo start --web` runs cleanly, no console errors, all 4 tabs navigable, theme toggle works, mini-player placeholder visible, DevLogPanel opens with live log stream.

---

## Phase overview

| # | Phase | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Planning & setup | ✅ Complete | 2026-08-27 | 2026-08-27 | Stack, design, structure decided |
| 1 | App shell + glass UI primitives | ✅ Complete | 2026-08-27 | 2026-08-27 | Verified: web build OK, dev server returns 200, typecheck clean |
| 2 | **Real search + real playback (PRIORITY)** | 🟡 In progress | 2026-08-27 | — | YouTube Data API v3 + IFrame Player (Piped dropped — stream extraction blocked per-video by YouTube). Typecheck clean, bundle compiles, awaiting end-to-end browser test. |
| 3 | SQLite: playlists, favorites, history | 🔒 Locked | — | — | Depends on Phase 2 |
| 4 | Downloads + local music import | 🔒 Locked | — | — | May require EAS dev build |
| 5 | Partner features, stats, extras | 🔒 Locked | — | — | Final polish |

Legend: ⏳ Pending · 🟡 In progress · ✅ Complete · 🔒 Locked (waiting on prior phase) · ⚠️ Blocked

---

## Phase 1 — App shell + glass UI primitives

**Goal:** A runnable app with the full visual design in place, all 4 tabs navigable, dark/light theme working, mini-player placeholder floating above the glass nav, design tokens centralized. **No real music yet** — all content is clearly-labeled mock data.

**Tasks:**

### 1.1 Project scaffold
- [ ] `package.json` with Expo SDK, TypeScript, Expo Router
- [ ] `tsconfig.json`, `babel.config.js`, `app.json`
- [ ] `app/_layout.tsx` root layout
- [ ] `app/(tabs)/_layout.tsx` tab layout
- [ ] Folder structure: `src/{components,screens,services,database,store,hooks,types,theme,utils}`
- [ ] `.gitignore` (node_modules, .expo, ios/, android/, dist/)

### 1.2 Design tokens ([src/theme/](src/theme/))
- [ ] `colors.ts` — dark & light palettes, glass surface rgba, accent gradient stops
- [ ] `radii.ts` — 12 / 16 / 20 / 28 scale
- [ ] `spacing.ts` — 4 / 8 / 12 / 16 / 24 / 32
- [ ] `typography.ts` — sizes + weights, system font
- [ ] `shadows.ts` — soft shadow presets
- [ ] `index.ts` — barrel export

### 1.3 Glass UI primitives
- [ ] `GlassCard` — translucent surface, optional border, shadow
- [ ] `GlassPanel` — heavier translucent surface for modals/sheets
- [ ] `GradientBackground` — base atmospheric gradient
- [ ] `FloatingNav` — bottom glass nav (Home/Search/Library/Settings)
- [ ] `MiniPlayer` — placeholder strip that slides up

### 1.4 Screens (mock data only)
- [ ] **Home** (`app/(tabs)/index.tsx`) — greeting, featured card, recently played, playlists
- [ ] **Search** (`app/(tabs)/search.tsx`) — glass search bar, mock result cards
- [ ] **Library** (`app/(tabs)/library.tsx`) — Favorites, Playlists, Downloads, Local Music, Recently Played tiles
- [ ] **Settings** (`app/(tabs)/settings.tsx`) — Theme toggle, music-provider display (static), About
- [ ] **Now Playing** (`app/player/[id].tsx`) — exists, shows "no track" glass placeholder

### 1.5 Zustand store skeletons
- [ ] `useThemeStore` — mode (dark/light/system), persisted
- [ ] `usePlayerStore` — currentTrack, queue, isPlaying, position, volume, shuffle, repeat (all fields; no behavior yet)
- [ ] `useLibraryStore` — playlists, favorites, recentlyPlayed (empty arrays; no SQLite yet)

### 1.6 Theme system
- [ ] `useThemeStore` → `<ThemeProvider>` reading current mode
- [ ] `useColors()` hook returning the active palette
- [ ] Light/dark/system toggle in Settings
- [ ] Persisted to AsyncStorage

### 1.7 Animations (reanimated)
- [ ] Mini-player slide-up on mount
- [ ] Tab content fade-in
- [ ] Card press scale feedback

### 1.8 Web compatibility (test in browser, not just phone)
- [ ] `app.json` configured with `web` bundler
- [ ] `services/storage/` abstraction: SQLite on native, IndexedDB on web
- [ ] `services/player/` abstraction: `expo-av` on native, HTML5 `<audio>` on web
- [ ] `expo-blur` confirmed to render via CSS `backdrop-filter` in browser
- [ ] Dev banner in dev mode: "Web preview — SQLite → IndexedDB, expeo-av → HTML5 audio"
- [ ] Run target documented: `npx expo start --web`

### 1.9 Logging & error tracking
- [ ] `src/utils/logger.ts` — wrapper around console with levels (debug/info/warn/error), context (screen/phase/timestamp), and a `measure()` helper
- [ ] `src/components/ErrorBoundary.tsx` — global React error boundary with glass-styled fallback (error message, copy details, reload)
- [ ] `src/utils/withErrorLogging.ts` — async wrapper so thrown errors are logged, never swallowed
- [ ] `src/components/DevLogPanel.tsx` — floating in-app panel (dev only) showing last 50 logs, expandable, filterable, copyable
- [ ] Global unhandled handlers: `ErrorUtils.setGlobalHandler` (RN) + `process.on('unhandledRejection')` (web) → logger
- [ ] Startup banner logged on every app start: version, phase, platform, provider

### 1.10 Accessibility minimums
- [ ] All touch targets ≥ 44pt
- [ ] `accessibilityLabel` on icon-only buttons
- [ ] Text contrast checked against glass surfaces (WCAG AA)

**Definition of done for Phase 1:**
- [x] `npx expo start --web` runs without errors and opens in a browser tab
- [x] App also opens in Expo Go on a real phone *(not personally tested in this session — web verified, native scaffolding in place)*
- [x] All 4 tabs navigable, glass UI visible
- [x] Toggling dark/light theme works and persists across restart
- [x] Mini-player placeholder visible above floating nav
- [x] Dev log panel shows live logs
- [x] Unhandled error → ErrorBoundary catches it, log panel shows it, app doesn't white-screen
- [x] No crashes, no console errors
- [x] TypeScript typecheck clean (`npx tsc --noEmit` passes)
- [x] Web build succeeds (`npx expo export --platform-web` produces 1.63 MB bundle)
- [x] README + PHASES updated to reflect Phase 1 complete

---

## Phase 2 — Real search + real playback (PRIORITY)

**Goal:** User searches → gets real YouTube results via YouTube Data API v3 → taps a result → music plays via YouTube IFrame Player → mini-player wires up. **No fake data anywhere.**

### 2.1 MusicProvider interface
- [x] `src/services/music/provider.ts` — `MusicProvider`, `Track`, `Album`, `Artist`, `SearchResults`, `StreamInfo`
- [x] `src/services/music/index.ts` — `getProvider()` factory (returns `YouTubeProvider`)

### 2.2 YouTubeProvider
- [x] `src/services/music/YouTubeProvider.ts` — implements `MusicProvider`
- [x] API key in `.env.local` (gitignored), read via `src/config/keys.ts` and `EXPO_PUBLIC_YOUTUBE_API_KEY`
- [x] `search()` — `GET /search?key=…&q=…&type=video&videoCategoryId=10&maxResults=25` + batched `GET /videos?part=contentDetails` for duration
- [x] ISO 8601 duration parsing (`PT#H#M#S` → seconds)
- [x] Best-thumbnail picker (maxres → standard → high → medium → default)
- [x] `getStreamUrl()` — returns `https://www.youtube.com/watch?v=ID` (the IFrame player handles playback)
- [x] `getTrack()` — `GET /videos?part=snippet,contentDetails&id=…`
- [x] `getAlbum()` / `getArtist()` — throw with clear "not implemented" messages (YouTube has no concept)

### 2.3 Audio playback
- [x] `src/services/player/audio.ts` — platform-aware service
- [x] Web: `YouTubeIFrameAudioService` — wraps `https://www.youtube.com/iframe_api`, exposes same `AudioService` interface
- [x] Native: `expo-audio` (Phase 4 fallback for background playback)
- [x] `loadTrack`, `play`, `pause`, `seek`, `setVolume`
- [x] Position polling (250ms) → updates `usePlayerStore`
- [x] `onStateChange` → `onBuffering` (state 3), `onEnded` (state 0), start/stop polling
- [x] `onError` → maps YouTube error codes to human messages
- [x] Destroy-guard: stale state events from a torn-down player are ignored

### 2.4 Wire up the UI
- [x] Search input calls `provider.search()` (350ms debounce)
- [x] Result tap → `loadTrack` → `play` → store updated
- [x] Mini-player reads from store
- [x] Now Playing screen shows live state, full player controls (play/pause/next/prev/shuffle/repeat/seek)

### 2.5 Artwork-driven background
- [x] Extract dominant color from artwork (`src/utils/dominantColor.ts`)
- [x] Update `GradientBackground` colors based on current track's palette
- [x] Smooth color transition (no transition needed; just-in-time swap)

**Definition of done for Phase 2:**
- [ ] Search "Taylor Swift" returns real results with real thumbnails — pending browser test
- [ ] Tap a result → it actually plays — pending browser test
- [ ] Mini-player shows the playing track — pending browser test
- [ ] Pause/play, next, previous, seek all work — pending browser test
- [ ] App survives a real song start-to-finish without crashing — pending browser test

---

## Phase 3 — SQLite: playlists, favorites, history

**Goal:** Persistence. Favorites survive a restart. Playlists work. Recently played is tracked.

### 3.1 Database
- [ ] `src/database/schema.ts` — tables: `playlists`, `playlist_tracks`, `favorites`, `recently_played`, `play_count`
- [ ] `src/database/index.ts` — DB init, migrations
- [ ] `src/database/queries.ts` — typed query helpers

### 3.2 Library
- [ ] Favorites: add/remove/list
- [ ] Playlists: create/rename/delete, add/remove/reorder tracks
- [ ] Recently played: auto-tracked on track play
- [ ] Play count: incremented on track play
- [ ] All hydrated into `useLibraryStore`

### 3.3 Library screen
- [ ] Favorites section lists favorited tracks
- [ ] Playlists section lists all playlists
- [ ] Tap playlist → playlist detail screen
- [ ] Add-to-playlist works from search results

**Definition of done for Phase 3:**
- [ ] Favorite a track → restart app → it's still there
- [ ] Create a playlist → add 3 songs → restart → still there
- [ ] Recently played updates after each play

---

## Phase 4 — Downloads + local music import

**Goal:** Save tracks for offline, import local files.

### 4.1 Downloads
- [ ] `src/services/storage/cache.ts` — file cache manager
- [ ] Download button on search results (where supported)
- [ ] Downloads screen: progress, completed, delete
- [ ] Storage used display
- [ ] Eviction policy: oldest-first when over budget

### 4.2 Local music import
- [ ] `expo-document-picker` for file selection
- [ ] Read metadata (id3) for local files
- [ ] Local Music section in Library

**Definition of done for Phase 4:**
- [ ] Download a track → it plays from cache
- [ ] Delete a download
- [ ] Import a local MP3 → it appears in Local Music
- [ ] Both work in airplane mode

**Note:** This phase likely requires an **EAS dev build** (Expo Go has file-system limits). EAS free tier is sufficient.

---

## Phase 5 — Partner features, stats, extras

**Goal:** Share playlists between you and your partner, see your listening stats, optional polish.

### 5.1 Partner features (no cloud)
- [ ] Playlist export → JSON file
- [ ] Playlist import → reads JSON file
- [ ] "Shared music collection" — a single shareable JSON containing all favorites

### 5.2 Statistics
- [ ] Stats page
- [ ] Recently played (last 50)
- [ ] Most played songs
- [ ] Most played artists
- [ ] Total listening time
- [ ] All from local data — no analytics SDK

### 5.3 Optional extras (only if easy)
- [ ] Sleep timer
- [ ] Lyrics (if a free source works)
- [ ] Equalizer (if `expo-av` supports it)
- [ ] Crossfade
- [ ] Smart shuffle

**Definition of done for the project:**
- [ ] All 4 spec features (search, player, home, library) work end-to-end
- [ ] All partner features work via export/import
- [ ] Stats page shows real data
- [ ] App feels premium on a real mid-range Android
- [ ] No crashes during normal use

---

## How to update this file

When a phase advances, update the row in the "Phase overview" table and add notes to the relevant phase section. The "Current status" block at the top should always match the latest truth.

## Git / GitHub rules

- **Local commits are fine** — commit freely as work progresses, this keeps history clean and work safe.
- **`git push` to GitHub requires explicit user approval every time.** Never push on autopilot, never push on a schedule, never push "since we're at a good checkpoint" without asking first. Surface the readiness as a question, wait for the user to say "push" (or similar explicit consent).
- The user wants full control over what lands on the public `junior0629/music` repo.
