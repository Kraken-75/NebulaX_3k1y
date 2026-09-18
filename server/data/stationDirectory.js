// Curated set of real Singapore MRT/LRT stations for the from/to
// autocomplete and the generic mock route generator. Approximate
// coordinates — precise enough for demo map rendering, not surveyed.
// `line` is each station's primary/first-tagged line, used to label the
// generated route's main transit leg; interchanges just pick one.
export const STATION_DIRECTORY = [
  // North South Line
  { id: 'jurongEast', name: 'Jurong East', lat: 1.3329, lng: 103.7436, line: 'North South Line' },
  { id: 'bishan', name: 'Bishan', lat: 1.3506, lng: 103.8485, line: 'North South Line' },
  { id: 'angMoKio', name: 'Ang Mo Kio', lat: 1.3699, lng: 103.8496, line: 'North South Line' },
  { id: 'novena', name: 'Novena', lat: 1.3203, lng: 103.8438, line: 'North South Line' },
  { id: 'orchard', name: 'Orchard', lat: 1.3041, lng: 103.8318, line: 'North South Line' },
  { id: 'cityHall', name: 'City Hall', lat: 1.2931, lng: 103.852, line: 'North South Line' },
  { id: 'rafflesPlace', name: 'Raffles Place', lat: 1.284, lng: 103.8515, line: 'North South Line' },
  { id: 'marinaBay', name: 'Marina Bay', lat: 1.276, lng: 103.8546, line: 'North South Line' },
  { id: 'woodlands', name: 'Woodlands', lat: 1.437, lng: 103.7864, line: 'North South Line' },
  { id: 'yishun', name: 'Yishun', lat: 1.4295, lng: 103.8353, line: 'North South Line' },

  // East West Line
  { id: 'clementi', name: 'Clementi', lat: 1.3151, lng: 103.7654, line: 'East West Line' },
  { id: 'buonaVista', name: 'Buona Vista', lat: 1.3067, lng: 103.79, line: 'East West Line' },
  { id: 'outramPark', name: 'Outram Park', lat: 1.2802, lng: 103.8395, line: 'East West Line' },
  { id: 'tanjongPagar', name: 'Tanjong Pagar', lat: 1.2765, lng: 103.8459, line: 'East West Line' },
  { id: 'bugis', name: 'Bugis', lat: 1.3006, lng: 103.8559, line: 'East West Line' },
  { id: 'payaLebar', name: 'Paya Lebar', lat: 1.3177, lng: 103.8926, line: 'East West Line' },
  { id: 'tampines', name: 'Tampines', lat: 1.3546, lng: 103.9453, line: 'East West Line' },
  { id: 'pasirRis', name: 'Pasir Ris', lat: 1.3731, lng: 103.9494, line: 'East West Line' },
  { id: 'changiAirport', name: 'Changi Airport', lat: 1.3572, lng: 103.988, line: 'East West Line' },
  { id: 'boonLay', name: 'Boon Lay', lat: 1.3389, lng: 103.7064, line: 'East West Line' },

  // North East Line
  { id: 'harbourfront', name: 'HarbourFront', lat: 1.2653, lng: 103.8218, line: 'North East Line' },
  { id: 'chinatown', name: 'Chinatown', lat: 1.2846, lng: 103.844, line: 'North East Line' },
  { id: 'clarkeQuay', name: 'Clarke Quay', lat: 1.2884, lng: 103.8465, line: 'North East Line' },
  { id: 'dhobyGhaut', name: 'Dhoby Ghaut', lat: 1.2986, lng: 103.8455, line: 'North East Line' },
  { id: 'littleIndia', name: 'Little India', lat: 1.3066, lng: 103.8496, line: 'North East Line' },
  { id: 'farrerPark', name: 'Farrer Park', lat: 1.3125, lng: 103.8535, line: 'North East Line' },
  { id: 'serangoon', name: 'Serangoon', lat: 1.3499, lng: 103.873, line: 'North East Line' },
  { id: 'kovan', name: 'Kovan', lat: 1.36, lng: 103.885, line: 'North East Line' },
  { id: 'hougang', name: 'Hougang', lat: 1.3712, lng: 103.8925, line: 'North East Line' },
  { id: 'sengkang', name: 'Sengkang', lat: 1.3915, lng: 103.895, line: 'North East Line' },
  { id: 'punggol', name: 'Punggol', lat: 1.4054, lng: 103.9023, line: 'North East Line' },

  // Circle Line
  { id: 'esplanade', name: 'Esplanade', lat: 1.2937, lng: 103.8555, line: 'Circle Line' },
  { id: 'promenade', name: 'Promenade', lat: 1.2932, lng: 103.861, line: 'Circle Line' },
  { id: 'bayfront', name: 'Bayfront', lat: 1.282, lng: 103.859, line: 'Circle Line' },
  { id: 'hollandVillage', name: 'Holland Village', lat: 1.3111, lng: 103.7963, line: 'Circle Line' },
  { id: 'botanicGardens', name: 'Botanic Gardens', lat: 1.3223, lng: 103.8154, line: 'Circle Line' },
  { id: 'oneNorth', name: 'one-north', lat: 1.2995, lng: 103.7876, line: 'Circle Line' },
  { id: 'caldecott', name: 'Caldecott', lat: 1.3374, lng: 103.8397, line: 'Circle Line' },

  // Downtown Line
  { id: 'bukitPanjang', name: 'Bukit Panjang', lat: 1.3789, lng: 103.7622, line: 'Downtown Line' },
  { id: 'newton', name: 'Newton', lat: 1.3127, lng: 103.8382, line: 'Downtown Line' },
  { id: 'rochor', name: 'Rochor', lat: 1.3038, lng: 103.8526, line: 'Downtown Line' },
  { id: 'downtown', name: 'Downtown', lat: 1.2795, lng: 103.8527, line: 'Downtown Line' },
  { id: 'bencoolen', name: 'Bencoolen', lat: 1.2986, lng: 103.8503, line: 'Downtown Line' },
  { id: 'expo', name: 'Expo', lat: 1.335, lng: 103.9614, line: 'Downtown Line' },

  // Thomson-East Coast Line
  { id: 'woodlandsNorth', name: 'Woodlands North', lat: 1.4484, lng: 103.7864, line: 'Thomson-East Coast Line' },
  { id: 'springleaf', name: 'Springleaf', lat: 1.3968, lng: 103.8188, line: 'Thomson-East Coast Line' },
  { id: 'upperThomson', name: 'Upper Thomson', lat: 1.3542, lng: 103.8329, line: 'Thomson-East Coast Line' },
  { id: 'stevens', name: 'Stevens', lat: 1.3196, lng: 103.8258, line: 'Thomson-East Coast Line' },
  { id: 'gardensByTheBay', name: 'Gardens by the Bay', lat: 1.281, lng: 103.873, line: 'Thomson-East Coast Line' },
]
