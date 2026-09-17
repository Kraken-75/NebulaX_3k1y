import { fetchJson } from '../utils/fetchJson.js'

const OSRM_PROFILE = { walk: 'foot', cycle: 'bike' }

// Fallback for walk/cycle leg geometry when OneMap isn't configured. This is
// the public OSRM demo server: fine for hackathon-scale demo traffic, but per
// OSM/OSRM usage policy this must not be hammered in production — a real
// deployment would run its own OSRM instance or use GraphHopper.
export async function getWalkCycleRoute(mode, from, to) {
  const profile = OSRM_PROFILE[mode]
  if (!profile) {
    throw new Error(`OSRM fallback does not support mode "${mode}"`)
  }

  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`
  const data = await fetchJson(url, { timeoutMs: 5000 })

  const route = data?.routes?.[0]
  if (!route) {
    throw new Error('OSRM returned no route')
  }

  return {
    minutes: Math.round(route.duration / 60),
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  }
}
