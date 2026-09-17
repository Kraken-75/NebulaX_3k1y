# Build plan — ordered by mandatory-first, demoable-early

Checked items are done; this file is updated as we go rather than written once at the end.

## Phase 0 — Foundation (blocks everything else)
- [x] Audit existing branches (`docs/AUDIT.md`)
- [x] Branch `feature/ps2-complete-build` off `main`
- [x] `.env.example` + confirm `.env*` in `.gitignore`
- [x] Backend scaffold (`server/`): Express app, error-handling middleware, mock-data fallback pattern
- [x] Frontend scaffold: page shell, mobile-first CSS baseline, Arjun persona defaults, urgency toggle state

## Phase 1 — Mandatory capability 1: Route planning
- [x] `server/services/oneMapClient.js` — OneMap routing client built (token auth + `routingsvc`), not yet wired into `/api/journey` (no credentials to verify against in this environment — see `docs/WRITEUP.md`)
- [x] `server/services/osrmClient.js` — public OSRM fallback for walk/cycle legs
- [x] `server/data/mockJourneys.js` — labeled demo itinerary for Arjun's Punggol → one-north bike+LRT/bus trip
- [x] `server/routes/journey.js` — `GET /api/journey` returns 3 ranked door-to-door routes with timing + uncertainty band
- [x] Frontend `PlannerPage` + `RouteCard` consuming only `/api/journey`

## Phase 2 — Mandatory capability 2: OSM geospatial base
- [x] `react-leaflet` + OSM raster tiles (public demo endpoint, rate-limited use only, README notes MapTiler/Stadia swap for prod)
- [x] "© OpenStreetMap contributors" attribution visible on map
- [x] Route polyline rendered on map from `/api/journey` response

## Phase 3 — Mandatory capability 3: Visual situation awareness
- [x] Affected vs. unaffected segment styling on map + route card
- [x] 3 alternative routes shown side-by-side for comparison
- [x] Crowding badge per route/segment (renders from cached data, no visible lag)
- [x] Time/delay cost displayed per route

## Phase 4 — Data integration (real API first, mock fallback always)
- [x] `server/services/ltaClient.js` — `TrainServiceAlerts`, `PCDRealTime`, `RoadWorks`, `PlannedBusRoutes` (real calls, untested against live LTA — no key in this environment)
- [x] `server/services/weatherClient.js` — data.gov.sg nowcast (comfort/shelter weighting)
- [x] `server/services/rankingEngine.js` — combines crowding + weather + disruptions + urgency setting into the 3 ranked routes; diversifies which "less popular" alternative gets the incentive to avoid thundering-herd
- [x] "DEMO MODE" badge whenever mock data is serving a response

## Phase 5 — Persona + incentive (the differentiator)
- [x] Arjun-specific copy, default origin/destination, comfort-first framing
- [x] Urgency toggle ("time to spare" vs "need to get there fast") changes ranking weights and whether incentive offers surface
- [x] `server/routes/incentives.js` + in-memory voucher store (points/vouchers balance, partner-brand visuals)
- [x] Rewards screen UI

## Phase 6 — Reliability & demo readiness
- [x] "Trigger test disruption" control — deterministic, reproducible for screen recording
- [x] Offline/underground behavior: cached last-known route, "reconnecting" state, no crashes
- [x] Mobile viewport testing via Playwright at 390×844 — real physical-device testing still needed before final recording (see `docs/WRITEUP.md#limitations`)
- [x] `README.md` — zero-friction fresh clone, `.env` instructions, zero-key demo mode
- [x] `docs/WRITEUP.md` — persona rationale, architecture, assumptions, limitations, measurement methodology, thundering-herd honesty note

## What's left before submission

- Verify on an actual phone browser, not just emulated viewport.
- Optionally wire the real OneMap client into `/api/journey` if credentials become available.
- Product/design polish pass based on PM feedback (this was built as a first complete pass, per
  the brief's own "trial and error" framing).
