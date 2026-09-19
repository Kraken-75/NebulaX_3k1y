// Client-side fallback for static hosting. The backend remains the source of
// truth when available; re-exporting its pure station module keeps the full
// MRT/LRT directory identical in the hosted and API-backed flows.
export { STATION_DIRECTORY as FALLBACK_STATIONS } from '../../server/data/stationDirectory.js'
