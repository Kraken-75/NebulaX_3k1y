import { useState } from 'react'
import UrgencyToggle from '../components/UrgencyToggle'
import DemoModeBadge from '../components/DemoModeBadge'
import RouteCard from '../components/RouteCard'
import MapView from '../components/MapView'
import DisruptionNotification from '../components/DisruptionNotification'
import CommunityUpdatesFeed from '../components/CommunityUpdatesFeed'
import StationSearchInput from '../components/StationSearchInput'
import { useJourney } from '../hooks/useJourney'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useLiveLocation } from '../hooks/useLiveLocation'
import { useStations } from '../hooks/useStations'
import { findNearestStation } from '../lib/stationUtils'
import { redeemIncentive, triggerDemoDisruption, resetDemoDisruption } from '../lib/api'

// Everyday mode shows one plain, Gmaps-style route. The moment a disruption
// makes any candidate route "affected", a top-of-screen notification the
// commuter has to tap replaces it, revealing the 3-route comparison +
// incentives. Choosing one of those then becomes the new main route (with a
// back arrow to reopen the comparison) — nothing else (crowding, incentive
// detail) is dumped straight on screen up front.
function HomePage({ urgency, onUrgencyChange, homeWork }) {
  const { stations, loading: stationsLoading } = useStations()
  const liveLocation = useLiveLocation()
  const isOnline = useOnlineStatus()

  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [routeInitialized, setRouteInitialized] = useState(false)

  // From defaults to the nearest station to the commuter's live location
  // (falling back to their saved home station); To defaults to their saved
  // work station. Both stay fully editable afterward — this only seeds the
  // fields once, the moment the station directory is available.
  if (!routeInitialized && stations.length > 0) {
    setRouteInitialized(true)
    setFrom(findNearestStation(liveLocation, stations) || homeWork.home)
    setTo(homeWork.work)
  }

  const { data, loading, error, usingCache, reload } = useJourney(urgency, from?.id, to?.id)

  const [revealed, setRevealed] = useState(false)
  const [lastHasDisruption, setLastHasDisruption] = useState(false)
  const [confirmedRouteId, setConfirmedRouteId] = useState(null)
  const [choosingId, setChoosingId] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [demoBusy, setDemoBusy] = useState(false)

  const routes = data?.routes || []
  const hasDisruption = routes.some((route) => route.affected)

  // Reset "revealed"/"confirmed" the moment disruption state changes (a
  // fresh disruption should show the notification again; clearing one
  // should reset for next time) — adjusted during render rather than in an
  // effect, per React's own guidance for state that depends on a derived
  // value.
  if (hasDisruption !== lastHasDisruption) {
    setLastHasDisruption(hasDisruption)
    setRevealed(false)
    setConfirmedRouteId(null)
  }

  const topRoute = routes[0]
  const confirmedRoute = routes.find((route) => route.id === confirmedRouteId)
  const focusedRouteId = confirmedRoute?.id ?? (revealed || !hasDisruption ? topRoute?.id : undefined)

  async function handleChooseRoute(route) {
    setChoosingId(route.id)
    setConfirmation('')
    try {
      if (route.incentiveEligible) {
        const result = await redeemIncentive(route.id, route.incentiveTier)
        setConfirmation(`Nice — you earned ${result.entry.points} points from ${result.entry.brand}.`)
      } else {
        setConfirmation(`${route.label} selected. Have a good trip.`)
      }
      setConfirmedRouteId(route.id)
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
        affectsYou: `Your ${from?.name} → ${to?.name} trip is affected`,
        topActionLabel: `Take "${topRoute?.label}" instead`,
      }
    : null

  return (
    <section className="page home-page">
      <UrgencyToggle urgency={urgency} onChange={onUrgencyChange} />

      <div className="from-to-panel">
        <StationSearchInput label="From" value={from} onSelect={setFrom} stations={stations} placeholder="Choose a station" />
        <StationSearchInput label="To" value={to} onSelect={setTo} stations={stations} placeholder="Choose a station" />
      </div>

      {data?.demoMode && <DemoModeBadge triggered={data.demoTriggered} />}

      {!isOnline && <p className="offline-banner">No signal — showing your last saved route.</p>}
      {isOnline && usingCache && <p className="offline-banner">Reconnecting — showing your last saved route.</p>}

      {stationsLoading && <p className="loading-line">Loading stations…</p>}
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

          {confirmedRoute ? (
            <>
              <div className="route-confirmed-header">
                <button
                  type="button"
                  className="back-arrow-button"
                  aria-label="Back to route options"
                  onClick={() => setConfirmedRouteId(null)}
                >
                  ←
                </button>
                <span>Your route</span>
              </div>
              <RouteCard route={confirmedRoute} variant="single" />
            </>
          ) : !hasDisruption ? (
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

          {confirmation && !confirmedRoute && <p className="confirmation-line">{confirmation}</p>}

          {revealed && !confirmedRoute && <CommunityUpdatesFeed updates={data?.communityUpdates} />}
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
    </section>
  )
}

export default HomePage
