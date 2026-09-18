// Shaped like LTA's real TrainServiceAlerts/RoadWorks/PlannedBusRoutes
// responses so the ranking engine and frontend don't need a separate code
// path for mock vs. live data — only the source of the JSON differs.
//
// estimatedDelayMinutes/bridgingBusDeclared model LTA's own real-world
// distinction: under ~30 min, commuters are told to use existing fare-free
// buses; past that, a dedicated bridging bus service gets declared. This
// drives which route candidates journey.js generates (see mockJourneys.js).
export const MOCK_DISRUPTIONS = {
  isMock: true,
  trainAlerts: [
    {
      id: 'demo-ne-crowding',
      line: 'North East Line',
      status: 'Alert',
      affectedStations: ['Sengkang', 'Serangoon', 'Dhoby Ghaut'],
      estimatedDelayMinutes: 0,
      bridgingBusDeclared: false,
      message:
        'Heavy crowding reported on North East Line towards Dhoby Ghaut during evening peak. Consider the Circle Line via Serangoon instead.',
      createdAt: null,
    },
  ],
  roadWorks: [],
  plannedBusRoutes: [],
}

// Three more dramatic, deterministic scenarios for screen-recording a
// reliable demo without waiting for a real disruption to occur — one per
// major line, so repeated demo triggers don't always show the exact same
// fault. server/state/demoState.js picks one at random on each trigger.
// Each still models the long-delay/bridging-bus case specifically — the
// short-delay, fare-free-bus-only case is already covered by the "Comfort"
// route in mockJourneys.js, which is always a viable candidate regardless of
// which scenario is active.
//
// Only the North East Line scenario has a hand-crafted bridging-bus route
// fixture (server/data/mockJourneys.js' BRIDGING_BUS_ROUTE, since it's built
// specifically for Arjun's Punggol -> one-north corridor, which crosses the
// NEL). server/routes/journey.js only adds that candidate when the *active*
// scenario's line is the North East Line — not for any bridgingBusDeclared
// disruption — so an East West or North South Line scenario never wrongly
// substitutes the NEL relief bus fixture for a fault on a different line.
export const DEMO_TRIGGER_SCENARIOS = [
  {
    isMock: true,
    trainAlerts: [
      {
        id: 'demo-trigger-ne-fault',
        line: 'North East Line',
        status: 'Disruption',
        // The full disrupted stretch, not just the two endpoints commuters
        // would see named in a headline alert.
        affectedStations: [
          'Sengkang',
          'Buangkok',
          'Hougang',
          'Kovan',
          'Serangoon',
          'Woodleigh',
          'Potong Pasir',
          'Boon Keng',
          'Farrer Park',
          'Little India',
          'Dhoby Ghaut',
        ],
        estimatedDelayMinutes: 45,
        bridgingBusDeclared: true,
        message:
          'Train fault between Sengkang and Dhoby Ghaut. Free bridging buses activated between Sengkang and Dhoby Ghaut (all stations). Expect delays of around 45 minutes on the North East Line.',
        createdAt: null,
      },
    ],
    roadWorks: [],
    plannedBusRoutes: [],
  },
  {
    isMock: true,
    trainAlerts: [
      {
        id: 'demo-trigger-ew-fault',
        line: 'East West Line',
        status: 'Disruption',
        affectedStations: ['Clementi', 'Dover', 'Buona Vista', 'Commonwealth', 'Queenstown', 'Redhill'],
        estimatedDelayMinutes: 40,
        bridgingBusDeclared: true,
        message:
          'Train fault between Clementi and Redhill. Free bridging buses activated between Clementi and Redhill (all stations). Expect delays of around 40 minutes on the East West Line.',
        createdAt: null,
      },
    ],
    roadWorks: [],
    plannedBusRoutes: [],
  },
  {
    isMock: true,
    trainAlerts: [
      {
        id: 'demo-trigger-ns-fault',
        line: 'North South Line',
        status: 'Disruption',
        affectedStations: ['Orchard', 'Somerset', 'Dhoby Ghaut', 'City Hall', 'Raffles Place'],
        estimatedDelayMinutes: 40,
        bridgingBusDeclared: true,
        message:
          'Train fault between Orchard and Raffles Place. Free bridging buses activated between Orchard and Raffles Place (all stations). Expect delays of around 40 minutes on the North South Line.',
        createdAt: null,
      },
    ],
    roadWorks: [],
    plannedBusRoutes: [],
  },
]
