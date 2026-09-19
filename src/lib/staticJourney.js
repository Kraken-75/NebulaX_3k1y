import { MOCK_JOURNEYS } from '../../server/data/mockJourneys.js'

// Firebase Hosting serves the Vite bundle but does not execute the Express
// server. Keep a small, honestly-labelled fixture for the default demo route
// so a hosted build remains usable when /api/journey is unavailable.
export function getStaticDemoJourney(urgency, { fromId, toId }) {
  if (fromId !== 'punggol' || toId !== 'oneNorth') return null

  const routes = MOCK_JOURNEYS.routes.map((route, rank) => ({
    ...route,
    rank: rank + 1,
    affected: false,
    incentiveEligible: false,
    incentiveTier: null,
    incentivePoints: 0,
    legs: route.legs.map((leg) => ({
      ...leg,
      geometry: [
        [leg.from.lat, leg.from.lng],
        [leg.to.lat, leg.to.lng],
      ],
    })),
  }))

  return {
    ...MOCK_JOURNEYS,
    urgency,
    routes,
    disruptions: [],
    communityUpdates: [],
    demoMode: true,
    demoTriggered: false,
    staticFallback: true,
    weather: { isMock: true, isRaining: false },
  }
}
