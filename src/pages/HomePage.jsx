import { useState } from 'react'
import UrgencyToggle from '../components/UrgencyToggle'
import DemoModeBadge from '../components/DemoModeBadge'
import RouteCard from '../components/RouteCard'
import RouteDetailSheet from '../components/RouteDetailSheet'
import MapView from '../components/MapView'
import DisruptionNotification from '../components/DisruptionNotification'
import CommunityUpdatesFeed from '../components/CommunityUpdatesFeed'
import StationSearchInput from '../components/StationSearchInput'
import { useJourney } from '../hooks/useJourney'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useLiveLocation } from '../hooks/useLiveLocation'
import { useStations } from '../hooks/useStations'
import { redeemIncentive, triggerDemoDisruption, resetDemoDisruption } from '../lib/api'

// Everyday mode shows one plain, Gmaps-style route. A disruption notification
// fires for ANY active disruption, whether or not it touches the current
// trip — tapping it opens the app to whatever's relevant (the 3-route
// comparison if affected, otherwise just the usual route). Every route,
// single or one of several, is a compact preview until tapped, at which
// point its full step-by-step detail opens (RouteDetailSheet) — matching
// how GMaps itself works, not a custom pattern.
function HomePage({ urgency, onUrgencyChange, homeWork }) {
  const { stations, loading: stationsLoading } = useStations()
  const liveLocation = useLiveLocation()
  const isOnline = useOnlineStatus()

  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [routeInitialized, setRouteInitialized] = useState(false)

  // Defaults to the commuter's saved home -> work trip. Both fields stay
  // fully editable afterward; this only seeds them once.
  if (!routeInitialized && stations.length > 0) {
    setRouteInitialized(true)
    setFrom(homeWork.home)
    setTo(homeWork.work)
  }

  const { data, loading, error, usingCache, reload } = useJourney(urgency, from?.id, to?.id)

  const [revealed, setRevealed] = useState(false)
  const [lastDisruptionActive, setLastDisruptionActive] = useState(false)
  const [confirmedRouteId, setConfirmedRouteId] = useState(null)
  const [expandedRouteId, setExpandedRouteId] = useState(null)
  const [choosingId, setChoosingId] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [demoBusy, setDemoBusy] = useState(false)

  const routes = data?.routes || []
  const hasDisruption = routes.some((route) => route.affected)
  // A disruption can be "live" without touching this specific trip — the
  // notification still needs to fire, per feedback: only its content (and
  // whether there's a route change to see) differs.
  const disruptionActive = Boolean(
    data?.demoTriggered || (data?.disruptions || []).some((alert) => alert.status === 'Disruption'),
  )

  // Reset "revealed"/"confirmed" the moment a disruption starts or clears —
  // adjusted during render rather than in an effect, per React's own
  // guidance for state that depends on a derived value.
  if (disruptionActive !== lastDisruptionActive) {
    setLastDisruptionActive(disruptionActive)
    setRevealed(false)
    setConfirmedRouteId(null)
    setExpandedRouteId(null)
  }

  const topRoute = routes[0]
  const confirmedRoute = routes.find((route) => route.id === confirmedRouteId)
  const expandedRoute = routes.find((route) => route.id === expandedRouteId)
  const displayedRoutes = confirmedRoute ? [confirmedRoute] : hasDisruption && revealed ? routes : topRoute ? [topRoute] : []
  const focusedRouteId = confirmedRoute?.id ?? expandedRoute?.id ?? topRoute?.id

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
      if (hasDisruption) setConfirmedRouteId(route.id)
      setExpandedRouteId(null)
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
    ? hasDisruption
      ? {
          headline: disruption.message.split('.')[0].slice(0, 70),
          affectsYou: `Your ${from?.name} → ${to?.name} trip is affected`,
          topActionLabel: `Take "${topRoute?.label}" instead`,
        }
      : {
          headline: disruption.message.split('.')[0].slice(0, 70),
          affectsYou: `This doesn't affect your ${from?.name} → ${to?.name} trip`,
          topActionLabel: null,
        }
    : null

  return (
    <section className="page home-page">
      <UrgencyToggle urgency={urgency} onChange={onUrgencyChange} />

      <div className="from-to-panel">
        <StationSearchInput label="From" value={from} onSelect={setFrom} stations={stations} placeholder="Choose a station" />
        <button
          type="button"
          className="swap-button"
          aria-label="Swap from and to"
          onClick={() => {
            const previousFrom = from
            setFrom(to)
            setTo(previousFrom)
          }}
        >
          ⇅
        </button>
        <StationSearchInput label="To" value={to} onSelect={setTo} stations={stations} placeholder="Choose a station" />
      </div>

      {data?.demoMode && <DemoModeBadge triggered={data.demoTriggered} />}

      {!isOnline && <p className="offline-banner">No signal — showing your last saved route.</p>}
      {isOnline && usingCache && <p className="offline-banner">Reconnecting — showing your last saved route.</p>}

      {stationsLoading && <p className="loading-line">Loading stations…</p>}
      {loading && !data && <p className="loading-line">Finding your route…</p>}
      {error && <p className="error-line">{error}</p>}

      {disruptionActive && !revealed && notificationText && (
        <DisruptionNotification
          headline={notificationText.headline}
          affectsYou={notificationText.affectsYou}
          topActionLabel={notificationText.topActionLabel}
          onTap={() => setRevealed(true)}
        />
      )}

      {displayedRoutes.length > 0 && (
        <>
          <MapView routes={routes} focusedRouteId={focusedRouteId} liveLocation={liveLocation} />

          {confirmedRoute && (
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
          )}

          <div className="route-list">
            {displayedRoutes.map((route) => (
              <RouteCard key={route.id} route={route} onOpen={(r) => setExpandedRouteId(r.id)} />
            ))}
          </div>

          {confirmation && <p className="confirmation-line">{confirmation}</p>}

          {revealed && hasDisruption && !confirmedRoute && <CommunityUpdatesFeed updates={data?.communityUpdates} />}
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

      {expandedRoute && (
        <RouteDetailSheet
          route={expandedRoute}
          from={from}
          to={to}
          onClose={() => setExpandedRouteId(null)}
          onChoose={handleChooseRoute}
          choosing={choosingId === expandedRoute.id}
        />
      )}
    </section>
  )
}

export default HomePage
