# Phase Tracker

> **Single source of truth for "where are we."** I update this as we move through each phase. Don't trust anything else for current status.

**Project:** Personal music app for two people
**Repo:** https://github.com/junior0629/music.git
**Last updated:** 2026-08-28 (Phase 2 wrapping, Phase 3 unblocked)

---

## Current status

✅ **Phase 2 — Real search + real playback via YouTube (complete)**
- ✅ YouTube Data API v3 key obtained + stored in `.env.local` (gitignored)
- ✅ `YouTubeProvider`: search via `/search?type=video&videoCategoryId=10`, batched metadata fetch via `/videos?part=contentDetails,status`
- ✅ Filters out `status.embeddable === false` videos (owner-restricted)
- ✅ `YouTubeIFrameAudioService` (web) + `expo-audio` fallback (native)
- ✅ IFrame container is 480×270 with `transform: translateY(120%)` to satisfy Chrome's autoplay visibility check
- ✅ Buffering watchdog (8s) surfaces "stuck buffering" error
- ✅ Auto-continue after first user gesture; destroy-guard for torn-down players
- ✅ **Lyrics integration** via LRClib: `/api/get` direct lookup, `/api/search` fallback for re-uploaded tracks, scored match (title similarity + artist token hit + duration penalty)
- ✅ **Smooth-scroll lyric view** (reanimated withTiming, Apple Music-style vertical slide)
- ✅ **Tap-to-seek on lyric lines** + **drag-to-seek on progress bar** (GestureDetector / Pan worklet)
- ✅ **Pre-vocal period** (no highlighted line before the first LRC timestamp) — fixes "lyrics show before singer starts"
- ✅ **Mini-player play/pause button** + isPlaying state desync fix (IFrame now reports PLAYING/PAUSED back to the store via `onPlayingChange`)
- ✅ NowPlaying screen: spinning circular art on the left, lyrics on the right, blurred album-art background, white transport controls, heart icon above seek bar
- ✅ Typecheck clean
- ⚠️ Chrome: works only with no YouTube-blocking extensions. Edge recommended.
- 🟡 Phase 3 next: SQLite for playlists, favorites, history

✅ **Phase 1 — App shell + glass UI primitives (complete)**
- ✅ Expo 51 + TypeScript + Expo Router 3, full folder structure
- ✅ Design tokens: colors (dark/light), radii, spacing, typography (Oswald), shadows
- ✅ Logger (4 levels, context, ring buffer, subscribers, measure())
- ✅ Global ErrorBoundary with glass-styled fallback
- ✅ DevLogPanel — inline in Settings, filterable, copyable
- ✅ Service abstractions: storage, player, music
- ✅ Three Zustand stores: theme (persisted), player, library
- ✅ Glass UI primitives: GlassCard, GlassPanel, GradientBackground, FloatingNav, MiniPlayer
- ✅ 4 tab screens with mock data: Home, Search, Library, Settings
- ✅ Animations: reanimated FadeInDown/Layout, mini-player slide-up

---

## Phase overview

| # | Phase | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| 0 | Planning & setup | ✅ Complete | 2026-08-27 | 2026-08-27 | Stack, design, structure decided |
| 1 | App shell + glass UI primitives | ✅ Complete | 2026-08-27 | 2026-08-27 | Web build OK, typecheck clean |
| 2 | **Real search + real playback** | ✅ Complete | 2026-08-27 | 2026-08-28 | YouTube Data API v3 + IFrame Player. Lyrics via LRClib. Edge verified. |
| 3 | SQLite: playlists, favorites, history | 🟡 Ready to start | — | — | Next up. Depends on Phase 2. |
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
- [x] `search()` — `GET /search?key=…&q=…&type=video&videoCategoryId=10&maxResults=25` + batched `GET /videos?part=contentDetails,status` for duration AND embeddable check
- [x] Filter out videos with `status.embeddable === false` (owner-blocked embeds — IFrame would silently fail)
- [x] ISO 8601 duration parsing (`PT#H#M#S` → seconds)
- [x] Best-thumbnail picker (maxres → standard → high → medium → default)
- [x] `getStreamUrl()` — returns `https://www.youtube.com/watch?v=ID` (the IFrame player handles playback)
- [x] `getTrack()` — `GET /videos?part=snippet,contentDetails,status&id=…` (rejects non-embeddable)
- [x] `getAlbum()` / `getArtist()` — throw with clear "not implemented" messages (YouTube has no concept)

### 2.3 Audio playback
- [x] `src/services/player/audio.ts` — platform-aware service
- [x] Web: `YouTubeIFrameAudioService` — wraps `https://www.youtube.com/iframe_api`, exposes same `AudioService` interface
- [x] Native: `expo-audio` (Phase 4 fallback for background playback)
- [x] `loadTrack`, `play`, `pause`, `seek`, `setVolume`
- [x] Position polling (250ms) → updates `usePlayerStore`
- [x] `onStateChange` → `onBuffering` (state 3), `onEnded` (state 0), start/stop polling
- [x] `onError` → maps YouTube error codes to human messages
- [x] Buffering watchdog: 8s in BUFFERING → "stuck buffering" error (region/age/embed block)
- [x] Auto-continue after first play: subsequent loads auto-play because the iframe is now trusted
- [x] Destroy-guard: stale state events from a torn-down player are ignored
- [x] Play-while-loading queue: tap play during track load → fires when onReady arrives

### 2.4 Wire up the UI
- [x] Search input calls `provider.search()` (350ms debounce)
- [x] Result tap → `loadTrack` → navigate to Now Playing
- [x] User taps play button on Now Playing → fresh user gesture → playback starts
- [x] Mini-player reads from store
- [x] Now Playing screen shows live state, full player controls (play/pause/next/prev/shuffle/repeat/seek)

### 2.5 Artwork-driven background
- [x] Extract dominant color from artwork (`src/utils/dominantColor.ts`)
- [x] Update `GradientBackground` colors based on current track's palette
- [x] Smooth color transition (no transition needed; just-in-time swap)

### 2.6 Now Playing screen
- [x] Blurred album-art background (web uses CSS blur; native uses BlurView)
- [x] Spinning circular artwork on the left (only animates while playing)
- [x] Lyrics column on the right with smooth vertical scroll (reanimated withTiming)
- [x] Tap-to-seek on lyric lines (synced LRC only)
- [x] Drag-to-seek on progress bar (GestureDetector / Pan worklet)
- [x] White text + heart icon above seek bar + large white play button
- [x] Mini-player play/pause button (so pause is reachable without opening the full player)
- [x] `isPlaying` state stays in sync with the IFrame via `onPlayingChange` (auto-play tracks now show ⏸, not ▶)

### 2.7 Real-time lyrics (LRClib)
- [x] `src/services/lyrics/lyrics.ts` — fetch from `https://lrclib.net/api/get`, fall back to `/api/search` for re-uploaded tracks
- [x] Score each search candidate by title similarity + artist-token overlap + duration proximity; reject bad matches
- [x] LRC parser: handles `[mm:ss.xx]`, `[mm:ss]`, single-digit minutes, multi-timestamp lines, skips header tags
- [x] Pre-vocal period: no line highlighted before the first LRC timestamp (fixes "lyrics show before singer starts")
- [x] Cached per-track for the session (no re-fetch on re-entering NowPlaying)
- [x] 10s timeout, AbortController for track changes
- [x] Lyrics font matches app (Oswald)

**Definition of done for Phase 2:**
- [x] Search "Taylor Swift" returns real results with real thumbnails — verified in Edge
- [x] Tap a result → it actually plays — verified in Edge
- [x] Mini-player shows the playing track + has play/pause — verified
- [x] Pause/play, next, previous, seek (tap and drag) all work — verified
- [x] Real-time synced lyrics (LRClib) display one line at a time with smooth scroll — verified
- [x] App survives a real song start-to-finish without crashing — verified
- ⚠️ Chrome: blocked by YouTube-blocking extensions (ad-blockers). Edge works. Phase 4 native build avoids this entirely.

---

## Phase 3 — SQLite: playlists, favorites, history

**Goal:** Persistence. Favorites survive a restart. Playlists work. Recently played is tracked.

### 3.1 Database layer
- [ ] `src/database/schema.ts` — table types: `playlists` (id, name, created_at), `playlist_tracks` (playlist_id, track_id, position), `favorites` (track_id, added_at), `recently_played` (track_id, played_at), `play_count` (track_id, count, last_played_at)
- [ ] `src/database/index.ts` — DB init + versioned migrations
  - [ ] Native: `expo-sqlite` (`openDatabaseAsync`, `execAsync`)
  - [ ] Web: IndexedDB via the existing `services/storage` abstraction
  - [ ] Single `getDb()` returns a uniform `Db` interface regardless of platform
- [ ] `src/database/queries.ts` — typed query helpers
  - [ ] `addFavorite(track)`, `removeFavorite(trackId)`, `listFavorites()`
  - [ ] `createPlaylist(name)`, `renamePlaylist(id, name)`, `deletePlaylist(id)`
  - [ ] `addTrackToPlaylist(playlistId, track, position?)`, `removeTrackFromPlaylist(...)`, `reorderPlaylist(...)`
  - [ ] `recordPlay(track)`, `recentlyPlayed(limit=50)`, `topPlayed(limit=20)`, `topArtists(limit=10)`
- [ ] Hydrate `useLibraryStore` on app boot (in `app/_layout.tsx` or `src/store/libraryStore.ts`) — async load from DB → set state, don't block first render

### 3.2 Library logic
- [ ] Favorites: hook the existing heart icon on search results and Now Playing through DB on web; keep UI identical
- [ ] Playlists CRUD: create / rename / delete via modal or inline sheet; names up to ~40 chars
- [ ] Playlists: add / remove tracks from search result overflow menu (⋯)
- [ ] Playlists: reorder tracks via long-press drag in playlist detail
- [ ] Recently played: auto-track on every `play()` call in `playerStore`; keep last 50
- [ ] Play count: increment on every play via cheap UPSERT in `play_count`

### 3.3 Library screen
- [ ] Favorites section lists favorited tracks from `useLibraryStore.favorites`; tappable to play
- [ ] Playlists section lists all playlists; tile per playlist with cover mosaic (first 4 track thumbs)
- [ ] Tap playlist → new route `app/library/playlist/[id].tsx` (playlist detail)
- [ ] "Add to playlist" works from search results via overflow menu → sheet
- [ ] Recently Played section on Home wired to real data (not mock)
- [ ] Downloads tile + Local Music tile stay as placeholders until Phase 4

**Definition of done for Phase 3:**
- [ ] Favorite a track → restart app → it's still there
- [ ] Create a playlist → add 3 songs → restart → still there
- [ ] Recently played updates after each play
- [ ] Reorder tracks in a playlist (drag to move)
- [ ] All five tables populated correctly; manual DB inspect shows sensible rows
- [ ] Web and native both pass the above (no platform-specific bugs)

---

## Phase 4 — Downloads + local music import

**Goal:** Save tracks for offline, import local files. Both work in airplane mode.

### 4.1 File cache + downloads
- [ ] `src/services/storage/cache.ts` — file cache manager (path, size, mtime, eviction)
- [ ] Download button on search results (where supported by the underlying source)
- [ ] Downloads screen: list of in-progress, completed, failed; per-row progress + delete
- [ ] Storage-used display (MB / budget)
- [ ] Eviction policy: oldest-first when over a configurable budget
- [ ] Downloaded tracks play from cache, not from the network

### 4.2 Local music import
- [ ] `expo-document-picker` for file selection (MP3, M4A, FLAC)
- [ ] Read metadata (id3 / MP4 tags) for title, artist, album, duration, artwork
- [ ] Local Music section in Library lists imported tracks
- [ ] Local tracks are playable end-to-end (play, pause, seek, mini-player, NowPlaying)

### 4.3 Native build
- [ ] **EAS dev build** (Expo Go has file-system limits)
- [ ] Verify `expo-sqlite`, `expo-file-system`, `expo-document-picker` all work on a real Android build
- [ ] EAS free tier is sufficient — no paid plan needed

**Definition of done for Phase 4:**
- [ ] Download a track → it plays from cache
- [ ] Delete a download
- [ ] Import a local MP3 → it appears in Local Music and plays
- [ ] Both downloads and local music work in airplane mode
- [ ] EAS dev build installs on a real Android device and passes the above

---

## Phase 5 — Partner features, stats, extras

**Goal:** Share playlists between you and your partner, see your listening stats, optional polish. All data stays local.

### 5.1 Partner features (no cloud)
- [ ] Playlist export → JSON file (share via OS share sheet)
- [ ] Playlist import → reads a JSON file, validates schema, dedupes by track id
- [ ] "Shared music collection" — a single shareable JSON containing all favorites + playlists
- [ ] Round-trip test: export on device A → import on device B → identical library

### 5.2 Statistics (all from local DB)
- [ ] Stats page (`app/stats.tsx` or a tab)
- [ ] Recently played (last 50) — list view
- [ ] Most played songs — top 20
- [ ] Most played artists — top 10 (aggregated from `play_count`)
- [ ] Total listening time — sum of `play_count × track.duration` (or session-tracked time, whichever is more accurate)
- [ ] No analytics SDK; no network calls

### 5.3 Optional extras (only if easy)
- [ ] Sleep timer (fade-out or hard stop after N minutes)
- [ ] Lyrics: already in via Phase 2.7 ✅
- [ ] Equalizer (if `expo-audio` exposes one on native)
- [ ] Crossfade between tracks
- [ ] Smart shuffle (avoid repeating recent N tracks)

**Definition of done for the project:**
- [ ] All 4 spec features (search, player, home, library) work end-to-end
- [ ] All partner features work via export/import
- [ ] Stats page shows real data from the local DB
- [ ] App feels premium on a real mid-range Android
- [ ] No crashes during normal use

---

## How to update this file

When a phase advances, update the row in the "Phase overview" table and add notes to the relevant phase section. The "Current status" block at the top should always match the latest truth.

## Git / GitHub rules

- **Local commits are fine** — commit freely as work progresses, this keeps history clean and work safe.
- **`git push` to GitHub requires explicit user approval every time.** Never push on autopilot, never push on a schedule, never push "since we're at a good checkpoint" without asking first. Surface the readiness as a question, wait for the user to say "push" (or similar explicit consent).
- The user wants full control over what lands on the public `junior0629/music` repo.
