import { useEffect, useState } from 'react'
import { getJourney } from '../lib/api'

const CACHE_KEY = 'nebulax:lastJourney'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage can be unavailable (private browsing, quota) — caching is a
    // convenience, never something the app depends on to function.
  }
}

// Handles the "underground = no signal" case: if a fresh fetch fails, fall
// back to the last successful response instead of showing a dead screen.
export function useJourney(urgency) {
  const [data, setData] = useState(() => readCache())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usingCache, setUsingCache] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect -- legitimate loading flag for this fetch, not a derivable value

    getJourney(urgency)
      .then((fresh) => {
        if (cancelled) return
        setData(fresh)
        setUsingCache(false)
        setError('')
        writeCache(fresh)
      })
      .catch(() => {
        if (cancelled) return
        const cached = readCache()
        if (cached) {
          setData(cached)
          setUsingCache(true)
          setError('')
        } else {
          setError('No signal and no saved route yet. Reconnect to plan a journey.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [urgency, reloadKey])

  return { data, loading, error, usingCache, reload: () => setReloadKey((key) => key + 1) }
}
