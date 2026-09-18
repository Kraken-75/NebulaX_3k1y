import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { rankRoutes } from '../services/rankingEngine.js'
import { getPlatformCrowding, getTrainServiceAlerts } from '../services/ltaClient.js'
import { getWeather } from '../services/weatherClient.js'
import { getWalkCycleRoute } from '../services/osrmClient.js'
import { getRealBusLoad, getMockLiveBusCrowding } from '../services/busArrivalClient.js'
import { generateGenericRoutes } from '../services/mockRouteGenerator.js'
import { MOCK_JOURNEYS, BRIDGING_BUS_ROUTE } from '../data/mockJourneys.js'
import { STATION_DIRECTORY } from '../data/stationDirectory.js'
import { MOCK_CROWDING, DEMO_TRIGGER_CROWDING } from '../data/mockCrowding.js'
import { MOCK_DISRUPTIONS, DEMO_TRIGGER_DISRUPTIONS } from '../data/mockDisruptions.js'
import { MOCK_WEATHER } from '../data/mockWeather.js'
import { MOCK_TELEGRAM_FEED } from '../data/mockTelegramFeed.js'
import { isDemoDisruptionActive } from '../state/demoState.js'

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
      disruptions = DEMO_TRIGGER_DISRUPTIONS
    } else {
      crowding = await getPlatformCrowding().catch(() => MOCK_CROWDING)
      try {
        const trainAlerts = await getTrainServiceAlerts()
        disruptions = { isMock: false, trainAlerts, roadWorks: [], plannedBusRoutes: [] }
      } catch {
        disruptions = MOCK_DISRUPTIONS
      }
    }

    const bridgingBusDeclared = disruptions.trainAlerts.some(
      (alert) => alert.status === 'Disruption' && alert.bridgingBusDeclared,
    )

    const journeyData = await getJourneys(fromId, toId, { includeBridgingBus: bridgingBusDeclared })

    if (bridgingBusDeclared && journeyData.isArjunCorridor) {
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
      // channel, entirely synthetic — see mockTelegramFeed.js) only shown
      // alongside an actual disruption on Arjun's modeled corridor.
      communityUpdates: bridgingBusDeclared && journeyData.isArjunCorridor ? MOCK_TELEGRAM_FEED : [],
      routes: ranked,
    })
  }),
)

export default router
