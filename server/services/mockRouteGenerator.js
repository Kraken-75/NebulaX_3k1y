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

function midpoint(a, b) {
  return { name: 'Interchange', lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2, line: null }
}

// When from/to are on different lines, this models a single transfer at the
// geometric midpoint instead of one leg carrying a fake combined label like
// "North East Line / North South Line" — that combined string could never
// match a real line name anywhere else in the app (map coloring, disruption
// detection), which is exactly the bug this fixes. There's no real
// interchange-topology data behind this either — it's still a straight-line
// simulation, just one that produces 2 real, individually-correct line
// names instead of one fake compound one.
function transitLegs(from, to, minutes) {
  if (from.line === to.line) {
    return [{ mode: 'train', from, to, minutes, line: from.line }]
  }
  const mid = midpoint(from, to)
  const firstHalf = Math.round(minutes / 2)
  return [
    { mode: 'train', from, to: mid, minutes: firstHalf, line: from.line },
    { mode: 'train', from: mid, to, minutes: minutes - firstHalf, line: to.line },
  ]
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
        ...transitLegs(from, to, trainMinutes),
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
        ...transitLegs(from, to, altTrainMinutes),
        { mode: 'walk', from: to, to, minutes: 6 },
      ],
    },
  ]

  return { isMock: true, routes }
}
