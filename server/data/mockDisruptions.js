// Shaped like LTA's real TrainServiceAlerts/RoadWorks/PlannedBusRoutes
// responses so the ranking engine and frontend don't need a separate code
// path for mock vs. live data — only the source of the JSON differs.
export const MOCK_DISRUPTIONS = {
  isMock: true,
  trainAlerts: [
    {
      id: 'demo-ne-crowding',
      line: 'North East Line',
      status: 'Alert',
      affectedStations: ['Sengkang', 'Serangoon', 'Dhoby Ghaut'],
      message:
        'Heavy crowding reported on North East Line towards Dhoby Ghaut during evening peak. Consider the Circle Line via Serangoon instead.',
      createdAt: null,
    },
  ],
  roadWorks: [],
  plannedBusRoutes: [],
}

// A more dramatic, deterministic scenario for screen-recording a reliable
// demo without waiting for a real disruption to occur.
export const DEMO_TRIGGER_DISRUPTIONS = {
  isMock: true,
  trainAlerts: [
    {
      id: 'demo-trigger-ne-fault',
      line: 'North East Line',
      status: 'Disruption',
      affectedStations: ['Sengkang', 'Dhoby Ghaut'],
      message:
        'Train fault between Sengkang and Dhoby Ghaut. Free bridging buses available. Expect delays of around 15 minutes on the North East Line.',
      createdAt: null,
    },
  ],
  roadWorks: [],
  plannedBusRoutes: [],
}
