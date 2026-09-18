import { STATIONS as S } from './stations.js'

// Labeled demo fixture for Arjun's Punggol -> one-north commute. Used whenever
// OneMap credentials aren't configured or the live routing call fails, so the
// route planner always has something legible to show (per the brief: "quiet
// normally" live feeds must not block a demoable route).
//
// Rail and bus only, no cycling, and every walking leg stays under the
// 10-minute cap — a candidate that couldn't meet that would be discarded or
// rerouted rather than shown.
export const MOCK_JOURNEYS = {
  key: 'punggol-onenorth',
  isMock: true,
  routes: [
    {
      id: 'fastest',
      label: 'Fastest',
      totalMinutes: 42,
      uncertaintyMinutes: 6,
      legs: [
        { mode: 'walk', from: S.punggolHome, to: S.punggolLrt, minutes: 6 },
        { mode: 'lrt', from: S.punggolLrt, to: S.sengkang, minutes: 4, line: 'Punggol LRT' },
        { mode: 'train', from: S.sengkang, to: S.dhobyGhaut, minutes: 16, line: 'North East Line' },
        { mode: 'train', from: S.dhobyGhaut, to: S.oneNorth, minutes: 14, line: 'Circle Line' },
        { mode: 'walk', from: S.oneNorth, to: S.oneNorth, minutes: 2 },
      ],
    },
    {
      id: 'comfort',
      label: 'Comfort (less crowded)',
      totalMinutes: 49,
      uncertaintyMinutes: 4,
      legs: [
        { mode: 'walk', from: S.punggolHome, to: S.onePunggolBus, minutes: 8 },
        { mode: 'bus', from: S.onePunggolBus, to: S.serangoon, minutes: 18, line: 'Bus 83' },
        { mode: 'train', from: S.serangoon, to: S.buonaVista, minutes: 19, line: 'Circle Line' },
        { mode: 'walk', from: S.buonaVista, to: S.oneNorth, minutes: 4 },
      ],
    },
    {
      id: 'sheltered',
      label: 'Sheltered walk-light',
      totalMinutes: 46,
      uncertaintyMinutes: 5,
      legs: [
        { mode: 'walk', from: S.punggolHome, to: S.punggolLrt, minutes: 5 },
        { mode: 'lrt', from: S.punggolLrt, to: S.sengkang, minutes: 4, line: 'Punggol LRT' },
        { mode: 'train', from: S.sengkang, to: S.dhobyGhaut, minutes: 16, line: 'North East Line' },
        { mode: 'train', from: S.dhobyGhaut, to: S.buonaVista, minutes: 12, line: 'Circle Line' },
        { mode: 'walk', from: S.buonaVista, to: S.oneNorth, minutes: 4 },
      ],
    },
  ],
}

// Generated as an extra candidate only when a disruption declares a
// dedicated bridging bus service (see server/data/mockDisruptions.js'
// bridgingBusDeclared flag and server/routes/journey.js). Real transit apps
// (Google Maps, Citymapper, MyTransport) don't surface bridging services as
// first-class route options — this app deliberately does, per the brief.
export const BRIDGING_BUS_ROUTE = {
  id: 'bridging',
  label: 'Bridging bus (NEL relief)',
  totalMinutes: 47,
  uncertaintyMinutes: 10,
  legs: [
    { mode: 'walk', from: S.punggolHome, to: S.punggolLrt, minutes: 5 },
    { mode: 'lrt', from: S.punggolLrt, to: S.sengkang, minutes: 4, line: 'Punggol LRT' },
    { mode: 'bus', from: S.sengkang, to: S.dhobyGhaut, minutes: 22, line: 'NEL Bridging Bus' },
    { mode: 'train', from: S.dhobyGhaut, to: S.oneNorth, minutes: 14, line: 'Circle Line' },
    { mode: 'walk', from: S.oneNorth, to: S.oneNorth, minutes: 2 },
  ],
}

// "Ask Me" same-day override fixture: a single lightweight route for when
// Arjun isn't heading to his usual work station today. Deliberately just one
// route, not a 3-way ranked comparison — this is a today-only override, not
// a second fully-modeled corridor.
export const ASK_ME_ALT_JOURNEY = {
  key: 'punggol-rafflesplace',
  isMock: true,
  routes: [
    {
      id: 'today-only',
      label: "Today's route",
      totalMinutes: 38,
      uncertaintyMinutes: 5,
      legs: [
        { mode: 'walk', from: S.punggolHome, to: S.punggolLrt, minutes: 6 },
        { mode: 'lrt', from: S.punggolLrt, to: S.sengkang, minutes: 4, line: 'Punggol LRT' },
        { mode: 'train', from: S.sengkang, to: S.dhobyGhaut, minutes: 16, line: 'North East Line' },
        { mode: 'train', from: S.dhobyGhaut, to: S.rafflesPlace, minutes: 8, line: 'North East Line' },
        { mode: 'walk', from: S.rafflesPlace, to: S.rafflesPlace, minutes: 3 },
      ],
    },
  ],
}
