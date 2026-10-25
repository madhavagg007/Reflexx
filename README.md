# ReflexX — Reaction Lab

A reaction-time training game built with vanilla HTML, CSS and JavaScript (no dependencies).

**Live demo:** https://madhavagg007.github.io/Reflexx/

## Features
- App shell: bottom tab navigation (Play, Stats, Trophies, Settings), XP and levels, daily goal, player profile
- 6 modes: Classic, Random, Precision (false starts add 50 ms), Challenge (5 rounds), Color Rush, Reverse
- Accurate timing with `performance.now()`, plus anticipation detection (< 100 ms rejected)
- Performance trend chart (5-run moving average, best marker, mode and range filters) and reaction-time distribution histogram
- Custom mode: choose rounds, random-delay window and false-start penalty
- Touch optimised: pointer events, event-timestamp timing, paint-synced start time, full-screen tap target, multi-touch and long-press guards
- Per-mode personal bests, consistency (std. deviation), trend chart and a rough percentile estimate
- 9 unlockable achievements and a streak counter
- Dark/light theme, sound and vibration feedback, JSON export, share button
- Installable PWA with offline support (manifest + service worker)
- Accessible: keyboard play (Space), ARIA live results, focus styles, reduced-motion support

## Run locally
Open `index.html` in a browser. For PWA features, serve over HTTP(S):

```bash
python -m http.server 8000
```

## Deploy (GitHub Pages)
1. Create a repository and upload these files to its root.
2. Go to Settings → Pages, set Source to your main branch and root folder.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

## Tech notes
- State is persisted in `localStorage` (runs, theme, sound, achievements).
- The service worker uses a cache-first strategy; bump `CACHE` in `sw.js` after each release.
- Results depend on device and display latency, so treat percentiles as estimates.

## Testing
Scoring logic lives in `core.js` (pure functions) and is covered by unit tests:

```bash
npm test
```

## Project structure
```
index.html            app shell and markup
css/style.css         styles and themes
js/core.js            pure scoring helpers (unit-tested)
js/app.js             game loop, UI, storage
tests/core.test.js    unit tests (node:test)
docs/ARCHITECTURE.md  design notes
sw.js                 service worker (offline cache)
manifest.webmanifest  PWA manifest
icons/, icon.svg      app icons
```

## Roadmap
Per-mode leaderboards, share image cards, and end-to-end tests.
