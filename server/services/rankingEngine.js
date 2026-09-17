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

function isAffectedByDisruption(route, disruptions) {
  const affectedStationNames = disruptions.trainAlerts.flatMap(
    (alert) => alert.affectedStations || [],
  )
  const affectedLines = new Set(disruptions.trainAlerts.map((alert) => alert.line))

  // Station names in alerts (e.g. "Sengkang") are short forms; leg station
  // names are fuller labels (e.g. "Sengkang MRT/LRT"), so match by substring
  // rather than exact equality.
  const stationMatches = (stationName) =>
    Boolean(
      stationName &&
        affectedStationNames.some((affected) =>
          stationName.toLowerCase().includes(affected.toLowerCase()),
        ),
    )

  return route.legs.some((leg) => {
    const lineHit = leg.line && affectedLines.has(leg.line)
    const stationHit = stationMatches(leg.from?.name) || stationMatches(leg.to?.name)
    return Boolean(lineHit || stationHit)
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
    const crowdScore = routeCrowdScore(route, crowding)
    const exposed = exposedMinutes(route)
    const weatherPenalty = weather.isRaining ? exposed * weights.weather : 0
    const affected = isAffectedByDisruption(route, disruptions)
    const disruptionPenalty = affected ? 12 : 0

    const score =
      route.totalMinutes * weights.time +
      crowdScore * weights.crowding +
      weatherPenalty +
      disruptionPenalty

    return { ...route, crowdScore, affected, score }
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
