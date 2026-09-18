// Waypoints for Arjun's specific, fully-modeled demo corridor (Punggol ->
// one-north) used by mockJourneys.js's hand-crafted fixture routes and the
// bridging bus. Approximate coordinates — precise enough for demo map
// rendering, not surveyed. For any other from/to pair, routes come from
// server/services/mockRouteGenerator.js against the broader
// server/data/stationDirectory.js instead.
export const STATIONS = {
  punggolHome: { name: 'Punggol Park Connector (near home)', lat: 1.4041, lng: 103.9023 },
  punggolLrt: { name: 'Punggol LRT / MRT Interchange', lat: 1.4054, lng: 103.9023 },
  sengkang: { name: 'Sengkang MRT/LRT', lat: 1.3915, lng: 103.895 },
  serangoon: { name: 'Serangoon MRT', lat: 1.3499, lng: 103.873 },
  dhobyGhaut: { name: 'Dhoby Ghaut MRT', lat: 1.2986, lng: 103.8455 },
  buonaVista: { name: 'Buona Vista MRT', lat: 1.3067, lng: 103.79 },
  oneNorth: { name: 'one-north MRT', lat: 1.2995, lng: 103.7876 },
  onePunggolBus: { name: 'One Punggol Bus Interchange', lat: 1.4046, lng: 103.9068 },
}
