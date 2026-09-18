const CROWD_LEVEL_SCORE = { l: 0, m: 1, h: 2 }

function legCrowdScore(leg, crowding) {
  if (leg.mode === 'walk' || leg.mode === 'cycle') return 0
  const key = leg.line || leg.mode
  const level = crowding.stations?.[key]
  return CROWD_LEVEL_SCORE[level] ?? 1
}

function routeCrowdScore(route, crowding) {
  const transitLegs = route.legs.filter((leg) => leg.mode !== 'walk' && leg.mode !== 'cycle')
  if (transitLegs.length === 0) return 0
  const total = transitLegs.reduce((sum, leg) => sum + legCrowdScore(leg, crowding), 0)
  return total / transitLegs.length
}

function exposedMinutes(route) {
  return route.legs
    .filter((leg) => leg.mode === 'walk' || leg.mode === 'cycle')
    .reduce((sum, leg) => sum + leg.minutes, 0)
}

// Marks each individual leg as affected or not (not just the route as a
// whole) — mandatory capability 3 asks for segment-level clarity ("route
// display distinguishing affected vs unaffected segments"), so this needs to
// be leg granularity, and it's business logic, so it belongs here rather
// than being re-derived in the frontend.
function markAffectedLegs(route, disruptions) {
  // "Alert" is an informational/crowding notice, not a service impact — only
  // "Disruption" should mark a leg as affected and add the time penalty.
  // Crowding notices already feed the ranking through routeCrowdScore.
  const disruptive = disruptions.trainAlerts.filter((alert) => alert.status === 'Disruption')

  return route.legs.map((leg) => {
    // Scoped per-alert and per-line deliberately: a leg on the Circle Line
    // shouldn't be flagged just because it happens to depart from a station
    // that's also served by a disrupted North East Line — only a leg that's
    // actually on the disrupted line (or has no line of its own, e.g. a
    // bus/walk leg starting/ending inside the affected stretch) counts.
    const affected = disruptive.some((alert) => {
      if (!leg.line || leg.line !== alert.line) return false
      const stations = alert.affectedStations || []
      return stations.some(
        (station) =>
          leg.from?.name?.toLowerCase().includes(station.toLowerCase()) ||
          leg.to?.name?.toLowerCase().includes(station.toLowerCase()),
      )
    })
    return { ...leg, affected }
  })
}

// Weights differ by Arjun's own stated urgency for *this* trip, not a
// different persona — "I have time to spare" leans on comfort/crowding,
// "I need to get there fast" leans on raw time.
const URGENCY_WEIGHTS = {
  chill: { time: 1, crowding: 6, weather: 4 },
  rushing: { time: 2.5, crowding: 1.5, weather: 0.5 },
}

export function rankRoutes({ journeys, crowding, weather, disruptions, urgency = 'chill' }) {
  const weights = URGENCY_WEIGHTS[urgency] || URGENCY_WEIGHTS.chill

  const scored = journeys.map((route) => {
    const legs = markAffectedLegs(route, disruptions)
    const affected = legs.some((leg) => leg.affected)
    const crowdScore = routeCrowdScore(route, crowding)
    const exposed = exposedMinutes(route)
    const weatherPenalty = weather.isRaining ? exposed * weights.weather : 0
    // Kept small deliberately: a disrupted line already scores "high"
    // crowding (contributing crowding-weight points on its own), so a large
    // flat penalty here would double-count that and make any route avoiding
    // the disrupted line win outright regardless of how crowded it itself
    // is — which would mean the top pick could never end up crowded enough
    // to justify a load-spreading incentive. This is just a modest
    // tie-breaker on top of the crowding signal, not the primary deterrent.
    const disruptionPenalty = affected ? 2 : 0

    const score =
      route.totalMinutes * weights.time +
      crowdScore * weights.crowding +
      weatherPenalty +
      disruptionPenalty

    return { ...route, legs, crowdScore, affected, score }
  })

  scored.sort((a, b) => a.score - b.score)
  const ranked = scored.map((route, index) => ({ ...route, rank: index + 1 }))

  // Load-spreading incentive: only offered when the commuter isn't rushing
  // (per the urgency toggle), and only when the top route is meaningfully
  // more crowded than a close-enough alternative. The alternative is chosen
  // randomly among qualifying candidates each call, not a fixed runner-up —
  // recommending everyone to the *same* alternate route would just recreate
  // the crowding problem on that route (see docs/WRITEUP.md).
  let incentiveRouteId = null
  if (urgency !== 'rushing' && ranked.length > 1) {
    const top = ranked[0]
    const candidates = ranked.filter(
      (route) =>
        route.id !== top.id &&
        route.crowdScore < top.crowdScore - 0.4 &&
        route.totalMinutes - top.totalMinutes <= 10,
    )
    if (candidates.length > 0) {
      incentiveRouteId = candidates[Math.floor(Math.random() * candidates.length)].id
    }
  }

  return ranked.map((route) => ({
    ...route,
    incentiveEligible: route.id === incentiveRouteId,
  }))
}
