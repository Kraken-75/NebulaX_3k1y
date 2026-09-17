# Repo audit — pre-build (PS2 Smart Commuter Companion)

Date: 2026-09-17. Scope: full read of `main` and `design-1` (every tracked file, no skimming).

## `main`

Unmodified `npm create vite@latest -- --template react` output.

- `src/App.jsx` is the default counter demo, `src/index.css`/`App.css` are the default template styles, `README.md` is the default Vite README.
- No backend, no `.env.example`, no map, no routing, no persona content, no tests.
- Verdict: a clean, empty slate. Nothing to salvage or discard.

## `design-1`

A small React SPA with three tabs (`home` / `announcements` / `navigation`) switched via local state in `App.jsx`, plus an unused Express server.

What's real vs. fake:

| Piece | Status |
|---|---|
| `src/pages/MainPage.jsx`, `NavigationPage.jsx`, `AnnouncementsPage.jsx` | Real, working UI shells, no routing/map/persona logic |
| `src/data.js` (`routes`, `announcements`) | Hardcoded fake data, 3 static routes, filtered client-side by string match |
| `public/train-alerts.json` | A **committed snapshot** of one live LTA `TrainServiceAlerts` fetch (dated 2026-09-14/15), used as if it were live data — not labeled as demo/stale data anywhere in the UI |
| `server.js` (Express, port 3001) | **Dead code.** Its only route, `/api/train-status`, is never called by the frontend. It also shells out via `exec('node train-alerts.cjs')` per request — spawns a child process per request instead of importing a function; would not survive load and duplicates the polling `train-alerts.cjs` already does on its own `setInterval`. |
| `train-alerts.cjs` | Standalone CommonJS script, polls LTA `TrainServiceAlerts` every 60s and writes straight to `public/train-alerts.json`, which the frontend then fetches as a static file — i.e. **the frontend reads a file the backend wrote to disk**, no HTTP API boundary at all. Hardcodes `const accountKey = 'YOUR_LTA_ACCOUNT_KEY'` directly in source (not committed as a real key, but the wrong pattern — should never be anywhere but `.env`). |
| Map / geospatial | Absent. No Leaflet, no Mapbox/Google, no OSM tiles, no attribution. |
| Routing engine | Absent. "Routes" are 3 hardcoded objects with string-matched from/to. |
| Crowding data (PCDRealTime/Forecast) | Absent. |
| Weather (data.gov.sg) | Absent. |
| Persona | Absent — copy is generic ("Bishan → Marina Bay" placeholder), not built around Arjun or anyone. |
| Urgency toggle | Absent. |
| Incentive / voucher / load-spreading system | Absent. |
| Mobile-first / responsive design | Not verified at phone widths; layout uses a fixed dark card shell, styling doesn't match the "official-but-friendly, elderly-legible" direction requested. |
| Login page | **Not found in any branch** (`main`, `design-1`, or any other remote branch). The brief describes one as already built by a teammate; it isn't in this repo. Proceeding without it — flagging rather than blocking, since it isn't one of the 3 mandatory capabilities. |
| Error handling | Only `AnnouncementsPage.jsx` has loading/error states; everything else has none. |

## Against the 3 mandatory capabilities

None are present in either branch, in any form:

1. **Route planning** — no routing engine, no multi-modal, no walking legs, no uncertainty indication.
2. **OSM geospatial base** — no map at all.
3. **Visual situation awareness** — no affected/unaffected segment rendering, no alternative-route comparison, no crowding visualization.

## Recommendation

Build on a new branch **off `main`**, not `design-1`. `design-1`'s only structurally reusable idea — tab-based page navigation (`home` / `announcements` / `navigation`-style) — is trivial to recreate correctly; keeping its files would mean first unwinding the dead Express server, the exec-per-request anti-pattern, the file-as-API-boundary anti-pattern, and the hardcoded-secret-placeholder pattern. Starting clean on top of `main`'s untouched scaffold is faster and safer than excavating `design-1`.

Nothing from `design-1` is copied verbatim; the fake `src/data.js` route/announcement shapes are used only as a loose reference for what fields a route/announcement object needs, then replaced with real API-shaped data plus labeled mock fixtures.
