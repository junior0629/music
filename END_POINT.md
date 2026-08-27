# END POINT — Project Handoff

> **Read this first when continuing the project on another machine.**
> This file is the source of truth for "where did we stop."

**Last updated:** 2026-08-27
**Project:** Personal music app for two (you + your partner)
**Repo:** https://github.com/junior0629/music.git
**Local path on office machine:** `c:\Users\User\music_player`

---

## 🚨 CRITICAL FIRST STEP for the home machine

1. **Read this entire file before doing anything else.**
2. **Do not** start a new project, scaffold, or rewrite. The project exists and is mostly built.
3. **Do not** run `git push` without explicit permission (see "Git rules" below).
4. Inspect the current project state and compare it against "CURRENT PROJECT STATE" below — the file in front of you on the home machine may already be further along than this snapshot.

---

## CURRENT DEVELOPMENT POINT

### ✅ Completed (committed to git on `main`)

| Commit | What |
|---|---|
| `389a555` | Initial docs: `README.md`, `PHASES.md`, GitHub repo initialized |
| `0a08982` | Web-compat + logging plan documented in PHASES.md, pushed to GitHub |

### ✅ Completed (built, in working tree, **not yet committed**)

**Phase 1 — App shell + glass UI (everything in `app/` and `src/`):**

- Expo 51 + TypeScript + Expo Router 3 scaffold
- Design tokens: dark/light palettes, radii, spacing, typography, shadows
- Logger (4 levels, ring buffer, subscribers, `measure()` helper)
- Global `ErrorBoundary` with glass-styled fallback
- `DevLogSection` (in Settings tab, not floating) — palette-aware text
- Service abstractions: `storage` (AsyncStorage), `player` (no-op), `music` (MockProvider)
- Three Zustand stores: `themeStore` (persisted), `playerStore`, `libraryStore`
- Glass UI primitives: `GlassCard`, `GlassPanel`, `GradientBackground`, `FloatingNav`, `MiniPlayer`
- 4 tab screens with mock data: Home, Search, Library, Settings
- Now Playing route (`app/player/[id].tsx`) — fully styled, no audio yet
- Playlist route placeholder (`app/playlist/[id].tsx`)
- Reanimated animations (FadeInDown, Layout, mini-player slide-up)
- `accessibilityLabel` on every `Pressable`, 44pt+ touch targets

**User-requested UI tweaks (all applied, not yet committed):**

- Back button moved to **upper right** with `←` glyph
- DevLog moved from floating overlay to **inline section in Settings tab**
- Background gradient changed to **medium light purple** (`#C4B5FD → #A78BFA`); default theme mode is now `'light'` (was `'system'`)
- **Oswald** font applied across the app via Google Fonts `@import` in a web-only global stylesheet (`src/theme/global.css.ts`)

### 🔨 Currently working on

**Nothing in progress.** The Phase 1 work is functionally complete and ready for the user to test. The user wanted to test the new look (light purple + Oswald + back button + dev log in Settings) before deciding on next steps.

The dev server is **currently running** in the background on this office machine on **port 8082** (port 8081 is held by a stale instance from earlier verification — it has the same code but is older; use 8082 for the live build). On the home machine, you'll start fresh.

### ⏭️ Next task

**Phase 2 — Real search + real playback (PRIORITY per spec).** Specifically:

1. Implement `PipedProvider` in `src/services/music/PipedProvider.ts` — calls public Piped REST API instances for YouTube-sourced tracks
2. Implement real `AudioService` in `src/services/player/audio.ts`:
   - Native: `expo-av`
   - Web: HTML5 `<audio>` element
3. Wire `SearchScreen` to call `provider.search()` (already wired; just needs real results)
4. Wire `NowPlayingScreen` controls to actually play/pause/seek
5. Add dominant-color extraction from artwork → drives `GradientBackground` colors

Before starting Phase 2, the user wants to **test the current state** in the browser and approve.

### 🐛 Known issues

- **First-load font flash on web**: Oswald is loaded via Google Fonts `@import`, so on first page load there's a brief moment where the system font is used before Oswald arrives. Once cached by the browser, subsequent loads are instant. If it bothers you, I can preconnect to fonts.googleapis.com.
- **Native font fallback**: On iOS/Android the system font is used because we haven't shipped the Oswald `.ttf` files in `assets/fonts/`. If you want Oswald on the phone too, drop the `.ttf` files in `assets/fonts/` and use `useFonts` from `expo-font` to load them.
- **Search debounce edge case**: Tapping a result during the 250ms debounce window loads a slightly older query. Not user-visible, just noting.
- **Stale dev server on port 8081**: Office machine has a leftover process listening on 8081 from the very first verification. Use 8082 on this machine. Won't apply to home machine.

### 📌 Important decisions already made

1. **Stack:** Expo 51 + TypeScript + Expo Router 3 + Zustand + `expo-sqlite` (Phase 3) + `expo-blur` + `expo-linear-gradient` + `react-native-reanimated` + `expo-haptics`. Don't add alternatives.
2. **Music source:** Piped (YouTube) as primary `MusicProvider`, behind a swappable interface. All app code calls `getProvider()`, never the concrete class. **YouTube streaming via Piped is in a legal gray area** — acceptable for two personal users but not for distribution. Documented in README.
3. **Web is the primary test target**, phone (Expo Go) is secondary. Both share the same React Native code via `react-native-web`. `npx expo start --web` for browser, `npx expo start` for phone.
4. **Service abstractions** with platform detection:
   - `services/storage/storage.ts` — AsyncStorage on both platforms (Phase 1). Phase 3 will add SQLite on native, IndexedDB on web.
   - `services/player/audio.ts` — no-op now. Phase 2 will add `expo-av` on native, HTML5 `<audio>` on web.
5. **No paid services.** No Sentry, no LogRocket, no Firebase, no analytics, no push, no payments. Logging is in-house. Bug tracking is the in-app `DevLogSection` in Settings.
6. **Glassmorphism performance discipline:** `BlurView` only where it actually blurs something visible behind it (player screen, floating nav, mini-player). For cards in scrollable lists, translucent solids + subtle gradient overlay — visually similar, ~5× cheaper to render.
7. **Three Zustand stores, no more:** `themeStore`, `playerStore`, `libraryStore`. Don't sprawl into per-screen stores.
8. **No fake data after Phase 1.** The `MockProvider` is clearly labeled, will be deleted in Phase 2 when `PipedProvider` lands.
9. **Path alias:** `@/*` maps to `./src/*`. Imports are `@/components/Foo`, not `@/src/components/Foo`. I made this mistake once already — `tsconfig.json` is correct, so the project typechecks, but the wrong import form would fail. Always use `@/foo/bar`.
10. **Oswald font weights in use:** display=600, title=600, heading=500, body=400, caption=400, label=500. If it looks too thin/thick, adjust in `src/theme/typography.ts`.

---

## ENVIRONMENT

### Office computer

| Field | Value |
|---|---|
| **OS** | Windows 11 Pro 10.0.26200 |
| **Shell** | Git Bash (POSIX sh) |
| **Project path** | `c:\Users\User\music_player` |
| **Node.js** | v24.14.1 |
| **npm** | 11.11.0 |
| **Package manager** | npm (no yarn, no pnpm) |
| **Git** | configured for user `junior0629` (via cached credential helper — home will need re-auth) |
| **Claude Code** | Running in VSCode native extension |
| **Model** | `minimax/minimax-m3:free` (per the system prompt) — this is unusual; typical Claude Code uses Anthropic's Claude models. **The home setup may use a different model — that's fine, the project is model-agnostic.** |

### Memory files (per-machine Claude state)

Claude Code's persistent memory lives at `C:\Users\User\.claude\projects\c--Users-User-music-player\memory\` on the office machine. Files there:

- `MEMORY.md` (index)
- `no-push-without-permission.md` — **important rule:** never `git push` to GitHub without explicit user approval. Local commits are fine.

To preserve this rule on the home machine, copy the `memory/` directory to the equivalent path on the home computer, or recreate the rule there.

### Claude Code settings file (CRITICAL — copy this)

**Location:** `C:\Users\User\.claude\settings.json` (per-machine, per-user)

This file controls how Claude Code authenticates and what it can do on this specific machine. It contains:

1. **`env` block** — model configuration. You're routing through **OpenRouter** (not direct Anthropic):
   - `ANTHROPIC_BASE_URL`: `https://openrouter.ai/api`
   - `ANTHROPIC_AUTH_TOKEN`: your OpenRouter API key (prefixed `sk-or-v1-`)
   - `ANTHROPIC_MODEL`: `minimax/minimax-m3:free`
   - That's why the assistant identifies as "MiniMax-M3" and not Claude — it's a different model served via OpenRouter.
2. **`permissions.allow`** — a long whitelist of pre-approved Bash commands (git, npm, npx, curl, adb, taskkill, etc.). Without this, every command would prompt for permission.
3. **`permissions.additionalDirectories`** — extra read paths (Android SDK licenses, Flutter pub cache).

**To replicate on the home machine:**
- Copy `C:\Users\User\.claude\settings.json` to the same path on the home machine.
- **Decide what to do about the OpenRouter key** (see "Security" below).

### Home computer setup checklist

When continuing on the home machine:

- [ ] Project files present (clone from `https://github.com/junior0629/music.git` **after** the office machine has pushed, OR copy the `c:\Users\User\music_player` directory directly)
- [ ] **Node.js v20+** installed (we're on v24, anything v20+ should work)
- [ ] **npm** bundled with Node
- [ ] **Git** installed and on PATH
- [ ] **Expo Go** app on your phone (if you want phone testing)
- [ ] **Claude Code settings copied:** `C:\Users\User\.claude\settings.json` from the office machine, including the OpenRouter key OR a new one
- [ ] **Claude Code memory copied:** `C:\Users\User\.claude\projects\c--Users-User-music-player\memory\` (so the no-push rule carries over)
- [ ] Run `npm install` from the project root to install dependencies
- [ ] GitHub auth: `git fetch` once and sign in to `junior0629` when prompted by the credential helper
- [ ] Verify the app runs: `npx expo start --web` should open at `http://localhost:8081`
- [ ] Verify Claude Code works: ask me something simple. If I respond as "MiniMax-M3" via OpenRouter, the config is correct.

### Security — handling the OpenRouter API key

The `ANTHROPIC_AUTH_TOKEN` in `settings.json` is your **OpenRouter API key** (format `sk-or-v1-...`). This is a real, paid-or-free-tier key that authenticates API calls to OpenRouter.

**Three options for the home machine:**

1. **Copy the key as-is** — easiest. The same key works on multiple machines. Slight security tradeoff: the key is now on two machines instead of one.
2. **Create a separate key for home** — sign in to https://openrouter.ai → Keys → Create new key → label it "home desktop" → paste it into the home machine's `settings.json`. More secure, no shared credentials.
3. **Use a different model on home** — change `ANTHROPIC_MODEL` to a different OpenRouter model (free or paid). Some models cost money; check OpenRouter's pricing page.

**Do not:**
- Paste the key into chat, into the project files, or into the END_POINT.md file. The value of `ANTHROPIC_AUTH_TOKEN` is a secret and should stay only in `settings.json`.
- Commit `settings.json` to git. It is outside the project directory (`~/.claude/...`), so this is already the case, but worth noting.

### About request limits

You asked about the "50 requests per day" limit. There is no such limit in Claude Code.

What's actually true:
- The free tier of Claude.ai has a usage cap that resets on a rolling schedule (typically several hours of heavy use, then it resets)
- Paid plans (Pro, Max, Team) have much higher or no caps
- API usage is metered by tokens, not requests
- There's no per-day hard cutoff of 50

If you've actually been hitting a wall mid-session, that's a billing or auth issue, not a quota. Check your plan at [claude.ai/settings](https://claude.ai/settings).

If you want to preserve specific Claude Code **settings** (themes, keybindings, etc.) across machines:
- Global: `~/.claude/settings.json`, `~/.claude/CLAUDE.md` (if any)
- Project: `<project>/.claude/` (we don't have any project-level settings)
- We don't have any of these set up yet on the office machine — nothing to preserve

---

## COMMANDS

### Start the dev server (web — primary test target)

```bash
cd c:/Users/User/music_player
npx expo start --web
```

Opens at `http://localhost:8081`. Hot reload is on by default.

### Start the dev server (phone via Expo Go)

```bash
cd c:/Users/User/music_player
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android).

### Install dependencies (first time or after `package.json` changes)

```bash
cd c:/Users/User/music_player
npm install
```

### TypeScript typecheck

```bash
cd c:/Users/User/music_player
npx tsc --noEmit
```

### Production web build

```bash
cd c:/Users/User/music_player
npx expo export --platform=web --output-dir=dist
```

Produces a static bundle in `dist/`. Production bundle is ~1.6 MB.

### Git operations

**Read-only is fine:**
```bash
git status
git log --oneline
git diff
```

**Local commits are fine (don't need to ask):**
```bash
git add -A
git commit -m "..."
```

**`git push` requires explicit user approval every time.** Never push on autopilot. Before pushing, ask the user. This rule is also stored in memory at `no-push-without-permission.md` and is the project's standing rule.

---

## GIT RULES (CRITICAL)

1. **Local commits are free.** Commit often. Don't ask for permission to commit locally.
2. **`git push` is NOT free.** Always ask the user before pushing. Surface readiness as a question: "ready to push?" — wait for explicit "push" or "go ahead" or similar.
3. **Never put credentials in commands or chat.** GitHub password auth was disabled in 2021 anyway. Use a Personal Access Token (PAT) cached by Git's credential helper, OR SSH keys. Office machine uses a credential helper that auto-prompted a browser sign-in. Home machine will need the same flow.
4. **Commit message style:**
   - End with `Co-Authored-By: Claude <noreply@anthropic.com>`
   - Use conventional prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
   - Example: `feat(phase-1): app shell, glass UI, mock data`

---

## PROJECT STRUCTURE

```
music/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab layout (FloatingNav + MiniPlayer + Slot)
│   │   ├── index.tsx             # Home
│   │   ├── search.tsx            # Search
│   │   ├── library.tsx           # Library
│   │   └── settings.tsx          # Settings (now includes DevLogSection)
│   ├── _layout.tsx               # Root layout (providers, ErrorBoundary, GradientBackground)
│   ├── player/[id].tsx           # Now Playing screen
│   └── playlist/[id].tsx         # Playlist detail (placeholder)
├── src/
│   ├── components/               # GlassCard, GlassPanel, GradientBackground,
│   │                             # FloatingNav, MiniPlayer, ErrorBoundary, DevLogPanel (DevLogSection)
│   ├── constants/
│   │   └── app.ts                # APP_NAME, APP_VERSION, APP_PHASE
│   ├── services/
│   │   ├── music/                # MusicProvider interface + MockProvider (Phase 1)
│   │   │                         # PipedProvider arrives in Phase 2
│   │   ├── player/               # AudioService interface (no-op for Phase 1)
│   │   └── storage/              # StorageService interface (AsyncStorage for Phase 1)
│   ├── store/                    # themeStore, playerStore, libraryStore
│   ├── theme/                    # colors, radii, spacing, typography, shadows, platform,
│   │                             # global.css (web font @import)
│   ├── types/
│   │   └── player.ts             # Track, Album, Artist, SearchResults, StreamInfo
│   └── utils/                    # logger, withErrorLogging, globalErrorHandlers
├── assets/                       # (empty — README.md placeholder, no images yet)
├── app.json                      # Expo config
├── babel.config.js
├── tsconfig.json                 # Path alias: @/* → ./src/*
├── package.json
├── PHASES.md                     # Phase tracker — read this for high-level progress
├── README.md                     # Project context
└── END_POINT.md                  # ← you are here
```

---

## PHASES (high-level — see PHASES.md for the full tracker)

| # | Phase | Status |
|---|---|---|
| 0 | Planning & setup | ✅ Complete |
| 1 | App shell + glass UI primitives | ✅ Built, awaiting user approval to commit |
| 2 | **Real search + real playback (PRIORITY)** | ⏳ Next |
| 3 | SQLite: playlists, favorites, history | 🔒 Locked |
| 4 | Downloads + local music import | 🔒 Locked |
| 5 | Partner features, stats, extras | 🔒 Locked |

---

## STEP-BY-STEP CONTINUATION GUIDE

When you open this project on the home machine and tell me "Read the END POINT file," here's what I'll do:

1. **Read this file in full.**
2. **Inspect the working tree** to compare against this snapshot:
   - Are the source files present? (should be — they're committed or in the working tree)
   - Is `node_modules/` present? (probably not, will need `npm install`)
   - What's the latest commit? Compare to `0a08982` (office last commit) — if it's newer, the user has been working on the home machine and I should learn what's new before doing anything.
3. **Check `git status`** for any uncommitted changes.
4. **Check the dev server status** (probably not running on the home machine; user will need to start it).
5. **Ask what the user wants to do** rather than assuming.

The user is most likely to want one of:
- ✅ "Approve Phase 1, commit + push, then start Phase 2" — clean continuation
- 🐛 "X is broken, fix it first" — bug fix
- 🔍 "Show me the current state, then I'll decide" — review
- 🔀 "Skip ahead to Y" — different priority

I will NOT start coding until the user gives a clear instruction, and I will NOT push to GitHub without explicit permission.

---

## FINAL HANDOFF

**Priority:** Preserve → Inspect → Understand → Continue

If something in this file contradicts the actual state of the project on the home machine, **the actual project state wins**. This file is a snapshot, not a contract.

**Last action on the office machine:** User asked to move the dev log from floating overlay to inline Settings section, and to fix the unreadable white text. Both done. Code is in working tree, not yet committed. Awaiting user feedback on the result.
