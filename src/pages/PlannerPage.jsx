import { useState } from 'react'
import UrgencyToggle from '../components/UrgencyToggle'
import DemoModeBadge from '../components/DemoModeBadge'
import RouteCard from '../components/RouteCard'
import MapView from '../components/MapView'
import { useJourney } from '../hooks/useJourney'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { redeemIncentive, triggerDemoDisruption, resetDemoDisruption } from '../lib/api'

function PlannerPage({ urgency, onUrgencyChange, onRouteChosen }) {
  const { data, loading, error, usingCache, reload } = useJourney(urgency)
  const isOnline = useOnlineStatus()
  const [focusedRouteId, setFocusedRouteId] = useState(null)
  const [choosingId, setChoosingId] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [demoBusy, setDemoBusy] = useState(false)

  const routes = data?.routes || []
  const focused = focusedRouteId || routes[0]?.id

  async function handleChooseRoute(route) {
    setChoosingId(route.id)
    setConfirmation('')
    try {
      if (route.incentiveEligible) {
        const result = await redeemIncentive(route.id)
        setConfirmation(`Nice — you earned ${result.entry.points} points from ${result.entry.brand}.`)
      } else {
        setConfirmation(`${route.label} selected. Have a good trip.`)
      }
      onRouteChosen?.(route)
    } catch {
      setConfirmation('Could not confirm that just now — your route is still selected.')
    } finally {
      setChoosingId(null)
    }
  }

  async function handleTriggerDemo() {
    setDemoBusy(true)
    try {
      await triggerDemoDisruption()
      reload()
    } finally {
      setDemoBusy(false)
    }
  }

  async function handleResetDemo() {
    setDemoBusy(true)
    try {
      await resetDemoDisruption()
      reload()
    } finally {
      setDemoBusy(false)
    }
  }

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="label">Route planning</p>
          <h2>Punggol → one-north</h2>
        </div>
        {data?.demoMode && <DemoModeBadge triggered={data.demoTriggered} />}
      </div>

      <UrgencyToggle urgency={urgency} onChange={onUrgencyChange} />

      {!isOnline && (
        <p className="offline-banner">
          No signal — showing your last saved route{usingCache ? '' : ' once one loads'}.
        </p>
      )}
      {isOnline && usingCache && (
        <p className="offline-banner">Reconnecting — showing your last saved route for now.</p>
      )}

      {loading && !data && <p className="loading-line">Finding your best routes…</p>}
      {error && <p className="error-line">{error}</p>}

      {routes.length > 0 && (
        <>
          <MapView routes={routes} focusedRouteId={focused} />

          <div className="route-list">
            {routes.map((route) => (
              <div key={route.id} onMouseEnter={() => setFocusedRouteId(route.id)}>
                <RouteCard route={route} onChooseRoute={handleChooseRoute} choosing={choosingId === route.id} />
              </div>
            ))}
          </div>

          {confirmation && <p className="confirmation-line">{confirmation}</p>}
        </>
      )}

      <details className="demo-controls">
        <summary>Demo controls (for screen recording)</summary>
        <p>Trigger a reproducible test disruption so a demo doesn't depend on a real one occurring.</p>
        <div className="demo-controls-buttons">
          <button type="button" onClick={handleTriggerDemo} disabled={demoBusy}>
            Trigger test disruption
          </button>
          <button type="button" onClick={handleResetDemo} disabled={demoBusy}>
            Reset
          </button>
        </div>
      </details>
    </section>
  )
}

export default PlannerPage
