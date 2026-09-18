import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { rankRoutes } from '../services/rankingEngine.js'
import { getPlatformCrowding, getTrainServiceAlerts } from '../services/ltaClient.js'
import { getWeather } from '../services/weatherClient.js'
import { getWalkCycleRoute } from '../services/osrmClient.js'
import { MOCK_JOURNEYS, ASK_ME_ALT_JOURNEY } from '../data/mockJourneys.js'
import { MOCK_CROWDING, DEMO_TRIGGER_CROWDING } from '../data/mockCrowding.js'
import { MOCK_DISRUPTIONS, DEMO_TRIGGER_DISRUPTIONS } from '../data/mockDisruptions.js'
import { MOCK_WEATHER } from '../data/mockWeather.js'
import { isDemoDisruptionActive } from '../state/demoState.js'

const router = Router()

// Real OneMap public-transport routing is not wired in end-to-end here
// (parsing its itinerary format needs a live token to verify against), so
// journeys currently always come from the labeled Punggol -> one-north demo
// fixture. The OneMap client in server/services/oneMapClient.js is a real,
// working call once ONEMAP_EMAIL/PASSWORD are set — swap it in here to
// replace getJourneys() below without touching the ranking engine or API
// shape. This keeps the fallback path honest instead of pretending.
async function getJourneys(source) {
  const routes = await Promise.all(
    source.routes.map(async (route) => ({
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
    })),
  )
  return { isMock: true, routes }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const urgency = req.query.urgency === 'rushing' ? 'rushing' : 'chill'
    const demoTriggered = isDemoDisruptionActive()
    // "Ask Me" same-day override: ?dest=today swaps in the one-off alternate
    // destination fixture instead of Arjun's usual work-station corridor.
    const usingAltDestination = req.query.dest === 'today'

    const journeyData = await getJourneys(usingAltDestination ? ASK_ME_ALT_JOURNEY : MOCK_JOURNEYS)

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
      usingAltDestination,
      urgency,
      weather,
      disruptions: disruptions.trainAlerts,
      routes: ranked,
    })
  }),
)

export default router
