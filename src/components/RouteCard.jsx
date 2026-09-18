const MODE_ICON = { walk: '🚶', cycle: '🚲', lrt: '🚈', train: '🚆', bus: '🚌' }

function crowdingLabel(score) {
  if (score >= 1.5) return { text: 'High crowding', className: 'crowd-high' }
  if (score >= 0.75) return { text: 'Moderate crowding', className: 'crowd-medium' }
  return { text: 'Low crowding', className: 'crowd-low' }
}

function RouteCard({ route, onChooseRoute, choosing }) {
  const crowding = crowdingLabel(route.crowdScore)

  return (
    <article className={`route-card${route.affected ? ' route-affected' : ''}`}>
      <div className="route-card-top">
        <span className="rank-badge" aria-label={`Rank ${route.rank}`}>#{route.rank}</span>
        <div className="route-card-heading">
          <h3>{route.label}</h3>
          <p className="route-time">
            {route.totalMinutes} min <span className="uncertainty">± {route.uncertaintyMinutes} min</span>
          </p>
        </div>
        {route.affected ? (
          <span className="status-chip affected">Affected by disruption</span>
        ) : (
          <span className="status-chip clear">Clear route</span>
        )}
      </div>

      <div className="route-legs" aria-label="Journey legs">
        {route.legs.map((leg, index) => (
          <span key={index} className="leg-chip" title={leg.line || leg.mode}>
            {MODE_ICON[leg.mode] || '•'} {leg.minutes}m
          </span>
        ))}
      </div>

      <p className={`crowding-line ${crowding.className}`}>{crowding.text}</p>

      {route.incentiveEligible && (
        <div className="incentive-banner">
          <span className="incentive-icon" aria-hidden="true">🎁</span>
          <div>
            <p className="incentive-title">Earn a reward for choosing this route</p>
            <p className="incentive-copy">Help spread the load and get a partner voucher.</p>
          </div>
        </div>
      )}

      <button
        type="button"
        className="choose-route-button"
        onClick={() => onChooseRoute(route)}
        disabled={choosing}
      >
        {choosing ? 'Confirming…' : 'Choose this route'}
      </button>
    </article>
  )
}

export default RouteCard
