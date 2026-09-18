import { useEffect, useState } from 'react'

// Underground = no signal. This doesn't attempt a full offline-first PWA —
// just tracks connectivity so the UI can show a "reconnecting" state and
// fall back to the last cached journey instead of hanging or crashing.
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
