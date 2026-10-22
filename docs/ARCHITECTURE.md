# ReflexX architecture

- **Game loop (`js/app.js`)**: a small state machine (`idle → waiting → decoy → go → result/false`) driven by `setTimeout` and `performance.now()`.
- **Scoring (`js/core.js`)**: pure functions with no DOM access, so they are unit-tested in Node.
- **Storage**: `localStorage` keys `reflexxRuns`, `reflexxFalse`, `reflexxAch`, `reflexxXp`, `reflexxName`, `reflexxTheme`, `reflexxSound`, `reflexxHaptic`. Reads are wrapped in try/catch.
- **Progression**: XP per run (faster runs earn more), levels from `floor(sqrt(xp/60))+1`, 9 achievements, daily goal of 5 runs.
- **Offline**: `sw.js` precaches the app files (cache-first). Bump `CACHE` on each release.
- **Accessibility**: keyboard play (Space), ARIA live result text, focus outlines, reduced-motion support.
