# Build plan — ordered by mandatory-first, demoable-early

Checked items are done; this file is updated as we go rather than written once at the end.

## Phase 0 — Foundation (blocks everything else)
- [x] Audit existing branches (`docs/AUDIT.md`)
- [ ] Branch `feature/ps2-complete-build` off `main`
- [ ] `.env.example` + confirm `.env*` in `.gitignore`
- [ ] Backend scaffold (`server/`): Express app, error-handling middleware, mock-data fallback pattern
- [ ] Frontend scaffold: page shell, mobile-first CSS baseline, Arjun persona defaults, urgency toggle state

## Phase 1 — Mandatory capability 1: Route planning
- [ ] `server/services/oneMapClient.js` — OneMap routing (real, needs token) with graceful fallback
- [ ] `server/services/osrmClient.js` — public OSRM fallback for walk/cycle legs
- [ ] `server/data/mockJourneys.js` — labeled demo itinerary for Arjun's Punggol → one-north bike+LRT/bus trip
- [ ] `server/routes/journey.js` — `GET /api/journey` returns 3 ranked door-to-door routes with timing + uncertainty band
- [ ] Frontend `PlannerPage` + `RouteCard` consuming only `/api/journey`

## Phase 2 — Mandatory capability 2: OSM geospatial base
- [ ] `react-leaflet` + OSM raster tiles (public demo endpoint, rate-limited use only, README notes MapTiler/Stadia swap for prod)
- [ ] "© OpenStreetMap contributors" attribution visible on map
- [ ] Route polyline rendered on map from `/api/journey` response

## Phase 3 — Mandatory capability 3: Visual situation awareness
- [ ] Affected vs. unaffected segment styling on map + route card
- [ ] 3 alternative routes shown side-by-side for comparison
- [ ] Crowding badge per route/segment (renders from cached data, no visible lag)
- [ ] Time/delay cost displayed per route

## Phase 4 — Data integration (real API first, mock fallback always)
- [ ] `server/services/ltaClient.js` — `TrainServiceAlerts`, `PCDRealTime`/`PCDForecast`, `v3/BusArrival`, `RoadWorks`, `PlannedBusRoutes`
- [ ] `server/services/weatherClient.js` — data.gov.sg nowcast (comfort/shelter weighting)
- [ ] `server/services/rankingEngine.js` — combines crowding + weather + disruptions + urgency setting into the 3 ranked routes; diversifies which "less popular" alternative gets the incentive to avoid thundering-herd
- [ ] "DEMO MODE" badge whenever mock data is serving a response

## Phase 5 — Persona + incentive (the differentiator)
- [ ] Arjun-specific copy, default origin/destination, comfort-first framing
- [ ] Urgency toggle ("time to spare" vs "need to get there fast") changes ranking weights and whether incentive offers surface
- [ ] `server/routes/incentives.js` + mock JSON/in-memory voucher store (points/vouchers balance, partner-brand visuals)
- [ ] Rewards screen UI

## Phase 6 — Reliability & demo readiness
- [ ] "Trigger test disruption" control — deterministic, reproducible for screen recording
- [ ] Offline/underground behavior: cached last-known route, "reconnecting" state, no crashes
- [ ] Mobile viewport testing (actual phone width, not just devtools)
- [ ] `README.md` — zero-friction fresh clone, `.env` instructions, zero-key demo mode
- [ ] `docs/WRITEUP.md` — persona rationale, architecture, assumptions, limitations, measurement methodology, thundering-herd honesty note
