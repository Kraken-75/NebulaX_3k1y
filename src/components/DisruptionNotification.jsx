// Styled to read like a phone lock-screen notification. Fires for ANY
// active disruption regardless of whether it touches the current from/to —
// a commuter whose trip isn't affected still gets told so, just without an
// action line, per the brief's own 3-line design: what happened, whether it
// affects you, and (only when it does) the one top action. This is a
// simulated in-app banner, not a real OS push notification (no service
// worker / Web Push permission dance needed for the demo).
function DisruptionNotification({ headline, affectsYou, topActionLabel, onTap }) {
  return (
    <button type="button" className="phone-notification" onClick={onTap}>
      <span className="phone-notification-icon" aria-hidden="true">🚨</span>
      <span className="phone-notification-body">
        <span className="phone-notification-app">NebulaX · now</span>
        <span className="phone-notification-line">{headline}</span>
        <span className="phone-notification-line">{affectsYou}</span>
        {topActionLabel && (
          <span className="phone-notification-line phone-notification-action">
            {topActionLabel} — click to find out how your route has changed
          </span>
        )}
      </span>
    </button>
  )
}

export default DisruptionNotification
