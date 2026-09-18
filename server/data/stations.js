// Approximate real-world coordinates for the corridor Arjun's persona uses
// (Punggol -> one-north). Precise enough for demo map rendering; not surveyed.
export const STATIONS = {
  punggolHome: { name: 'Punggol Park Connector (near home)', lat: 1.4041, lng: 103.9023 },
  punggolLrt: { name: 'Punggol LRT / MRT Interchange', lat: 1.4054, lng: 103.9023 },
  sengkang: { name: 'Sengkang MRT/LRT', lat: 1.3915, lng: 103.895 },
  serangoon: { name: 'Serangoon MRT', lat: 1.3499, lng: 103.873 },
  dhobyGhaut: { name: 'Dhoby Ghaut MRT', lat: 1.2986, lng: 103.8455 },
  buonaVista: { name: 'Buona Vista MRT', lat: 1.3067, lng: 103.79 },
  oneNorth: { name: 'one-north MRT', lat: 1.2995, lng: 103.7876 },
  onePunggolBus: { name: 'One Punggol Bus Interchange', lat: 1.4046, lng: 103.9068 },
  bishan: { name: 'Bishan MRT', lat: 1.3506, lng: 103.8485 },
  jurongEast: { name: 'Jurong East MRT', lat: 1.3329, lng: 103.7436 },
  changiBusinessPark: { name: 'Changi Business Park (Expo MRT)', lat: 1.335, lng: 103.9631 },
  rafflesPlace: { name: 'Raffles Place MRT', lat: 1.284, lng: 103.8515 },
}

// Signup picker options. Only the Punggol <-> one-north pair has a fully
// modeled route in this MVP (see mockJourneys.js) — the others are real
// selectable stations but intentionally unsupported for live routing, and
// server/routes/stations.js tells the frontend which is which rather than
// the frontend guessing or hardcoding that business rule itself.
export const HOME_OPTIONS = [
  { id: 'punggol', station: STATIONS.punggolLrt, supported: true },
  { id: 'sengkang', station: STATIONS.sengkang, supported: false },
  { id: 'bishan', station: STATIONS.bishan, supported: false },
]

export const WORK_OPTIONS = [
  { id: 'oneNorth', station: STATIONS.oneNorth, supported: true },
  { id: 'buonaVista', station: STATIONS.buonaVista, supported: false },
  { id: 'changiBusinessPark', station: STATIONS.changiBusinessPark, supported: false },
]
