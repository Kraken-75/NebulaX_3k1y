import { legColor, legCode } from '../lib/lineColors'
import { formatClock, addMinutes, headwayMinutes } from '../lib/routeTiming'

const MODE_ICON = { walk: '🚶', lrt: '🚈', train: '🚇', bus: '🚌' }

// Compact preview row matching the GMaps directions-list pattern: big
// duration, a departure–arrival time range, then a left-to-right strip of
// mode icons with colored line-code badges — nothing more until tapped.
// Tapping opens the full step-by-step detail (RouteDetailSheet).
function RouteCard({ route, onOpen }) {
  const now = new Date()
  const arrive = addMinutes(now, route.totalMinutes)
  const firstTransitLeg = route.legs.find((leg) => leg.mode !== 'walk')

  return (
    <button type="button" className="route-preview-row" onClick={() => onOpen(route)}>
      <div className="route-preview-time">
        <span className="route-preview-minutes">{route.totalMinutes}</span>
        <span className="route-preview-minutes-label">min</span>
      </div>

      <div className="route-preview-main">
        <p className="route-preview-range">
          {formatClock(now)} – {formatClock(arrive)}
        </p>
        <div className="route-preview-icons">
          {route.legs.map((leg, index) => (
            <span className="route-preview-leg" key={index}>
              {index > 0 && <span className="route-preview-arrow">›</span>}
              <span className="route-preview-mode-icon" aria-hidden="true">
                {MODE_ICON[leg.mode] || '•'}
              </span>
              {leg.mode === 'walk' ? (
                <span className="route-preview-walk-minutes">{leg.minutes}</span>
              ) : (
                <span className="route-preview-line-badge" style={{ background: legColor(leg) }}>
                  {legCode(leg)}
                </span>
              )}
            </span>
          ))}
        </div>
        {firstTransitLeg && (
          <p className="route-preview-caption">
            every {headwayMinutes(firstTransitLeg.mode)} min from {firstTransitLeg.from.name}
          </p>
        )}
      </div>

      <div className="route-preview-badges">
        {route.affected && <span className="route-preview-badge badge-affected">Affected</span>}
        {route.incentiveEligible && (
          <span className="route-preview-badge badge-reward">🎁 {route.incentivePoints}</span>
        )}
      </div>
    </button>
  )
}

export default RouteCard
