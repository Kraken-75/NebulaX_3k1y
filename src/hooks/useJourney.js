import { useEffect, useState } from 'react'
import { getJourney } from '../lib/api'

function cacheKey(altDestination) {
  return `nebulax:lastJourney:${altDestination ? 'today' : 'main'}`
}

function readCache(altDestination) {
  try {
    const raw = localStorage.getItem(cacheKey(altDestination))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(altDestination, data) {
  try {
    localStorage.setItem(cacheKey(altDestination), JSON.stringify(data))
  } catch {
    // Storage can be unavailable (private browsing, quota) — caching is a
    // convenience, never something the app depends on to function.
  }
}

// Handles the "underground = no signal" case: if a fresh fetch fails, fall
// back to the last successful response instead of showing a dead screen.
// The "Ask Me" today-only override is cached separately from Arjun's usual
// commute so a network hiccup while toggling it doesn't show the wrong trip.
export function useJourney(urgency, { altDestination = false } = {}) {
  const [data, setData] = useState(() => readCache(altDestination))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usingCache, setUsingCache] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect -- legitimate loading flag for this fetch, not a derivable value

    getJourney(urgency, { altDestination })
      .then((fresh) => {
        if (cancelled) return
        setData(fresh)
        setUsingCache(false)
        setError('')
        writeCache(altDestination, fresh)
      })
      .catch(() => {
        if (cancelled) return
        const cached = readCache(altDestination)
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
  }, [urgency, altDestination, reloadKey])

  return { data, loading, error, usingCache, reload: () => setReloadKey((key) => key + 1) }
}
