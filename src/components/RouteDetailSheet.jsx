import { legColor, legCode } from '../lib/lineColors'
import { formatClock, addMinutes, estimateStops } from '../lib/routeTiming'

const MODE_ICON = { walk: '🚶', lrt: '🚈', train: '🚇', bus: '🚌' }

function crowdingLabel(score) {
  if (score >= 1.5) return { text: 'High crowding', className: 'crowd-high' }
  if (score >= 0.75) return { text: 'Moderate crowding', className: 'crowd-medium' }
  return { text: 'Low crowding', className: 'crowd-low' }
}

// Mirrors server/services/incentiveCalculator.js's tiers with copy a
// non-technical user reads at a glance — no "tier" jargon on screen.
const INCENTIVE_COPY = {
  large: { icon: '🌟', title: 'Big reward for choosing this route' },
  medium: { icon: '🎁', title: 'Earn a reward for choosing this route' },
  small: { icon: '🙂', title: 'Small reward for choosing this route' },
}

// Full step-by-step detail, opened by tapping a RouteCard preview row —
// matches the GMaps "selected route" pattern: a bottom sheet with a
// vertical timeline (colored per transit leg), board/alight stations and
// times, then a single confirm action at the bottom.
function RouteDetailSheet({ route, from, to, onClose, onChoose, choosing }) {
  if (!route) return null

  const crowding = crowdingLabel(route.crowdScore)
  const startTime = new Date()
  const startLabel = from?.name || route.legs[0]?.from?.name
  const legTimings = route.legs.reduce((acc, leg) => {
    const previousEnd = acc.length > 0 ? acc[acc.length - 1].alightTime : startTime
    const boardTime = previousEnd
    const alightTime = addMinutes(boardTime, leg.minutes)
    return [...acc, { leg, boardTime, alightTime }]
  }, [])
  const endLabel = to?.name || route.legs[route.legs.length - 1]?.to?.name
  const endTime = legTimings.length > 0 ? legTimings[legTimings.length - 1].alightTime : startTime

  return (
    <div className="route-detail-backdrop" onClick={onClose}>
      <div className="route-detail-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="route-detail-header">
          <div>
            <p className="route-detail-minutes">{route.totalMinutes} min</p>
            <p className="route-detail-arrive">Arrive {formatClock(endTime)}</p>
          </div>
          <button type="button" className="route-detail-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="route-preview-icons route-detail-icons">
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

        <p className={`crowding-line ${crowding.className}`}>{crowding.text}</p>

        {route.incentiveEligible && (
          <div className={`incentive-banner incentive-${route.incentiveTier}`}>
            <span className="incentive-icon" aria-hidden="true">
              {INCENTIVE_COPY[route.incentiveTier]?.icon || '🎁'}
            </span>
            <div>
              <p className="incentive-title">{INCENTIVE_COPY[route.incentiveTier]?.title}</p>
              <p className="incentive-copy">Help spread the load and earn {route.incentivePoints} points.</p>
            </div>
          </div>
        )}

        <div className="route-detail-timeline">
          <div className="timeline-row timeline-point">
            <span className="timeline-dot timeline-dot-start" />
            <p className="timeline-title">{startLabel}</p>
            <span className="timeline-time">{formatClock(startTime)}</span>
          </div>

          {legTimings.map(({ leg, boardTime, alightTime }, index) =>
            leg.mode === 'walk' ? (
              <div className="timeline-row timeline-walk" key={index}>
                <span className="timeline-dot timeline-dot-walk">🚶</span>
                <p className="timeline-title">Walk {leg.minutes} min</p>
              </div>
            ) : (
              <div
                className={`timeline-transit-group${leg.affected ? ' timeline-transit-affected' : ''}`}
                style={{ borderColor: legColor(leg) }}
                key={index}
              >
                <div className="timeline-row">
                  <p className="timeline-title">{leg.from.name}</p>
                  <span className="timeline-time">{formatClock(boardTime)}</span>
                </div>
                <div className="timeline-line-row">
                  <span className="route-preview-line-badge" style={{ background: legColor(leg) }}>
                    {legCode(leg)}
                  </span>
                  <span>{leg.line}</span>
                  {leg.affected && <span className="status-chip affected">Affected</span>}
                </div>
                {leg.mode === 'bus' && leg.boardingExit && (
                  <p className="timeline-meta">
                    Use station exit {leg.boardingExit} · Services {leg.services.join(', ')}
                  </p>
                )}
                <p className="timeline-meta">
                  {(() => {
                    const stops = leg.estimatedStops ?? estimateStops(leg.minutes)
                    const transferNote = leg.transferMinutes ? `, incl. ~${leg.transferMinutes} min transfer/wait` : ''
                    return `Ride ~${stops} stop${stops > 1 ? 's' : ''} (${leg.minutes} min${transferNote})`
                  })()}
                </p>
                <div className="timeline-row timeline-row-alight">
                  <p className="timeline-title">{leg.to.name}</p>
                  <span className="timeline-time">{formatClock(alightTime)}</span>
                </div>
              </div>
            ),
          )}

          <div className="timeline-row timeline-point">
            <span className="timeline-dot timeline-dot-end" />
            <p className="timeline-title">{endLabel}</p>
            <span className="timeline-time">{formatClock(endTime)}</span>
          </div>
        </div>

        <button
          type="button"
          className="route-detail-start-button"
          onClick={() => onChoose(route)}
          disabled={choosing}
        >
          {choosing ? 'Confirming…' : 'Start'}
        </button>
      </div>
    </div>
  )
}

export default RouteDetailSheet
