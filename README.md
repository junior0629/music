# Music — Personal Music App

A personal music application for two people (you and your partner), inspired by Spotify, with a premium **glassmorphism** interface. Built with React Native + Expo, runnable entirely on **free tools and services with a $0 budget**.

> **Repository:** https://github.com/junior0629/music.git
> **Status:** Phase 1 complete (UI shell, glass design, mock data, logging). Phase 2 next. See [PHASES.md](./PHASES.md).

---

## Why this app exists

You want a personal music app that's:
- **Real** — searches the internet for actual music (no demo data, no fake APIs).
- **Simple** — maintainable by one person.
- **Free** — $0 to build, $0 to run.
- **Beautiful** — premium frosted-glass UI, not a Spotify clone.
- **For two** — you and your partner, no need for cloud infra, accounts, or scale.

---

## What it does (target feature set)

### Core
- **Online music search** — real-time, with thumbnail / title / artist / duration / play / add-to-playlist / favorite / download.
- **Full music player** — play, pause, previous, next, seek, volume, shuffle, repeat, queue, background playback.
- **Mini-player** — persistent at the bottom, glass-styled.
- **Home** — greeting, recently played, playlists, favorites.
- **Search** — dedicated screen, returns songs, artists, albums, videos.
- **Library** — favorites, playlists, downloads, local music, recently played.
- **Playlists** — create / rename / delete / add / remove / reorder / shuffle / play.
- **Favorites** — favorite/unfavorite, persisted locally.
- **Downloads / Offline** — download where supported, manage storage, import local music files.
- **Music statistics** — recently played, most played, listening time.

### Nice-to-haves (only if easy)
- Sleep timer
- Lyrics
- Equalizer
- Crossfade
- Smart shuffle
- Recently added
- Mood playlists
- Dark / light mode
- Dynamic album-artwork background

### Partner features (kept simple, no cloud)
- Shared playlists (via export / import — JSON files)
- Shared music collection
- Playlist export / import

---

## Visual direction — Glassmorphism

Premium frosted-glass aesthetic. See the design brief for full details; key principles:

- Dark, atmospheric gradient background
- Background subtly shifts based on the currently playing album artwork (extracted dominant colors → blurred gradient)
- Frosted glass panels with `rgba()` transparency, backdrop blur, soft borders, soft shadows, large rounded corners
- Floating glass cards for playlists, search results, recommendations
- Floating glass bottom navigation (not a solid tab bar)
- Full-screen blurred album artwork on the Now Playing screen
- Soft purple / blue / pink accent gradients
- Subtle animations: fade/slide, gentle scale on artwork, smooth play-button transitions

**Performance constraint:** Blur is expensive on mid-range Android. We use real `BlurView` only where it pays off (player screen, floating nav, mini-player). For cards in scrollable lists, we use translucent solids with a subtle gradient overlay — visually similar, ~5× cheaper to render.

---

## Technology

### Confirmed
| Layer | Choice | Why |
|---|---|---|
| Framework | **React Native + Expo (managed)** | Easiest free cross-platform, official blur/gradient/haptics modules |
| Language | **TypeScript** | Type safety on the `MusicProvider` interface matters |
| Navigation | **Expo Router** | File-based, official, supports the spec's folder structure |
| State | **Zustand** | Lightweight, perfect for a 2-user app — 3 stores total (player, library, theme) |
| Local DB | **expo-sqlite** | Playlists, favorites, history persist across restarts |
| Key-value | **AsyncStorage** | Theme preference, volume, last track |
| Audio | **expo-av** | Sufficient for Phase 1–3. Upgrade candidate: `react-native-track-player` for background playback (Phase 4+) |
| Animations | **react-native-reanimated** | Standard for RN, works with Expo |
| Blur | **expo-blur** | Cross-platform BlurView |
| Gradients | **expo-linear-gradient** | Backgrounds, accent gradients |
| Haptics | **expo-haptics** | Premium feel on play/pause, favorite |

### Music source
- **Primary:** [Piped](https://github.com/TeamPiped/Piped) public REST API — calls YouTube under the hood, returns real stream URLs, **no API key, no server, $0**.
- **Swap-ready:** all music calls go through a `MusicProvider` interface (see [Architecture](#architecture)). Swapping to yt-dlp-via-proxy, Jamendo, Deezer, or anything else is a one-file change.

> **Honest caveat:** YouTube streaming via Piped sits in a legal gray area. For two personal users the risk is minimal, but it's on the record here so we can revisit the choice if it ever becomes a concern.

---

## Architecture

The whole app talks to music through one interface. Everything else is independent.

```
MusicProvider (interface)
├── search(query, opts?)          → SearchResults
├── getTrack(id)                  → Track
├── getAlbum(id)                  → Album
├── getArtist(id)                 → Artist
└── getStreamUrl(trackId)         → StreamInfo
```

**Phase 1 implementation:** `PipedProvider` (calls public Piped instances).
**Phase 5 alternative:** A self-hosted yt-dlp proxy, or Jamendo, or Deezer previews.

### Project structure
```
music/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home
│   │   ├── search.tsx
│   │   ├── library.tsx
│   │   └── settings.tsx
│   ├── player/[id].tsx           # Full-screen Now Playing
│   ├── playlist/[id].tsx
│   └── _layout.tsx               # Root layout
├── src/
│   ├── components/               # MiniPlayer, GlassCard, TrackRow, FloatingNav, ...
│   ├── screens/                  # Screen logic if not in app/
│   ├── services/
│   │   ├── music/                # MusicProvider abstraction
│   │   │   ├── types.ts          # MusicProvider interface
│   │   │   ├── PipedProvider.ts  # YouTube via Piped
│   │   │   └── index.ts          # getProvider()
│   │   ├── player/               # expo-av wrapper
│   │   └── storage/              # File cache, downloads
│   ├── database/                 # SQLite setup + migrations
│   ├── store/                    # Zustand stores
│   │   ├── playerStore.ts
│   │   ├── libraryStore.ts
│   │   └── themeStore.ts
│   ├── hooks/
│   ├── types/
│   ├── theme/                    # Design tokens (colors, radii, spacing)
│   └── utils/
├── assets/                       # App icon, splash, fonts (if any)
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
└── PHASES.md                     # Phase tracker — see this for current status
```

---

## Phased delivery

The work is split into 5 phases. **Phase 1 first, Phase 2 is the priority** (real search + real playback). We do not move to the next phase until the previous one runs cleanly. See **[PHASES.md](./PHASES.md)** for the live tracker.

| Phase | Goal | Status |
|---|---|---|
| 1 | App shell: navigation, Home/Search/Library/Settings, glass UI primitives, mini-player placeholder, dark/light theme, design tokens, Zustand store skeletons | ✅ Complete |
| 2 | `MusicProvider` interface + `PipedProvider` + real search + real playback + mini-player wired to player store | ⏳ Next |
| 3 | SQLite: playlists CRUD, favorites, recently played, queue persistence | 🔒 Waiting on Phase 2 |
| 4 | Downloads (file cache), local music import, storage management | 🔒 Waiting on Phase 3 |
| 5 | Partner features (export/import as JSON), stats page, sleep timer, optional lyrics/equalizer/crossfade | 🔒 Waiting on Phase 4 |

---

## Development principles (so this stays simple to maintain)

1. **No fake data, ever.** Mock UI in Phase 1 is clearly labeled as mock in code comments. By Phase 2, every result is from a real source.
2. **Provider behind an interface.** All music logic is one swappable class. Nothing else in the app calls Piped/YouTube directly.
3. **Design tokens in one place.** [src/theme/](src/theme/) holds all colors, radii, spacing, typography. No hex codes scattered through components.
4. **Three Zustand stores, no more.** Player, library, theme. Avoid sprawling state.
5. **Translucent solids over blur where blur isn't needed.** Mid-range Android perf matters.
6. **Test on a real low-end Android early.** Especially during Phase 1's glassmorphism work.
7. **Stop at the end of each phase.** Build, run, confirm, then move on.

---

## $0 budget — what we're relying on

- **Expo** — free SDK, free dev builds via EAS (limited free tier)
- **Piped public instances** — community-run, free, no key
- **SQLite** — local, free
- **No hosting, no paid DB, no paid auth, no analytics, no push, no payments**
- If a free-tier limit appears, the spec is small enough we can self-host one tiny service (Render free tier) — but we are not building that until we hit a wall.

---

## Legal notes

- YouTube streaming via Piped is in a legal gray area. Acceptable for two personal users; not for distribution. Documented, not ignored.
- The spec is small enough that we can swap providers later if needed (the `MusicProvider` interface exists for this reason).

---

## How to run

The Phase 1 build is ready to run. From the project root:

```bash
npm install            # only needed the first time, or after dependency changes
npx expo start --web   # browser test target (primary — opens a tab with hot reload)
npx expo start         # phone test target via Expo Go (scan the QR code)
```

**Web is the primary test target** for UI, theme, navigation, mock data, and (Phase 2+) real search and playback. Phone (Expo Go) is reserved for native-only features: haptics feel, background audio, real touch performance, mid-range Android glass perf, and anything else the browser genuinely can't do.

**What's working right now (Phase 1):**
- All 4 tabs (Home, Search, Library, Settings) navigable
- Glassmorphism UI: frosted glass surfaces, floating nav, mini-player placeholder
- Dark / light / system theme toggle, persisted across restarts
- Mock music data (8 tracks, clearly labeled as mock — real data comes in Phase 2)
- Search debounced, favorites toggle (in-memory until Phase 3)
- Dev log panel (top-left floating button in dev mode) — tap to see live logs, errors
- Global error boundary — any uncaught render error shows a glass-styled fallback, no white screen

**What's NOT working yet (intentional, comes in later phases):**
- Real music search and playback (Phase 2)
- Playlists persist across restart (Phase 3 — SQLite)
- Downloads and local file import (Phase 4)
- Partner features, stats page (Phase 5)

By Phase 4 (downloads + background audio) we'll need an **EAS dev build**, which is also free but requires an Expo account. See [PHASES.md](./PHASES.md) for the full phase tracker.

## Testing on web vs. phone — quick reference

| What | Web (`--web`) | Phone (Expo Go) |
|---|---|---|
| UI, theme, navigation, mock data | ✅ | ✅ |
| Real music search (Phase 2) | ✅ | ✅ |
| Real playback (Phase 2) | ✅ via HTML5 audio | ✅ via expo-av |
| SQLite (Phase 3) | ⚠️ IndexedDB fallback | ✅ |
| Downloads (Phase 4) | ⚠️ limited | ✅ |
| Background audio | ❌ | ✅ (dev build) |
| Haptics | ❌ silent | ✅ |

Storage and audio are abstracted behind platform-detecting service modules, so the rest of the app doesn't care which runtime it's on.
