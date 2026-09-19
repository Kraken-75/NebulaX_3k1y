import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { rankRoutes, routeIsAffected } from '../services/rankingEngine.js'
import { getPlatformCrowding, getTrainServiceAlerts } from '../services/ltaClient.js'
import { getWeather } from '../services/weatherClient.js'
import { getWalkCycleRoute } from '../services/osrmClient.js'
import { getRealBusLoad, getMockLiveBusCrowding } from '../services/busArrivalClient.js'
import { generateGenericRoutes } from '../services/mockRouteGenerator.js'
import { generateHybridBusRailRoutes } from '../services/busAlternativeRouter.js'
import { MOCK_JOURNEYS, BRIDGING_BUS_ROUTE } from '../data/mockJourneys.js'
import { STATION_DIRECTORY } from '../data/stationDirectory.js'
import { MOCK_CROWDING, DEMO_TRIGGER_CROWDING } from '../data/mockCrowding.js'
import { MOCK_DISRUPTIONS } from '../data/mockDisruptions.js'
import { MOCK_WEATHER } from '../data/mockWeather.js'
import { MOCK_TELEGRAM_FEED } from '../data/mockTelegramFeed.js'
import { isDemoDisruptionActive, getActiveDemoScenario } from '../state/demoState.js'

const router = Router()

function findStation(id) {
  return STATION_DIRECTORY.find((station) => station.id === id)
}

async function withGeometry(route) {
  return {
    ...route,
    legs: await Promise.all(
      route.legs.map(async (leg) => {
        if (leg.mode !== 'walk' && leg.mode !== 'cycle') {
          return { ...leg, geometry: [[leg.from.lat, leg.from.lng], [leg.to.lat, leg.to.lng]] }
        }
        try {
          const osrm = await getWalkCycleRoute(leg.mode, leg.from, leg.to)
          return { ...leg, geometry: osrm.geometry }
        } catch {
          // OSRM demo server unreachable/rate-limited — fall back to a
          // straight line between the two points rather than failing.
          return { ...leg, geometry: [[leg.from.lat, leg.from.lng], [leg.to.lat, leg.to.lng]] }
        }
      }),
    ),
  }
}

// Real OneMap public-transport routing is not wired in end-to-end here
// (parsing its itinerary format needs a live token to verify against — see
// docs/WRITEUP.md). Arjun's specific Punggol -> one-north commute keeps its
// hand-crafted fixture (with the bridging-bus/disruption demo scenario);
// any other selected pair gets a generic, clearly-mocked route generated
// from real distance instead of pretending OneMap produced it.
async function getJourneys(fromId, toId, { includeBridgingBus }) {
  const isArjunCorridor = fromId === 'punggol' && toId === 'oneNorth'
  const baseRoutes = isArjunCorridor ? [...MOCK_JOURNEYS.routes] : generateGenericRoutes(findStation(fromId), findStation(toId)).routes
  if (includeBridgingBus && isArjunCorridor) {
    baseRoutes.push(BRIDGING_BUS_ROUTE)
  }
  const routes = await Promise.all(baseRoutes.map(withGeometry))
  return { isMock: true, routes, isArjunCorridor }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const urgency = req.query.urgency === 'rushing' ? 'rushing' : 'chill'
    const { fromId, toId } = req.query
    if (!fromId || !toId) {
      return res.status(400).json({ error: 'fromId and toId are required' })
    }
    if (!findStation(fromId)) {
      return res.status(400).json({ error: `Unknown station "${fromId}"` })
    }
    if (!findStation(toId)) {
      return res.status(400).json({ error: `Unknown station "${toId}"` })
    }

    const demoTriggered = isDemoDisruptionActive()

    // Disruption state is resolved first — whether a bridging bus candidate
    // even exists depends on it (see mockDisruptions.js' bridgingBusDeclared
    // flag, modeling LTA's real >30 min threshold).
    let crowding
    let disruptions
    if (demoTriggered) {
      crowding = DEMO_TRIGGER_CROWDING
      disruptions = getActiveDemoScenario()
    } else {
      crowding = await getPlatformCrowding().catch(() => MOCK_CROWDING)
      try {
        const trainAlerts = await getTrainServiceAlerts()
        disruptions = { isMock: false, trainAlerts, roadWorks: [], plannedBusRoutes: [] }
      } catch {
        disruptions = MOCK_DISRUPTIONS
      }
    }

    // BRIDGING_BUS_ROUTE (mockJourneys.js) is a hand-built fixture for one
    // specific line — the North East Line, since that's the line Arjun's own
    // corridor crosses. With 3 possible demo scenarios now (see
    // mockDisruptions.js), a bridgingBusDeclared flag alone isn't enough to
    // add it: an East West or North South Line fault also declares a
    // bridging bus, but this app has no route fixture for those, so adding
    // "NEL Bridging Bus" as a candidate for an unrelated line's fault would
    // be wrong. Scoped to the alert's own line matching the one fixture that
    // actually exists.
    const nelBridgingBusDeclared = disruptions.trainAlerts.some(
      (alert) => alert.status === 'Disruption' && alert.bridgingBusDeclared && alert.line === 'North East Line',
    )

    // The dedicated shuttle is an operational fastest-path response, not a
    // comfort/load-spreading option. Keeping it out of the chill candidate
    // pool prevents the same shuttle recommendation from appearing under
    // both choices and from incorrectly receiving an incentive there.
    const includeBridgingBus = nelBridgingBusDeclared && urgency === 'rushing'
    const journeyData = await getJourneys(fromId, toId, { includeBridgingBus })

    if (urgency === 'chill') {
      const affectedRoutes = journeyData.routes.filter((route) => routeIsAffected(route, disruptions))
      const bestAffectedRoute = [...affectedRoutes].sort((a, b) => a.totalMinutes - b.totalMinutes)[0]
      const busAlternatives = bestAffectedRoute
        ? generateHybridBusRailRoutes({
            baselineRoute: bestAffectedRoute,
            disruptions,
            to: findStation(toId),
            limit: 4,
          })
        : []

      // Keep one affected baseline so the comparison explains what is being
      // avoided, then let the normal ranking weights choose the best two bus
      // alternatives. If the supplied graph has no path for this pair, keep
      // the established route set rather than fabricating a connection.
      if (bestAffectedRoute && busAlternatives.length > 0) {
        journeyData.routes = await Promise.all([bestAffectedRoute, ...busAlternatives].map(withGeometry))
      }
    }

    if (includeBridgingBus && journeyData.isArjunCorridor) {
      // Priority 1: real v3/BusArrival Load field — will only succeed with
      // a real LTA key AND a real bus stop/service code, neither of which
      // exists for a temporary bridging service, so this realistically
      // always falls through to the mock live reading below. Left in place
      // so the real path is exercised the moment real data is available.
      const busCrowding = await getRealBusLoad('TEMP', 'NEL Bridging Bus').catch(() =>
        getMockLiveBusCrowding({ deterministic: demoTriggered }),
      )
      crowding = { ...crowding, stations: { ...crowding.stations, 'NEL Bridging Bus': busCrowding.level } }
    }

    const weather = await getWeather().catch(() => MOCK_WEATHER)

    const ranked = rankRoutes({
      journeys: journeyData.routes,
      crowding,
      weather,
      disruptions,
      urgency,
    })

    res.json({
      demoMode: journeyData.isMock || crowding.isMock || disruptions.isMock || weather.isMock,
      demoTriggered,
      urgency,
      weather,
      disruptions: disruptions.trainAlerts,
      // Secondary community-update signal (styled on the SGMRT Telegram
      // channel, entirely synthetic — see mockTelegramFeed.js). Its content
      // is itself written specifically about the NEL Sengkang-Dhoby Ghaut
      // fault, so it's only shown for that same scenario on Arjun's modeled
      // corridor — not for the East West/North South Line scenarios, which
      // it doesn't describe.
      communityUpdates: nelBridgingBusDeclared && journeyData.isArjunCorridor ? MOCK_TELEGRAM_FEED : [],
      routes: ranked,
    })
  }),
)

export default router
