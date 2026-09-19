import { useEffect, useState } from 'react'
import { getStations } from '../lib/api'
import { FALLBACK_STATIONS } from '../data/fallbackStations'

// Fetches the ~40-station directory once and caches it in memory for the
// session — small enough that every from/to autocomplete filters this
// client-side instead of round-tripping per keystroke.
export function useStations() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStations()
      .then((data) => setStations(data.stations))
      // Static hosting may serve the frontend without the Express API. Keep
      // first-run setup usable in that case; the API response remains the
      // complete source of truth whenever it is reachable.
      .catch(() => setStations(FALLBACK_STATIONS))
      .finally(() => setLoading(false))
  }, [])

  return { stations, loading }
}
