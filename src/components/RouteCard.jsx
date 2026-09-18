const MODE_ICON = { walk: '🚶', cycle: '🚲', lrt: '🚈', train: '🚆', bus: '🚌' }

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

// variant "single": plain Gmaps-style summary for everyday mode, no
// rank/choose/incentive clutter since there's nothing to compare against.
// variant "comparison": full card used once a disruption puts 2-3 routes
// (and possibly an incentive) in front of the commuter to choose between.
function RouteCard({ route, onChooseRoute, choosing, variant = 'comparison' }) {
  const crowding = crowdingLabel(route.crowdScore)
  const isComparison = variant === 'comparison'

  return (
    <article className={`route-card${route.affected ? ' route-affected' : ''}`}>
      <div className="route-card-top">
        {isComparison && (
          <span className="rank-badge" aria-label={`Rank ${route.rank}`}>#{route.rank}</span>
        )}
        <div className="route-card-heading">
          <h3>{route.label}</h3>
          <p className="route-time">
            {route.totalMinutes} min <span className="uncertainty">± {route.uncertaintyMinutes} min</span>
          </p>
        </div>
        {isComparison &&
          (route.affected ? (
            <span className="status-chip affected">Affected by disruption</span>
          ) : (
            <span className="status-chip clear">Clear route</span>
          ))}
      </div>

      <div className="route-legs" aria-label="Journey legs">
        {route.legs.map((leg, index) => (
          <span
            key={index}
            className={`leg-chip${leg.affected ? ' leg-chip-affected' : ''}`}
            title={leg.line || leg.mode}
          >
            {MODE_ICON[leg.mode] || '•'} {leg.minutes}m
          </span>
        ))}
      </div>

      <p className={`crowding-line ${crowding.className}`}>{crowding.text}</p>

      {isComparison && route.incentiveEligible && (
        <div className={`incentive-banner incentive-${route.incentiveTier}`}>
          <span className="incentive-icon" aria-hidden="true">
            {INCENTIVE_COPY[route.incentiveTier]?.icon || '🎁'}
          </span>
          <div>
            <p className="incentive-title">{INCENTIVE_COPY[route.incentiveTier]?.title}</p>
            <p className="incentive-copy">
              Help spread the load and earn {route.incentivePoints} points.
            </p>
          </div>
        </div>
      )}

      {isComparison && (
        <button
          type="button"
          className="choose-route-button"
          onClick={() => onChooseRoute(route)}
          disabled={choosing}
        >
          {choosing ? 'Confirming…' : 'Choose this route'}
        </button>
      )}
    </article>
  )
}

export default RouteCard
