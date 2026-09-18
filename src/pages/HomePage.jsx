import { useState } from 'react'
import UrgencyToggle from '../components/UrgencyToggle'
import DemoModeBadge from '../components/DemoModeBadge'
import RouteCard from '../components/RouteCard'
import MapView from '../components/MapView'
import DisruptionNotification from '../components/DisruptionNotification'
import AskMeSheet from '../components/AskMeSheet'
import { useJourney } from '../hooks/useJourney'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useLiveLocation } from '../hooks/useLiveLocation'
import { redeemIncentive, triggerDemoDisruption, resetDemoDisruption } from '../lib/api'

// Everyday mode shows one plain, Gmaps-style route. The moment a disruption
// makes any candidate route "affected", this switches to a notification the
// commuter has to tap before seeing the 3-route comparison + incentives —
// nothing else (crowding, incentive detail) is dumped straight on screen.
function HomePage({ urgency, onUrgencyChange, homeWork }) {
  const [usingAltDestination, setUsingAltDestination] = useState(false)
  const { data, loading, error, usingCache, reload } = useJourney(urgency, { altDestination: usingAltDestination })
  const isOnline = useOnlineStatus()
  const liveLocation = useLiveLocation()

  const [revealed, setRevealed] = useState(false)
  const [lastHasDisruption, setLastHasDisruption] = useState(false)
  const [choosingId, setChoosingId] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [demoBusy, setDemoBusy] = useState(false)
  const [askMeOpen, setAskMeOpen] = useState(false)

  const routes = data?.routes || []
  const hasDisruption = routes.some((route) => route.affected)

  // Reset "revealed" the moment disruption state changes (a fresh
  // disruption should show the notification again; clearing one should
  // reset for next time) — adjusted during render rather than in an effect,
  // per React's own guidance for state that depends on a prop/derived value.
  if (hasDisruption !== lastHasDisruption) {
    setLastHasDisruption(hasDisruption)
    setRevealed(false)
  }

  const topRoute = routes[0]
  const focusedRouteId = revealed || !hasDisruption ? topRoute?.id : undefined

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

  const disruption = data?.disruptions?.[0]
  const notificationText = disruption
    ? {
        headline: disruption.message.split('.')[0].slice(0, 70),
        affectsYou: `Your ${homeWork?.home?.station?.name?.split(' ')[0] || 'usual'} trip is affected`,
        topActionLabel: `Take "${topRoute?.label}" instead`,
      }
    : null

  return (
    <section className="page home-page">
      <div className="home-topbar">
        <UrgencyToggle urgency={urgency} onChange={onUrgencyChange} />
        <button type="button" className="ask-me-button" onClick={() => setAskMeOpen(true)}>
          Ask me
        </button>
      </div>

      {data?.demoMode && <DemoModeBadge triggered={data.demoTriggered} />}

      {!isOnline && <p className="offline-banner">No signal — showing your last saved route.</p>}
      {isOnline && usingCache && <p className="offline-banner">Reconnecting — showing your last saved route.</p>}

      {loading && !data && <p className="loading-line">Finding your route…</p>}
      {error && <p className="error-line">{error}</p>}

      {hasDisruption && !revealed && notificationText && (
        <DisruptionNotification
          headline={notificationText.headline}
          affectsYou={notificationText.affectsYou}
          topActionLabel={notificationText.topActionLabel}
          onTap={() => setRevealed(true)}
        />
      )}

      {(!hasDisruption || revealed) && routes.length > 0 && (
        <>
          <MapView routes={routes} focusedRouteId={focusedRouteId} liveLocation={liveLocation} />

          {!hasDisruption ? (
            <RouteCard route={topRoute} variant="single" />
          ) : (
            <div className="route-list">
              {routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  variant="comparison"
                  onChooseRoute={handleChooseRoute}
                  choosing={choosingId === route.id}
                />
              ))}
            </div>
          )}

          {confirmation && <p className="confirmation-line">{confirmation}</p>}
        </>
      )}

      <details className="demo-controls">
        <summary>Simulate a disruption (for demo)</summary>
        <p>Sends a test notification and updates your route, without waiting for a real one.</p>
        <div className="demo-controls-buttons">
          <button type="button" onClick={handleTriggerDemo} disabled={demoBusy}>
            Trigger disruption
          </button>
          <button type="button" onClick={handleResetDemo} disabled={demoBusy}>
            Reset
          </button>
        </div>
      </details>

      <AskMeSheet
        open={askMeOpen}
        usingAltDestination={usingAltDestination}
        onSelectAlt={() => {
          setUsingAltDestination(true)
          setAskMeOpen(false)
        }}
        onSelectUsual={() => {
          setUsingAltDestination(false)
          setAskMeOpen(false)
        }}
        onClose={() => setAskMeOpen(false)}
      />
    </section>
  )
}

export default HomePage
