// Simple client-side convenience over an already-fetched, small (~40-item)
// station list — not business logic needing a secret or server trust, so
// fine to compute here rather than round-tripping to the backend.
export function findNearestStation(location, stations) {
  if (!location || stations.length === 0) return null

  let nearest = null
  let nearestDistance = Infinity
  for (const station of stations) {
    const dLat = station.lat - location.lat
    const dLng = station.lng - location.lng
    const distance = dLat * dLat + dLng * dLng
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = station
    }
  }
  return nearest
}
