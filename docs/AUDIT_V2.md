# Audit v2 — delta for the updated PS2 build prompt

Written before editing anything, per the updated prompt's step 1. Covers what's kept, removed,
and new, plus decisions confirmed with the product owner where the new prompt conflicted with
itself or assumed features that didn't exist yet.

## What the new prompt assumes exists but doesn't

Checked `src/` and `server/` directly (grep for hot/cold classification, geolocation, signup,
"Ask Me" — no matches anywhere). The new prompt describes these as "unchanged from before":

- Home/work station 2-tap signup
- Live GPS location tracking
- "Ask Me" same-day override button

None of these were in the previous build. They are **new features**, not carried over. Confirmed
with the product owner to build all three now, scoped for a demo MVP rather than production
(e.g. GPS falls back to a fixed demo coordinate if permission is denied, not a hardened
geolocation error-handling path).

## Conflict resolved

Walking-leg cap was specified as both 10 minutes (big prompt) and 15 minutes (follow-up message).
**Confirmed: 10 minutes.**

## What's being removed

Nothing — the "drop hot/cold classification" instruction doesn't apply; that classifier was never
built. `rankingEngine.js`'s crowding score already comes directly from per-line crowding data, not
a topological pre-filter, so this requirement was already satisfied by construction.

## What's being kept as-is (for now)

- `server/services/ltaClient.js`, `weatherClient.js`, `osrmClient.js`, `oneMapClient.js` — no
  change needed yet.
- `server/state/incentiveStore.js`'s flat award is being replaced (see below), but the ledger
  shape (balance + history) stays, since the Rewards page is being redesigned to show a progress
  bar toward tiered vouchers using that same shape.
- Backend rework (bridging-bus routing, mock Telegram-style secondary disruption feed, the tiered
  incentive-calculation module) was **deferred to a second pass** after the frontend simplification
  — see "Second pass" below for what that pass actually built.

## Second pass: the deferred backend work

Built after the frontend simplification, on top of the same `/api/journey` response shape (no UI
rewrite needed) — explicitly prioritized for demo reliability over production completeness, per
the product owner: "use mock datasets if necessary."

- **Bridging bus as a genuine top-3 candidate** (`server/data/mockJourneys.js`'s
  `BRIDGING_BUS_ROUTE`, wired in `server/routes/journey.js`): only generated when a disruption
  declares `bridgingBusDeclared` (modeling LTA's real >30 min threshold — see
  `server/data/mockDisruptions.js`). It's a real candidate in the ranking, not a fixed winner or
  loser — tuned so it wins outright only when its own (simulated) live crowding happens to be low,
  which is deterministic during the demo trigger for reliable recording, and randomized on the
  ambient/non-demo path. This is the differentiator no competitor app (Google Maps, Citymapper,
  MyTransport) surfaces.
- **Bus crowding priority order** (`server/services/busArrivalClient.js`): real `v3/BusArrival`
  `Load` field first (will only succeed with a real LTA key *and* a real bus stop/service code —
  realistically never for a temporary bridging service, but the real path is still exercised),
  falling back to a simulated "next arrival" reading, explicitly flagged `isMock`/`source: 'mock'`
  in code.
- **Mock Telegram-style secondary feed** (`server/data/mockTelegramFeed.js`): entirely synthetic,
  generated here — never scraped or polled from Telegram/X, per the brief's explicit instruction.
  Labeled `source: 'mock-telegram'` internally; shown in the UI as an ordinary "Community updates"
  section, not called out loudly, but never pretended to be a real API call in the code.
- **Full disrupted stretch**: `DEMO_TRIGGER_DISRUPTIONS.affectedStations` now lists all 11 real NEL
  stations between Sengkang and Dhoby Ghaut, not just the two endpoints.
- **Dynamic tiered incentive** (`server/services/incentiveCalculator.js`, one module): replaces the
  old flat 30-point award. Tiers (small/medium/large) from crowding relief vs. time cost — coarse
  on purpose, not cent-level math, per the brief. The frontend only ever echoes back *which tier it
  displayed*; the actual point value is always looked up server-side
  (`server/state/incentiveStore.js`), so a client can't hand the mock ledger an arbitrary number.
- Found and fixed a real bug while tuning this: the bridging bus's original timing (45 min) made it
  win outright almost every time regardless of its own crowding, which meant it was never really a
  "candidate to weigh" — retimed to 47 min so it wins specifically when it's genuinely the better
  option, not by default.

## What's new in this pass (frontend simplification)

- Bottom nav cut from 4 tabs to 2 (Home, Rewards) — Announcements folds into the notification
  system instead of being a separate destination.
- Home page rebuilt as a plain, Gmaps-style single-route view in "everyday" mode (no disruption);
  switches to the 3-route + incentive comparison automatically when a route comes back affected —
  this is the "show 1 clean recommendation unless the numbers say otherwise" behavior from the big
  prompt, implemented as a frontend render decision against the existing `affected` flags rather
  than a new backend field.
- Map (`MapView.jsx`) recolored per leg mode/line (SG MRT line colors + a bus color + dashed walk)
  instead of one flat line, so the route reads visually without needing the legend chips.
- Simulated in-app "notification" (phone-notification-styled banner) fires when the demo
  disruption trigger fires; tapping it opens Home already switched to the 3-route comparison.
- Home/work 2-tap signup (first run only, stored in `localStorage`). Station names come from a new
  `GET /api/stations` endpoint (backend still owns this data) rather than being duplicated in the
  frontend. Only Punggol ↔ one-north has a real modeled route in this MVP — picking anything else
  shows an honest "no live routing for this pair yet" message rather than fabricated data.
- Live location marker on the map via browser geolocation, falling back to a fixed demo coordinate
  (labeled) if permission is denied or unavailable — scoped for demo reliability, not production
  robustness.
- "Ask Me" button: a same-day-only destination override, session-local (not persisted). One extra
  lightweight alternate-destination fixture (Punggol → Raffles Place, single route, no 3-way
  ranking) was added so the override visibly does something, rather than pretending full arbitrary
  routing exists.
- Rewards page redesigned around a progress bar toward the next voucher tier, using the existing
  incentive-store ledger shape.
