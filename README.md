# NebulaX — Smart Commuter Companion

Built for **NEBULA X** (LTA / Google Cloud / SMRT / SBS Transit / CRRC, NUS-hosted), Problem
Statement 2. A mobile-first web app that gives one commuter — **Arjun**, a flexible Punggol →
one-north bike + LRT/bus commuter who values comfort and predictability over raw speed — proactive,
door-to-door route advice, and rewards him for choosing a less-crowded route when it helps spread
load off the busiest one.

See [`docs/WRITEUP.md`](docs/WRITEUP.md) for the persona rationale, architecture, assumptions,
limitations and measurement methodology. See [`docs/AUDIT.md`](docs/AUDIT.md) and
[`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) for how this build decided what to keep from the
repo's earlier branches and the order it was built in.

## Quick start (zero setup friction, zero API keys required)

```bash
npm install
npm run dev
```

This starts the frontend (Vite, port 5173) and backend (Express, port 3001) together. Open
**http://localhost:5173**.

With no `.env` file at all, every data source (routing, crowding, disruptions, weather) falls back
to clearly labeled demo/mock data — you'll see a **DEMO MODE** badge wherever that's happening.
The app is fully inspectable and demoable with nothing configured.

## Adding real data (optional)

Copy `.env.example` to `.env` and fill in what you have:

- **`LTA_ACCOUNT_KEY`** — free registration at [datamall.lta.gov.sg](https://datamall.lta.gov.sg/).
  Enables live `TrainServiceAlerts`, `PCDRealTime` crowding, `RoadWorks`, `PlannedBusRoutes`.
- **`ONEMAP_EMAIL` / `ONEMAP_PASSWORD`** — free account at
  [onemap.gov.sg/apidocs/register](https://www.onemap.gov.sg/apidocs/register). Primary
  multi-modal routing engine (official SG government geospatial infrastructure).
- **`MAPTILER_KEY`** / **`STADIA_API_KEY`** — only needed beyond local/demo use; see
  [Map tiles](#map-tiles) below.

Nothing here is required to run or demo the app — see `server/env.js` and `server/services/*` for
exactly how each integration degrades when its key is missing.

## Demoing a disruption reliably

Live disruption feeds are "quiet normally" — a real MRT fault won't reliably occur at the moment
you want to record a demo. Open the **Plan** tab, expand **"Demo controls (for screen recording)"**,
and press **Trigger test disruption** for a deterministic, reproducible disruption scenario (a
North East Line fault between Sengkang and Dhoby Ghaut). Press **Reset** to clear it. This state is
in-memory on the backend and resets when the server restarts.

## Map tiles

The map uses the public OpenStreetMap tile server (`tile.openstreetmap.org`) by default, which is
fine for local development and this hackathon demo, but its usage policy forbids sustained
production traffic. For anything beyond a demo recording, set `MAPTILER_KEY` or `STADIA_API_KEY`
and point `src/components/MapView.jsx`'s `TileLayer` `url`/`attribution` at that provider instead.
"© OpenStreetMap contributors" attribution is required and always shown regardless of tile source.

## Project structure

```
server/            Express backend — the only place secrets or external API calls live
  services/        LTA DataMall, OneMap, OSRM, data.gov.sg clients (each degrades to mock on failure)
  routes/          /api/journey, /api/disruptions, /api/crowding, /api/weather, /api/incentives, /api/demo
  data/            Labeled mock fixtures used when a live source is unavailable
  state/           In-memory demo-disruption toggle and mocked incentive ledger
src/               React frontend — only ever calls our own /api/* endpoints (src/lib/api.js)
  pages/           Home, Planner, Announcements, Rewards
  components/      MapView, RouteCard, UrgencyToggle, BottomNav, DemoModeBadge
  hooks/           useJourney (fetch + offline cache), useOnlineStatus
```

## Scripts

- `npm run dev` — frontend + backend together (recommended)
- `npm run dev:web` / `npm run dev:api` — run either alone
- `npm run build` — production frontend build
- `npm run lint` — ESLint across frontend and backend

## Known limitations

See [`docs/WRITEUP.md`](docs/WRITEUP.md#limitations) for the full list — notably: OneMap
multi-modal routing has a real client implemented but isn't wired into `/api/journey` yet (it
currently always serves the labeled Punggol → one-north demo itinerary, enriched with real OSRM
street geometry for the walk/cycle legs), and mobile testing was done via viewport emulation, not
a physical device, in this build environment.
