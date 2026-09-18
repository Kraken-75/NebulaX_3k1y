# NebulaX — Smart Commuter Companion

Built for **NEBULA X** (LTA / Google Cloud / SMRT / SBS Transit / CRRC, NUS-hosted), Problem
Statement 2. A mobile-first web app that gives one commuter — **Arjun**, a flexible Punggol →
one-north commuter who values comfort and predictability over raw speed — proactive, door-to-door
route advice: a plain single-route view day to day, a phone-style notification the moment a
disruption hits, and (unlike Google Maps, Citymapper or MyTransport) a real bridging-bus option and
a scaled reward for choosing a less-crowded alternative when it helps spread load off the busiest
route.

See [`docs/WRITEUP.md`](docs/WRITEUP.md) for the persona rationale, architecture, assumptions,
limitations and measurement methodology. See `docs/AUDIT*.md` (v1 through v5) and
[`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) for how this build decided what to keep across each
revision and the order it was built in.

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
you want to record a demo. On first run, search and pick a home and work station. On **Home**, the
From/To fields default to Punggol → one-north (Arjun's persona, and the only pair with the full
hand-crafted disruption scenario — any other pair still produces a route, just a generically
mocked one). Expand **"Simulate a disruption (for demo)"** and press **Trigger disruption** for a
deterministic, reproducible scenario, picked at random from 3 (never the one already showing, so
repeated triggers always visibly change something): a North East Line fault between Sengkang and
Dhoby Ghaut, an East West Line fault between Clementi and Redhill, or a North South Line fault
between Orchard and Raffles Place. Only the North East Line scenario touches Arjun's own
Punggol → one-north corridor — when it's active, a bridging bus service is declared, a phone-style
notification drops in from the top of the screen (tap it to reveal the ranked 3-route comparison
including the bridging bus as a real candidate, each alternative scaled to its own reward), plus a
"Community updates" feed styled on the SGMRT Telegram channel (entirely synthetic, generated
locally). The other two scenarios still show the notification, correctly telling Arjun it doesn't
affect his trip — pick a From/To pair that actually crosses the affected line (e.g. Orchard →
Raffles Place) to see that scenario's own route impact instead. Press **Reset** to clear it. This
state is in-memory on the backend and resets when the server restarts.

## Map tiles

The map uses the public OpenStreetMap tile server (`tile.openstreetmap.org`) by default, which is
fine for local development and this hackathon demo, but its usage policy forbids sustained
production traffic. For anything beyond a demo recording, set `MAPTILER_KEY` or `STADIA_API_KEY`
and point `src/components/MapView.jsx`'s `TileLayer` `url`/`attribution` at that provider instead.
"© OpenStreetMap contributors" attribution is required and always shown regardless of tile source.

## Project structure

```
server/            Express backend — the only place secrets or external API calls live
  services/        LTA DataMall, OneMap, OSRM, BusArrival, data.gov.sg clients, the mock route
                    generator, incentive tiering (each external-API client degrades to a
                    labeled mock on failure)
  routes/          /api/journey, /api/disruptions, /api/crowding, /api/weather, /api/incentives,
                    /api/demo, /api/stations
  data/            Labeled mock fixtures used when a live source is unavailable (Arjun's
                    hand-crafted corridor + bridging-bus route, disruptions, crowding, weather,
                    the mock Telegram feed, the ~49-station directory, voucher tiers)
  state/           In-memory demo-disruption toggle and mocked incentive ledger
src/               React frontend — only ever calls our own /api/* endpoints (src/lib/api.js)
  pages/           Signup, Home (route planner + disruption flow), Rewards, Settings
  components/      MapView, RouteCard, UrgencyToggle, BottomNav, DemoModeBadge,
                    DisruptionNotification, CommunityUpdatesFeed, StationSearchInput
  hooks/           useJourney (fetch + offline cache), useOnlineStatus, useLiveLocation,
                    useHomeWork, useStations, useDarkMode
```

## Scripts

- `npm run dev` — frontend + backend together (recommended)
- `npm run dev:web` / `npm run dev:api` — run either alone
- `npm run build` — production frontend build
- `npm run lint` — ESLint across frontend and backend

## Known limitations

See [`docs/WRITEUP.md`](docs/WRITEUP.md#limitations) for the full list — notably: OneMap
multi-modal routing has a real client implemented but isn't wired into `/api/journey` yet; any
from/to pair now produces a route, but only Punggol → one-north has the hand-crafted disruption
scenario, everything else is a generic distance-based mock; dark mode doesn't re-theme the map
tiles; and mobile testing was done via viewport emulation, not a physical device, in this build
environment.
