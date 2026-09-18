# Agent context — read this before touching anything

You are picking up work on **NebulaX**, a mostly-finished hackathon submission. This is the
handoff document for whichever AI coding agent (Claude Code, Codex, or otherwise) works on this
repo next. Read it fully before making any change, however small.

## This is near the finish line — do not restart or discard progress

This app has gone through **six rounds of real feedback and root-cause fixes** (see
`docs/AUDIT.md` through `docs/AUDIT_V6.md`) to get here. It is close to demo-ready. That means:

- **Do not re-architect, rewrite from scratch, or "clean up" working systems** you don't
  immediately understand. If something looks odd (a straight-line distance formula, an in-memory
  state store, a `line: null` fallback), read the comment above it and the relevant `AUDIT_*.md`
  entry first — it is very likely a deliberate, previously-debated decision, not an oversight.
- **Do not switch branches, force-push, rebase, or rewrite history** unless explicitly asked. See
  "Git branch reality" below — getting this wrong will silently throw away work.
- **Do not casually delete or "simplify away" the mock-data-honesty pattern** (see below) — it is
  the single most load-bearing design decision in this codebase and judges/reviewers will notice if
  it's gone.
- Small UI tweaks, bug fixes, and polish are exactly what's left and exactly what should happen
  now. Large refactors, dependency swaps, or redesigns are very likely NOT what's needed — if a
  request seems to imply one, confirm with the user before doing it.
- When you finish a round of changes, **document it** the way every prior round has: a new
  `docs/AUDIT_V{N}.md` explaining root causes found (not just symptoms patched), commit with a
  detailed message, and update `README.md`/`docs/WRITEUP.md` only where something you changed makes
  them inaccurate. Don't skip this — it's how the next agent after you will understand what you did.

## Mandatory first step: understand the repo before editing

Before writing any code, in this order:

1. Read `README.md` (quick start, project structure, known limitations).
2. Read `docs/WRITEUP.md` in full (persona rationale, architecture, assumptions, limitations,
   measurement methodology) — this is the single source of truth for *why* the app is built the way
   it is.
3. Skim `docs/AUDIT.md` → `docs/AUDIT_V6.md` in order — each one documents a real round of user
   feedback, the root cause found (not just the symptom), and what was deliberately left out of
   scope and why. This is essential context: several things that look like bugs at first glance are
   documented, deliberate simplifications.
4. Skim `docs/BUILD_PLAN.md` for the original build order/rationale.
5. Only then start reading source code, starting from `server/index.js` and `src/App.jsx`.

Do not skip straight to editing a file because a request sounds simple. The docs above exist
specifically so you don't have to rediscover context that's already been debated and settled.

## What this project is

**NebulaX** — built for **NEBULA X** (LTA / Google Cloud / SMRT / SBS Transit / CRRC, NUS-hosted),
Problem Statement 2: "Smart Commuter Companion." A mobile-first web app built for **one named
persona**, Arjun — a flexible Punggol → one-north commuter who values comfort/predictability over
raw speed — per the brief's explicit scoring preference for persona-focused builds.

**The two core differentiators** (what makes this different from Google Maps/Citymapper/MyTransport,
per the brief's own framing):
1. **Incentivized load-spreading** — when the top route is meaningfully more crowded than a viable
   alternative (and the commuter isn't rushing), the app offers a tiered mock reward for choosing
   the alternative instead. See `server/services/rankingEngine.js` and
   `server/services/incentiveCalculator.js`.
2. **Bridging buses as a first-class route candidate** — during a real disruption past LTA's real
   ~30-min threshold, a bridging bus service is added as a genuine ranked candidate, not just
   mentioned in text. See `BRIDGING_BUS_ROUTE` in `server/data/mockJourneys.js`.

Full rationale, architecture and measurement methodology: `docs/WRITEUP.md`.

## Git branch reality — READ CAREFULLY

- **The real branch is `feature/ps2-complete-build`.** All 14+ commits of actual development live
  here. Work on this branch unless explicitly told otherwise.
- **`main` is stale** — it is fully contained in `feature/ps2-complete-build`'s history (0 commits
  ahead), i.e. `feature/ps2-complete-build` is strictly ahead of `main` by over a dozen commits.
  Do not treat `main` as the source of truth, and do not branch fresh work off `main` assuming it's
  up to date — it isn't.
- Someone has already merged `main` back into `feature/ps2-complete-build` once (a no-op merge
  commit) — this is fine and already resolved; it doesn't mean `main` has newer work.
- No pull request is currently open for this branch (checked at time of writing). If you open one,
  target it at `feature/ps2-complete-build`'s actual current state, and mirror the existing detailed
  commit-message style (see `git log` on this branch for examples — multi-paragraph, explains root
  cause and what was verified, not just what changed).
- Before any destructive git operation (reset --hard, force-push, branch deletion), stop and
  confirm with the user. This instruction from the project's own system prompt convention applies
  doubly here since so much accumulated work is at stake.

## Architecture

- **Frontend** (`src/`): React 19 + Vite, mobile-first, phone-viewport-first CSS. The only HTTP
  calls it ever makes are to this app's own backend (`src/lib/api.js` is the single fetch
  boundary) — **never** directly to LTA, OneMap, OSRM, or data.gov.sg. Preserve this boundary; it
  exists because those calls need secret keys or server-side rate limiting.
- **Backend** (`server/`): Express.
  - `server/services/*` — the only modules allowed to call external APIs. Each has a timeout and a
    predictable failure mode so routes can catch and fall back to a labeled fixture instead of
    hanging.
  - `server/routes/*` — `/api/journey`, `/api/disruptions`, `/api/crowding`, `/api/weather`,
    `/api/incentives`, `/api/demo`, `/api/stations`.
  - `server/data/*` — labeled mock fixtures used when a live source is unavailable (which is
    always, in this environment — see "No live API keys" below).
  - `server/state/*` — two pieces of intentionally non-persistent in-memory state: the
    demo-disruption trigger (`demoState.js`) and the mocked incentive ledger
    (`incentiveStore.js`). Resetting on server restart is intentional, not a bug.
- **Routing engine**: OneMap (Singapore government geospatial/routing API) is the documented
  *primary* engine per the brief, and a real client exists
  (`server/services/oneMapClient.js`) — but it is **not wired into `/api/journey`**, because no
  OneMap credentials exist in any environment this has been built/tested in. Don't "fix" this by
  wiring it in without first confirming real credentials are available and tested — the current
  honest, labeled-mock behavior is deliberate, not an oversight.
- **Map**: `react-leaflet` + public OSM raster tiles, "© OpenStreetMap contributors" attribution
  required and always shown.

## The one pattern that matters most: mock-data honesty

**Every single external data source in this app is either real-with-a-key or an honestly-labeled
mock — never silently fabricated as if real.** This shows up as:
- `isMock: true/false` flags threaded through API responses.
- A visible `DEMO MODE` badge in the UI whenever any part of the current response is mocked.
- Extensive code comments explaining *why* something is simulated and exactly what it's a
  proxy for (e.g. straight-line/haversine distance as a proxy for real travel distance, used
  consistently everywhere instead of a real routing engine).
- A hard rule, re-litigated and fixed in `docs/AUDIT_V6.md`: **never fabricate something that looks
  specific/real but isn't verifiable** — e.g. a previous version invented a bus service number like
  "Bus 110" with no real service behind it; this was treated as a bug and fixed to show a generic,
  honestly-labeled "simulated route" instead once it was confirmed no live LTA key exists to verify
  a real one. If you're tempted to hardcode something that looks authoritative (a specific number,
  a specific name, a specific time) and you can't verify it against a real data source, don't — label
  it as an estimate/simulation instead, the way everything else in this codebase does.

**No live API keys are configured in any environment this has been developed in**
(`LTA_ACCOUNT_KEY`, `ONEMAP_EMAIL`/`ONEMAP_PASSWORD`, `MAPTILER_KEY`, `STADIA_API_KEY` — see
`.env.example`). Check `server/env.js` / whether a real `.env` exists before assuming any live data
path is testable. If your environment *does* have real keys and you get real API access, that's
new — test carefully, keep the mock fallback path intact (`hasLta()`/`hasOneMap()` gating already
exists), and don't remove the fallback.

## Other conventions worth preserving

- **Real network topology for routing, not guesses.** `server/data/stationDirectory.js` has ~140
  real SG MRT/LRT stations; every real interchange is tagged with a `lines` array (not just a
  single `line`). `server/services/mockRouteGenerator.js` runs an actual Dijkstra shortest-path
  search over this graph for any from/to pair not on Arjun's hand-crafted corridor — this was a
  significant fix in `docs/AUDIT_V5.md`/`V6.md` after earlier versions used a single geometric
  midpoint or a single-interchange lookup and produced wrong/geographically-nonsensical routes. If
  you touch this file, re-read `AUDIT_V5.md` and `V6.md` first — it's easy to reintroduce the exact
  bugs that were already found and fixed twice.
- **Never suggest two routes that are actually identical.** A prior bug (fixed in `AUDIT_V6.md`)
  showed two "different" route cards that were the same real path with a different fabricated
  duration. If a change could cause two generated routes to collapse to the same leg sequence,
  dedupe rather than show a fake-looking duplicate.
- **Demo-disruption trigger must stay deterministic-but-varied.** `server/state/demoState.js`
  randomly picks one of 3 real disruption scenarios (`server/data/mockDisruptions.js`) on each
  trigger, but never immediately repeats the currently-active one, and the chosen scenario stays
  fixed across repeated polls until reset — this is deliberate, for reliable screen-recording. See
  `AUDIT_V5.md`.
- **GMaps UI fidelity is a hard requirement, already met — don't redesign it.** The route
  preview/detail UI (`RouteCard.jsx`, `RouteDetailSheet.jsx`) was explicitly built to match
  reference Google Maps screenshots the project owner provided, not independent visual design
  choices (see `AUDIT_V4.md`). Real SG rail-line colors are in `src/lib/lineColors.js` — don't
  invent new colors for lines; match the real ones already there.
- **React state-adjustment-during-render pattern.** Several components (e.g.
  `StationSearchInput.jsx`, `HomePage.jsx`) intentionally compare against a "last known value"
  state variable and update during render instead of using `useEffect`, to satisfy
  `react-hooks/set-state-in-effect` lint rules. This is a deliberate, repeated pattern — follow it
  for similar cases rather than reaching for `useEffect`.
- **Commit message convention**: multi-paragraph, explains root cause (not just symptom) and what
  was verified before pushing. Look at recent `git log` on this branch for the exact style and
  match it.
- **One `docs/AUDIT_V{N}.md` per round of feedback**, written *after* the fix, documenting: root
  cause found, what was fixed, what was explicitly left out of scope and why, and how it was
  verified. Keep doing this — it's the project's memory across agent sessions.

## Known limitations (do not "fix" these without checking with the user first)

Full list with reasoning: `docs/WRITEUP.md#limitations`. Highlights:
- OneMap isn't wired into `/api/journey` (no credentials to test against).
- Only Arjun's Punggol → one-north corridor has a fully hand-crafted route fixture
  (`server/data/mockJourneys.js`) with the bridging-bus/disruption scenario; every other from/to
  pair gets the generic Dijkstra-routed mock generator, which has no real bus-route data behind its
  "Comfort" option (see `AUDIT_V6.md`).
- Dark mode doesn't re-theme map tiles (needs a paid tile provider).
- Incentive ledger and demo-disruption state are in-memory and reset on server restart — intentional
  for a single demo-recording session.
- Mobile testing has only been done via Playwright viewport emulation (390×844), never a physical
  device.

## How to run and verify changes

```bash
npm install
npm run dev        # frontend (Vite, :5173) + backend (Express, :3001) together
npm run dev:web     # frontend only
npm run dev:api      # backend only
npm run build       # production frontend build — run before considering any change done
npm run lint         # ESLint across frontend and backend — run before considering any change done
```

No `.env` file is required to run or test — everything falls back to labeled mock data (see above).

**Before calling any change finished:**
1. `npm run lint` and `npm run build` must both pass clean.
2. For backend/data-logic changes, hit the relevant `/api/*` endpoint directly with `curl` and
   inspect the JSON — this project's history shows real bugs (e.g. wrong routing, wrong stop
   counts) that were only caught this way, not by lint/build alone.
3. For any UI-visible change, actually run the dev servers and take a screenshot (Playwright is the
   established approach in this project — target a 390×844 mobile viewport to match how this app
   has always been tested) rather than just reasoning about the JSX. Compare against what the UI
   looked like before your change.
4. If your environment doesn't have Playwright/a browser available, say so explicitly rather than
   claiming a UI change was verified when it wasn't.

## Where to look for what

```
server/
  index.js            Express app entry, mounts all routes + error middleware
  env.js               Reads/validates env vars; hasLta()/hasOneMap() gate live-data paths
  services/            External API clients (LTA, OneMap, OSRM, BusArrival, weather) + the
                        generic mock route generator + incentive tiering — each degrades to a
                        labeled mock on failure/missing key
  routes/              One file per /api/* endpoint
  data/                Mock fixtures: Arjun's hand-crafted corridor + bridging bus
                        (mockJourneys.js), disruption scenarios (mockDisruptions.js), crowding,
                        weather, mock Telegram feed, the ~140-station directory, voucher tiers
  state/                In-memory demo-disruption + incentive-ledger state
src/
  App.jsx               Top-level routing between pages, dark mode, urgency state
  pages/                 Signup, Home (the main route planner + disruption flow), Rewards, Settings
  components/            MapView, RouteCard, RouteDetailSheet, UrgencyToggle, BottomNav,
                          DemoModeBadge, DisruptionNotification, CommunityUpdatesFeed,
                          StationSearchInput
  hooks/                 useJourney (fetch + offline cache), useOnlineStatus, useLiveLocation,
                          useHomeWork, useStations, useDarkMode
  lib/                   api.js (the one fetch boundary), lineColors.js (real SG line
                          colors/codes), routeTiming.js (clock-time/stop-count display helpers),
                          stationUtils.js
docs/
  WRITEUP.md             Source of truth: persona, architecture, assumptions, limitations,
                          measurement methodology — read this in full before anything else
  AUDIT.md .. AUDIT_V6.md  One per feedback round, in order — root causes, what was fixed, what
                            was deliberately left out of scope
  BUILD_PLAN.md           Original build order/rationale
README.md                 Quick start + project structure + known-limitations pointer
```

## If you're the friend testing this app and prompting fixes

Small, targeted prompts work best given everything above — e.g. "the X button on the Y page does Z
instead of W, fix it" rather than "improve the UI." If you notice something that looks like a
design limitation rather than a bug (an approximate number, a "DEMO MODE" badge, a route that seems
too simple), check `docs/WRITEUP.md#limitations` and the `AUDIT_*.md` files first — it may already
be a documented, deliberate trade-off rather than something to fix, and the agent you're prompting
should check the same before changing it.
