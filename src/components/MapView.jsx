import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const ROUTE_COLORS = {
  clear: '#0f766e',
  affected: '#dc2626',
  dimmed: '#94a3b8',
}

function FitToRoutes({ allPoints }) {
  const map = useMap()
  useEffect(() => {
    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [24, 24] })
    }
  }, [allPoints, map])
  return null
}

// Mandatory geospatial base: OpenStreetMap tiles with required attribution.
// Uses the public OSM demo tile server for local/hackathon-demo traffic only
// — a production deployment must switch to MapTiler/Stadia (see README).
function MapView({ routes, focusedRouteId }) {
  const allPoints = useMemo(
    () => routes.flatMap((route) => route.legs.flatMap((leg) => leg.geometry)),
    [routes],
  )

  if (allPoints.length === 0) {
    return <div className="map-empty">Map will appear once a route is planned.</div>
  }

  return (
    <div className="map-shell">
      <MapContainer center={allPoints[0]} zoom={12} scrollWheelZoom={false} className="map-container">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToRoutes allPoints={allPoints} />
        {routes.map((route) => {
          const isFocused = route.id === focusedRouteId
          return route.legs.map((leg, legIndex) => (
            <Polyline
              key={`${route.id}-${legIndex}`}
              positions={leg.geometry}
              pathOptions={{
                color: !isFocused ? ROUTE_COLORS.dimmed : route.affected ? ROUTE_COLORS.affected : ROUTE_COLORS.clear,
                weight: isFocused ? 5 : 2,
                opacity: isFocused ? 0.9 : 0.4,
                dashArray: isFocused && route.affected ? '2 8' : undefined,
              }}
            />
          ))
        })}
        {routes.find((route) => route.id === focusedRouteId)?.legs.map((leg, index, legs) => {
          if (index !== 0 && index !== legs.length - 1) return null
          const point = index === 0 ? leg.geometry[0] : leg.geometry[leg.geometry.length - 1]
          const label = index === 0 ? leg.from.name : leg.to.name
          return (
            <CircleMarker key={label} center={point} radius={7} pathOptions={{ color: '#0f172a', fillOpacity: 1 }}>
              <Popup>{label}</Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default MapView
