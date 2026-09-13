function NavigationPage({
  start,
  destination,
  mode,
  setStart,
  setDestination,
  setMode,
  recommendedRoutes,
}) {
  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="label">Route planning</p>
          <h2>Start to destination</h2>
        </div>
      </div>

      <div className="planner-panel">
        <div className="input-grid">
          <label>
            Start
            <input
              value={start}
              onChange={(event) => setStart(event.target.value)}
              placeholder="e.g. Bishan"
            />
          </label>

          <label>
            Destination
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="e.g. Marina Bay"
            />
          </label>

          <label>
            Mode
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="Train">Train</option>
              <option value="Bus">Bus</option>
              <option value="Walk">Walk</option>
            </select>
          </label>
        </div>

        <div className="route-results">
          {recommendedRoutes.length > 0 ? (
            recommendedRoutes.map((route) => (
              <article className="route-card" key={route.id}>
                <div className="route-card-header">
                  <div>
                    <p className="card-label">Recommended</p>
                    <h3>
                      {route.from} → {route.to}
                    </h3>
                  </div>
                  <span className="route-time">{route.time}</span>
                </div>

                <div className="route-meta">
                  <span>{route.mode}</span>
                  <span>{route.comfort}</span>
                </div>

                <p>{route.summary}</p>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <h3>No route found</h3>
              <p>Try a different start point or switch to another transport mode.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default NavigationPage
