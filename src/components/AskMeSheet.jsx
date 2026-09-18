// Same-day override only — never an interrogation flow. One tap to switch
// today's trip, one tap to go back to normal. Not persisted: this only
// affects the current session, per the brief.
function AskMeSheet({ open, usingAltDestination, onSelectAlt, onSelectUsual, onClose }) {
  if (!open) return null

  return (
    <div className="ask-me-backdrop" onClick={onClose}>
      <div className="ask-me-sheet" onClick={(event) => event.stopPropagation()}>
        <p className="label">Just for today</p>
        <h2>Not heading to your usual place?</h2>
        <button
          type="button"
          className={usingAltDestination ? 'ask-me-option' : 'ask-me-option active'}
          onClick={onSelectUsual}
        >
          My usual route
        </button>
        <button
          type="button"
          className={usingAltDestination ? 'ask-me-option active' : 'ask-me-option'}
          onClick={onSelectAlt}
        >
          Going to Raffles Place instead
        </button>
        <button type="button" className="ask-me-cancel" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default AskMeSheet
