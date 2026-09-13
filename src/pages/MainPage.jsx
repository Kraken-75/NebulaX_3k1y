function MainPage({ onNavigateToRoute }) {
  return (
    <section className="page home-page">
      <div className="hero-panel">
        <div>
          <p className="label">Event disruption dashboard</p>
          <h2>Keep crowds informed and routes flexible.</h2>
        </div>
        <button className="primary-button" onClick={onNavigateToRoute} type="button">
          Plan a route
        </button>
      </div>

      <div className="card-grid">
        <article className="info-card accent">
          <p className="card-label">Live updates</p>
          <h3>3 recent announcements</h3>
          <p>SMRT and transport alerts are grouped here so the latest changes are easy to spot.</p>
        </article>

        <article className="info-card">
          <p className="card-label">Suggested route</p>
          <h3>Bishan → Marina Bay</h3>
          <p>25 min by Train with low crowding.</p>
        </article>

        <article className="info-card">
          <p className="card-label">Team workflow</p>
          <h3>Share pages cleanly</h3>
          <p>Use the main page for navigation, announcements for updates, and routing for trip planning.</p>
        </article>
      </div>
    </section>
  )
}

export default MainPage
