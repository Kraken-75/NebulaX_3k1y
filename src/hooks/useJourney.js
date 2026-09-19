import { useEffect, useState } from 'react'
import { getJourney } from '../lib/api'

function cacheKey(urgency, fromId, toId) {
  return `nebulax:lastJourney:${urgency}:${fromId}:${toId}`
}

function readCache(urgency, fromId, toId) {
  try {
    const raw = localStorage.getItem(cacheKey(urgency, fromId, toId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(urgency, fromId, toId, data) {
  try {
    localStorage.setItem(cacheKey(urgency, fromId, toId), JSON.stringify(data))
  } catch {
    // Storage can be unavailable (private browsing, quota) — caching is a
    // convenience, never something the app depends on to function.
  }
}

// Handles the "underground = no signal" case: if a fresh fetch fails, fall
// back to the last successful response for this exact from/to pair instead
// of showing a dead screen or a stale trip for a different pair.
export function useJourney(urgency, fromId, toId) {
  const [data, setData] = useState(() => (fromId && toId ? readCache(urgency, fromId, toId) : null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usingCache, setUsingCache] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!fromId || !toId) return

    let cancelled = false
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect -- legitimate loading flag for this fetch, not a derivable value

    getJourney(urgency, { fromId, toId })
      .then((fresh) => {
        if (cancelled) return
        setData(fresh)
        setUsingCache(false)
        setError('')
        writeCache(urgency, fromId, toId, fresh)
      })
      .catch(() => {
        if (cancelled) return
        const cached = readCache(urgency, fromId, toId)
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
  }, [urgency, fromId, toId, reloadKey])

  return { data, loading, error, usingCache, reload: () => setReloadKey((key) => key + 1) }
}
