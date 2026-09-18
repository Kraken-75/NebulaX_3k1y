# Audit v3 — UX feedback round

Delta note for the third round of product feedback (incentive fairness, notification placement,
route confirmation, settings, and — the big one — real editable from/to routing). No blocking
ambiguities this round; a few implementation-scope calls were made and are flagged below rather
than asked about, per "ask me if unsure, otherwise start the edit."

## What changed

1. **Both non-top routes now get an incentive, not just one** — `rankingEngine.js` no longer picks
   a single random qualifying alternative. Every route ranked below #1 gets a tier, and a route
   ranked worse than another gets a *strictly higher* tier (ratcheted, capped at "large") — "the
   worst should get the highest incentive," guaranteed by construction rather than left to chance.
2. **Notification is now a true top-of-viewport overlay** (`position: fixed`, drops in over the
   app's own header), not inline page content.
3. **Choosing a route now visibly does something**: it becomes the single main route (same
   presentation as everyday mode) with a back arrow to reopen the 3-route comparison.
4. **Dark mode**: explicit toggle (Settings), not OS-inherited — `data-theme` attribute switching
   the same CSS variables every component already used, so nothing needed retrofitting. Map tiles
   stay light in dark mode; a real dark tile layer needs a paid provider (MapTiler/Stadia), out of
   scope here.
5. **Settings tab** (3rd bottom-nav item): profile, the dark mode toggle, and re-editing default
   home/work stations.
6. **The big one — real editable From/To, no more Ask Me**: the previous build only had one fully
   modeled corridor (Punggol ↔ one-north); everything else silently used that same fixture
   regardless of what was picked, which is exactly the confusing "route doesn't match what I
   selected" bug reported this round. Fixed by:
   - A ~49-station curated directory (`server/data/stationDirectory.js`) across all 6 rail lines,
     served via `GET /api/stations` and filtered client-side for the autocomplete (small dataset,
     no need to round-trip per keystroke).
   - `server/services/mockRouteGenerator.js`: generates 3 labeled-mock routes for **any** selected
     pair from real straight-line distance — not real transit topology (no OneMap credentials
     exist to build that against), but honest about what it is, and always the actual selected
     pair rather than a silent substitution.
   - Arjun's specific Punggol → one-north corridor keeps its hand-crafted fixture (bridging bus,
     disruption scenario, tuned incentive numbers) exactly as before — the generator only kicks in
     for any other pair.
   - Home now shows always-visible, always-editable From/To fields above the map, seeded once from
     the nearest station to live location (or saved home) and the saved work station, GMaps-style.
   - The Ask Me button and its one-fixture override are deleted entirely, per instruction, along
     with the now-dead `homeOptions`/`workOptions` signup-picker data — Signup and Settings' "change
     home/work" now use the exact same search component as Home's From/To fields.

## Scope calls made without blocking

- Station directory is a curated ~49 stations, not the full real network (~180+) — reasonable
  demo coverage across all 6 lines, not exhaustive.
- Generic-pair routes use straight-line distance heuristics for timing (walk legs still get real
  OSRM street geometry); no real line-by-line transfer modeling for arbitrary pairs.
- Dark mode leaves the map tile layer alone rather than attempting a CSS filter/invert hack on it.
