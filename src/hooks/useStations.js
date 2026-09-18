import { useEffect, useState } from 'react'
import { getStations } from '../lib/api'

// Fetches the ~40-station directory once and caches it in memory for the
// session — small enough that every from/to autocomplete filters this
// client-side instead of round-tripping per keystroke.
export function useStations() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStations()
      .then((data) => setStations(data.stations))
      .catch(() => setStations([]))
      .finally(() => setLoading(false))
  }, [])

  return { stations, loading }
}
