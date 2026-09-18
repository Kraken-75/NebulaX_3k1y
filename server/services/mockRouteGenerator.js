// Generates 3 plausible routes for ANY selected from/to station pair, not
// just Arjun's hand-crafted Punggol -> one-north corridor
// (server/data/mockJourneys.js). There's no real routing engine behind this
// — no OneMap/routing credentials exist in this environment (see
// docs/WRITEUP.md) — so travel times are simulated from straight-line
// distance. The transfer point for a cross-line trip, though, is real: we
// look up an actual station in STATION_DIRECTORY that serves both lines
// (its `lines` array) instead of inventing a geometric midpoint, so the map
// bends at the real interchange and the route detail sheet names it, for
// any pair, not just the one this was first reported against.
// Always still labeled demo/mock data; never presented as a real API result.

import { STATION_DIRECTORY } from '../data/stationDirectory.js'

const EARTH_RADIUS_KM = 6371

function haversineKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function servesLine(station, line) {
  return station.lines ? station.lines.includes(line) : station.line === line
}

// Real interchange lookup: any directory station tagged with both lines. If
// several exist (e.g. more than one CCL/DTL interchange), pick the one that
// minimizes total travel distance (from -> candidate -> to) so the "detour"
// stays geographically sensible instead of picking an arbitrary match.
function findInterchange(from, to) {
  const candidates = STATION_DIRECTORY.filter(
    (station) => servesLine(station, from.line) && servesLine(station, to.line),
  )
  if (candidates.length === 0) return null
  return candidates.reduce((best, station) => {
    const dist = haversineKm(from, station) + haversineKm(station, to)
    const bestDist = haversineKm(from, best) + haversineKm(best, to)
    return dist < bestDist ? station : best
  })
}

function midpoint(a, b) {
  return { name: 'Interchange', lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2, line: null }
}

// When from/to are on different lines, this models a transfer at a real
// named interchange station (looked up above) instead of a fake combined
// label like "North East Line / North South Line" — that combined string
// could never match a real line name anywhere else in the app (map
// coloring, disruption detection), which is the original bug this fixes.
// Falls back to the old geometric midpoint only for the rare pair with no
// tagged interchange in the directory, so a data gap degrades gracefully
// instead of throwing.
function transitLegs(from, to, minutes) {
  if (from.line === to.line) {
    return [{ mode: 'train', from, to, minutes, line: from.line }]
  }
  const transfer = findInterchange(from, to) || midpoint(from, to)
  const firstHalf = Math.round(minutes / 2)
  return [
    { mode: 'train', from, to: transfer, minutes: firstHalf, line: from.line },
    { mode: 'train', from: transfer, to, minutes: minutes - firstHalf, line: to.line },
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
