export const announcements = [
  {
    id: 1,
    title: 'SMRT: Platform crowding update',
    time: '2 mins ago',
    detail:
      'Platform A at Dhoby Ghaut is experiencing higher-than-usual ridership. Please consider the next train or nearby stations.',
    tag: 'Operations',
  },
  {
    id: 2,
    title: 'Service notice: Downtown Line delay',
    time: '18 mins ago',
    detail:
      'A minor delay is affecting southbound trips between Bayfront and Marina Bay. Trains are running with reduced headway.',
    tag: 'Delay',
  },
  {
    id: 3,
    title: 'Event traffic advisory',
    time: '42 mins ago',
    detail:
      'Extra bus services are available around the stadium district. Expect congestion near exits between 6:30 PM and 8:00 PM.',
    tag: 'Event',
  },
]

export const routes = [
  {
    id: 1,
    from: 'Bishan',
    to: 'Marina Bay',
    mode: 'Train',
    time: '25 min',
    comfort: 'Low crowding',
    summary: 'Use Circle Line toward Marina Bay with one transfer at Serangoon.',
  },
  {
    id: 2,
    from: 'Bishan',
    to: 'Marina Bay',
    mode: 'Bus',
    time: '33 min',
    comfort: 'Moderate crowding',
    summary: 'Bus route 88 offers a direct trip with light traffic outside peak hours.',
  },
  {
    id: 3,
    from: 'Orchard',
    to: 'Stadium',
    mode: 'Train',
    time: '18 min',
    comfort: 'Busy platform',
    summary: 'Take the North-South Line to Kallang and transfer to the stadium shuttle.',
  },
]
