import { Fragment, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { legColor } from '../lib/lineColors'

const DIMMED = '#cbd5e1'

function FitToRoutes({ allPoints }) {
  const map = useMap()
  useEffect(() => {
    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [24, 24] })
    }
  }, [allPoints, map])
  return null
}

function legLabel(leg) {
  return leg.line || (leg.mode === 'walk' ? 'Walk' : leg.mode === 'bus' ? 'Bus' : leg.mode)
}

// Mandatory geospatial base: OpenStreetMap tiles with required attribution.
// Uses the public OSM demo tile server for local/hackathon-demo traffic only
// — a production deployment must switch to MapTiler/Stadia (see README).
//
// Each leg of the focused route is colored by its actual line/mode (real SG
// rail-line colors, distinct bus/walk colors) instead of one flat line, so
// the route reads visually — a disrupted leg gets a red dashed outline on
// top of its normal color rather than losing its identity.
function MapView({ routes, focusedRouteId, liveLocation }) {
  const allPoints = useMemo(
    () => routes.flatMap((route) => route.legs.flatMap((leg) => leg.geometry)),
    [routes],
  )

  const focusedRoute = routes.find((route) => route.id === focusedRouteId)
  const legend = useMemo(() => {
    if (!focusedRoute) return []
    const seen = new Map()
    for (const leg of focusedRoute.legs) {
      const label = legLabel(leg)
      if (!seen.has(label)) seen.set(label, legColor(leg))
    }
    return [...seen.entries()]
  }, [focusedRoute])

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

        {routes
          .filter((route) => route.id !== focusedRouteId)
          .flatMap((route) =>
            route.legs.map((leg, legIndex) => (
              <Polyline
                key={`dim-${route.id}-${legIndex}`}
                positions={leg.geometry}
                pathOptions={{ color: DIMMED, weight: 3, opacity: 0.6 }}
              />
            )),
          )}

        {focusedRoute?.legs.map((leg, legIndex) => (
          <Fragment key={`focused-${legIndex}`}>
            {leg.affected && (
              <Polyline
                positions={leg.geometry}
                pathOptions={{ color: '#dc2626', weight: 9, opacity: 0.55, dashArray: '1 10' }}
              />
            )}
            <Polyline
              positions={leg.geometry}
              pathOptions={{
                color: legColor(leg),
                weight: leg.mode === 'walk' ? 4 : 6,
                opacity: 0.95,
                dashArray: leg.mode === 'walk' ? '2 8' : undefined,
              }}
            />
          </Fragment>
        ))}

        {focusedRoute?.legs.map((leg, index, legs) => {
          if (index !== 0 && index !== legs.length - 1) return null
          const point = index === 0 ? leg.geometry[0] : leg.geometry[leg.geometry.length - 1]
          const label = index === 0 ? leg.from.name : leg.to.name
          return (
            <CircleMarker key={label} center={point} radius={7} pathOptions={{ color: '#0f172a', fillOpacity: 1 }}>
              <Popup>{label}</Popup>
            </CircleMarker>
          )
        })}

        {liveLocation && (
          <CircleMarker
            center={[liveLocation.lat, liveLocation.lng]}
            radius={8}
            pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 1, weight: 3 }}
          >
            <Popup>{liveLocation.isSimulated ? 'Your location (simulated for demo)' : 'Your location'}</Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {legend.length > 0 && (
        <div className="map-legend">
          {legend.map(([label, color]) => (
            <span key={label} className="map-legend-item">
              <span className="map-legend-swatch" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default MapView
