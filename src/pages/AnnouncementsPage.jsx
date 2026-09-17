import { useEffect, useState } from 'react'
import DemoModeBadge from '../components/DemoModeBadge'
import { getDisruptions } from '../lib/api'

function AnnouncementsPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    let isMounted = true

    getDisruptions()
      .then((data) => isMounted && setState({ loading: false, error: '', data }))
      .catch(() =>
        isMounted &&
        setState({
          loading: false,
          error: 'Announcements are unavailable right now. Please try again shortly.',
          data: null,
        }),
      )

    return () => {
      isMounted = false
    }
  }, [])

  const alerts = state.data?.trainAlerts || []

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="label">Service updates</p>
          <h2>Announcements</h2>
        </div>
        {state.data?.isMock && <DemoModeBadge triggered={false} />}
      </div>

      {state.loading && <p className="loading-line">Loading announcements…</p>}
      {state.error && <p className="error-line">{state.error}</p>}

      {!state.loading && !state.error && alerts.length === 0 && (
        <div className="empty-state">
          <h3>No disruptions right now</h3>
          <p>Live feeds are quiet — that's normal. Your planned route should run as expected.</p>
        </div>
      )}

      <div className="announcement-list">
        {alerts.map((alert) => (
          <article className="announcement-card" key={alert.id}>
            <div className="announcement-topline">
              <span className={`tag ${alert.status === 'Disruption' ? 'tag-disruption' : 'tag-alert'}`}>
                {alert.status}
              </span>
              <span className="time">{alert.line}</span>
            </div>
            <p>{alert.message}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AnnouncementsPage
