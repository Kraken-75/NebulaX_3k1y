import { useJourney } from '../hooks/useJourney'

function HomePage({ urgency, onNavigateToPlanner }) {
  const { data } = useJourney(urgency)
  const topRoute = data?.routes?.[0]
  const demoMode = data?.demoMode

  return (
    <section className="page home-page">
      <div className="hero-card">
        <p className="eyebrow">Hi Arjun</p>
        <h1>Punggol to one-north, made comfortable.</h1>
        <p className="hero-copy">
          We track crowding, weather and disruptions on your usual route so you can dodge the
          crush — or earn a reward for helping spread it out.
        </p>
        <button type="button" className="primary-button" onClick={onNavigateToPlanner}>
          Plan today's ride
        </button>
      </div>

      {topRoute && (
        <article className="info-card accent">
          <p className="card-label">Last checked · {urgency === 'chill' ? 'Time to spare' : 'Need to be fast'}</p>
          <h3>{topRoute.label}</h3>
          <p>{topRoute.totalMinutes} min, {topRoute.affected ? 'currently affected by a disruption' : 'currently clear'}.</p>
        </article>
      )}

      <div className="card-grid">
        <article className="info-card">
          <p className="card-label">How this works</p>
          <h3>3 routes, ranked for you</h3>
          <p>We compare the fastest, most comfortable and most sheltered options every time — not just one path.</p>
        </article>
        <article className="info-card">
          <p className="card-label">Your call</p>
          <h3>Chill or rushing?</h3>
          <p>Set your mood on the planner page and we'll weigh crowding vs. speed differently.</p>
        </article>
      </div>

      {demoMode && (
        <p className="home-footnote">
          Live LTA/OneMap credentials aren't configured in this environment, so route and
          crowding data shown is labeled demo data — see the DEMO MODE badge on each screen.
        </p>
      )}
    </section>
  )
}

export default HomePage
