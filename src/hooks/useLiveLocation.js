import { useEffect, useState } from 'react'

// Fixed near Arjun's home stop — used whenever geolocation is denied,
// unsupported, or times out, so the map always has a location to show for
// the demo rather than an empty marker. Scoped for demo reliability, not
// production-grade location handling.
const FALLBACK_LOCATION = { lat: 1.4041, lng: 103.9023 }

export function useLiveLocation() {
  const [location, setLocation] = useState({ ...FALLBACK_LOCATION, isSimulated: true })

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isSimulated: false,
        })
      },
      () => {
        // Permission denied or unavailable — keep the fallback location
        // rather than showing nothing.
        setLocation({ ...FALLBACK_LOCATION, isSimulated: true })
      },
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 8_000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return location
}
