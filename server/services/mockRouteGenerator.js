// Generates 3 plausible routes for ANY selected from/to station pair, not
// just Arjun's hand-crafted Punggol -> one-north corridor
// (server/data/mockJourneys.js). There's no real transit topology behind
// this — no OneMap/routing engine credentials exist in this environment
// (see docs/WRITEUP.md) — so this simulates a believable trip from straight-
// line distance instead of pretending to know the real line-by-line path.
// Always still labeled demo/mock data; never presented as a real API result.

const EARTH_RADIUS_KM = 6371

function haversineKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function transitLabel(from, to) {
  return from.line === to.line ? from.line : `${from.line} / ${to.line}`
}

// Every walk leg here stays comfortably under the 10-minute cap by
// construction (fixed short values), matching the rail/bus-only,
// no-cycling constraint used everywhere else in the app.
// Walk legs use the station's own point at both ends (from->from, to->to)
// rather than a distinct home/office address, since arbitrary stations
// don't have one — a symbolic "last-mile" time without claiming a specific
// walking path, the same simplification the hand-crafted corridor fixture
// uses at its own destination end.
export function generateGenericRoutes(from, to) {
  const distanceKm = haversineKm(from, to)

  const trainMinutes = Math.max(4, Math.round((distanceKm / 32) * 60) + 3)
  const busMinutes = Math.max(6, Math.round((distanceKm / 20) * 60) + 5)
  const altTrainMinutes = Math.max(4, Math.round((distanceKm / 28) * 60) + 5)

  const routes = [
    {
      id: 'fastest',
      label: 'Fastest',
      totalMinutes: 5 + trainMinutes + 4,
      uncertaintyMinutes: 5,
      legs: [
        { mode: 'walk', from, to: from, minutes: 5 },
        { mode: 'train', from, to, minutes: trainMinutes, line: transitLabel(from, to) },
        { mode: 'walk', from: to, to, minutes: 4 },
      ],
    },
    {
      id: 'comfort',
      label: 'Comfort (less crowded)',
      totalMinutes: 7 + busMinutes + 4,
      uncertaintyMinutes: 6,
      legs: [
        { mode: 'walk', from, to: from, minutes: 7 },
        { mode: 'bus', from, to, minutes: busMinutes, line: `Bus ${100 + (from.name.length % 50)}` },
        { mode: 'walk', from: to, to, minutes: 4 },
      ],
    },
    {
      id: 'alternative',
      label: 'Alternative',
      totalMinutes: 5 + altTrainMinutes + 6,
      uncertaintyMinutes: 7,
      legs: [
        { mode: 'walk', from, to: from, minutes: 5 },
        { mode: 'train', from, to, minutes: altTrainMinutes, line: transitLabel(from, to) },
        { mode: 'walk', from: to, to, minutes: 6 },
      ],
    },
  ]

  return { isMock: true, routes }
}
