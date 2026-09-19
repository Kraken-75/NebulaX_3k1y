import { calculateIncentiveTier, TIER_POINTS } from './incentiveCalculator.js'

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

export function routeIsAffected(route, disruptions) {
  return markAffectedLegs(route, disruptions).some((leg) => leg.affected)
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
  // Pick top 3 by score before assigning rank numbers, so ranks 1-3 always
  // refer to the actual survivors even when there were more than 3
  // candidates (e.g. a bridging bus added on top of the usual 3 routes).
  const top3 = scored.slice(0, 3)
  const ranked = top3.map((route, index) => ({ ...route, rank: index + 1 }))

  // Load-spreading incentive: offered on every alternative to the top pick
  // (not just one) when the commuter isn't rushing — every non-default
  // choice is asking for a trade-off, so every one gets compensated for it.
  // Naturally spreads load across 2 alternatives instead of funneling
  // everyone onto a single "the" alternate route (see docs/WRITEUP.md).
  const top = ranked[0]
  const TIER_ORDER = ['small', 'medium', 'large']
  let minTierIndex = -1 // ratchets up strictly with each worse-ranked alternative, below

  return ranked.map((route) => {
    if (urgency === 'rushing' || route.id === top.id) {
      return { ...route, incentiveEligible: false, incentiveTier: null, incentivePoints: 0 }
    }

    const { tier } = calculateIncentiveTier({
      topCrowdScore: top.crowdScore,
      alternativeCrowdScore: route.crowdScore,
      timeDeltaMinutes: route.totalMinutes - top.totalMinutes,
    })

    // Routes are processed in rank order (best alternative first). Each
    // worse-ranked alternative is asking the commuter for a bigger sacrifice
    // than the one before it, so it must land on a strictly higher tier —
    // not merely "not lower" — capped at "large" once there's no room left.
    const tierIndex = Math.max(TIER_ORDER.indexOf(tier), minTierIndex + 1)
    minTierIndex = tierIndex
    const finalTier = TIER_ORDER[tierIndex]

    return {
      ...route,
      incentiveEligible: true,
      incentiveTier: finalTier,
      incentivePoints: TIER_POINTS[finalTier],
    }
  })
}
