// Generates 2 plausible routes for ANY selected from/to station pair, not
// just Arjun's hand-crafted Punggol -> one-north corridor
// (server/data/mockJourneys.js). There's no real routing engine behind this
// — no OneMap/routing credentials exist in this environment (see
// docs/WRITEUP.md) — so travel times are simulated from straight-line
// distance. The transit path itself, though, is real: a shortest-path
// search over every real interchange in STATION_DIRECTORY (its `lines`
// array), not a single guessed transfer point, so a trip that genuinely
// needs 2 changes (e.g. Woodlands -> Bishan -> Serangoon -> Sengkang, since
// there's no single station serving both the North South and North East
// Lines as directly as going via the Circle Line) finds that real, shorter
// path instead of forcing everything through one interchange.
// Always still labeled demo/mock data; never presented as a real API result.

import { STATION_DIRECTORY } from '../data/stationDirectory.js'

const EARTH_RADIUS_KM = 6371
const AVG_TRAIN_KMH = 32
// Flat per-leg overhead (dwell/acceleration, plus the walk to a connecting
// platform on any leg after the first) — applied uniformly rather than
// only to "the" transfer, so Dijkstra below naturally penalizes an extra
// change instead of only counting raw distance, matching how a commuter
// actually experiences one.
const LEG_OVERHEAD_MINUTES = 4
// Rough average spacing between adjacent stations on the real SG MRT
// network (denser downtown, sparser in the suburbs) — used only to turn a
// leg's real distance into an approximate "~N stops" figure, not a real
// stop list (this app has no data source for one).
const AVG_STATION_SPACING_KM = 1.2

function haversineKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function stationLines(station) {
  return station.lines || (station.line ? [station.line] : [])
}

function sharedLine(a, b) {
  const linesB = stationLines(b)
  return stationLines(a).find((line) => linesB.includes(line)) || null
}

// Every real interchange (more than one line) — the only stations that can
// ever appear as a mid-route waypoint. A trip's own from/to stations are
// added as the start/end nodes in shortestPath() below.
const INTERCHANGES = STATION_DIRECTORY.filter((station) => (station.lines?.length || 0) > 1)

function legTimeMinutes(distanceKm) {
  return Math.max(2, Math.round((distanceKm / AVG_TRAIN_KMH) * 60) + LEG_OVERHEAD_MINUTES)
}

// Dijkstra over a small graph: nodes are this trip's own from/to stations
// plus every real interchange; two nodes are connected only if they
// actually share a rail line, weighted by the realistic travel time of
// that hop (legTimeMinutes, so extra transfers cost real minutes, not just
// distance). This finds the true fastest path even when it needs more than
// one change — a naive "one shared interchange" search would miss a
// shorter 2-transfer route entirely whenever a (longer) 1-transfer path
// also happens to exist, since it would only ever look for a single
// common interchange, never a chain of them.
function shortestPath(from, to) {
  if (from.id === to.id) return [from]

  const nodes = [from, to, ...INTERCHANGES.filter((station) => station.id !== from.id && station.id !== to.id)]
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const dist = new Map(nodes.map((node) => [node.id, Infinity]))
  const prev = new Map()
  dist.set(from.id, 0)
  const unvisited = new Set(nodes.map((node) => node.id))

  while (unvisited.size > 0) {
    let currentId = null
    let currentDist = Infinity
    for (const id of unvisited) {
      if (dist.get(id) < currentDist) {
        currentDist = dist.get(id)
        currentId = id
      }
    }
    if (currentId === null || currentId === to.id) break
    unvisited.delete(currentId)

    const current = byId.get(currentId)
    for (const id of unvisited) {
      const line = sharedLine(current, byId.get(id))
      if (!line) continue
      const alt = currentDist + legTimeMinutes(haversineKm(current, byId.get(id)))
      if (alt < dist.get(id)) {
        dist.set(id, alt)
        prev.set(id, currentId)
      }
    }
  }

  if (dist.get(to.id) === Infinity) return null

  const path = [to]
  let cursor = to.id
  while (cursor !== from.id) {
    const prevId = prev.get(cursor)
    if (prevId === undefined) return null
    path.unshift(byId.get(prevId))
    cursor = prevId
  }
  return path
}

function midpoint(a, b) {
  return { name: 'Interchange', lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2, line: null }
}

// Builds the actual transit legs (each on one real line) from the
// shortest-path waypoint sequence above. Falls back to the old single
// geometric-midpoint transfer only if no path exists at all through the
// directory's tagged interchanges (shouldn't happen for a real SG pair,
// but a data gap should degrade gracefully rather than crash).
function transitLegs(from, to) {
  const path = shortestPath(from, to)
  if (!path) {
    const transfer = midpoint(from, to)
    const distanceKm = haversineKm(from, to)
    const half = legTimeMinutes(distanceKm / 2)
    return [
      { mode: 'train', from, to: transfer, minutes: half, line: from.line },
      { mode: 'train', from: transfer, to, minutes: half, line: to.line },
    ]
  }

  const legs = []
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]
    const b = path[i + 1]
    const distanceKm = haversineKm(a, b)
    legs.push({
      mode: 'train',
      from: a,
      to: b,
      minutes: legTimeMinutes(distanceKm),
      line: sharedLine(a, b) || a.line,
      estimatedStops: Math.max(1, Math.round(distanceKm / AVG_STATION_SPACING_KM)),
    })
  }
  return legs
}

// Every walk leg here stays comfortably under the 10-minute cap by
// construction (fixed short values), matching the rail/bus-only,
// no-cycling constraint used everywhere else in the app.
// Walk legs use the station's own point at both ends (from->from, to->to)
// rather than a distinct home/office address, since arbitrary stations
// don't have one — a symbolic "last-mile" time without claiming a specific
// walking path, the same simplification the hand-crafted corridor fixture
// uses at its own destination end.
//
// Only 2 routes, not 3: an earlier version also generated a 3rd "Alternative"
// train route, but since this generator has no real second path to offer, it
// always ended up an exact duplicate of "Fastest" (same real shortest path)
// with only its made-up duration differing — a fabricated-looking duplicate,
// not a genuine alternative. Better to honestly offer fewer options than a
// route that only pretends to be different. "Comfort" (bus) is the one real
// alternative this generator can produce.
export function generateGenericRoutes(from, to) {
  const distanceKm = haversineKm(from, to)
  const busMinutes = Math.max(6, Math.round((distanceKm / 20) * 60) + 5)

  const fastestTransit = transitLegs(from, to)
  const fastestTransitMinutes = fastestTransit.reduce((sum, leg) => sum + leg.minutes, 0)

  const routes = [
    {
      id: 'fastest',
      label: 'Fastest',
      totalMinutes: 5 + fastestTransitMinutes + 4,
      uncertaintyMinutes: 5,
      legs: [{ mode: 'walk', from, to: from, minutes: 5 }, ...fastestTransit, { mode: 'walk', from: to, to, minutes: 4 }],
    },
    {
      id: 'comfort',
      label: 'Comfort (less crowded)',
      totalMinutes: 7 + busMinutes + 4,
      uncertaintyMinutes: 6,
      legs: [
        { mode: 'walk', from, to: from, minutes: 7 },
        // No live LTA DataMall key is configured in this environment (see
        // docs/WRITEUP.md), so there's no way to look up a real bus stop
        // name or verify a real service actually runs this pair — rather
        // than invent a specific service number that might not exist,
        // this is left honestly generic (the "BUS" mode badge, no number)
        // and boards/alights at the MRT station itself, not a fabricated
        // bus stop name.
        { mode: 'bus', from, to, minutes: busMinutes, line: 'Bus (simulated route)' },
        { mode: 'walk', from: to, to, minutes: 4 },
      ],
    },
  ]

  return { isMock: true, routes }
}
