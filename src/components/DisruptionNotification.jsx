// Styled to read like a phone lock-screen notification. Deliberately only
// 3 lines — what happened, whether it affects you, the single top action —
// per the notification-design brief: everything else (full comparison,
// crowding, incentives) lives inside the app after tapping, never here.
// This is a simulated in-app banner, not a real OS push notification (no
// service worker / Web Push permission dance needed for the demo).
function DisruptionNotification({ headline, affectsYou, topActionLabel, onTap }) {
  return (
    <button type="button" className="phone-notification" onClick={onTap}>
      <span className="phone-notification-icon" aria-hidden="true">🚨</span>
      <span className="phone-notification-body">
        <span className="phone-notification-app">NebulaX · now</span>
        <span className="phone-notification-line">{headline}</span>
        <span className="phone-notification-line">{affectsYou}</span>
        <span className="phone-notification-line phone-notification-action">
          {topActionLabel} — tap for more options
        </span>
      </span>
    </button>
  )
}

export default DisruptionNotification
