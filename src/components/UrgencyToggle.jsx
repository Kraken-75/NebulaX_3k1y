// Arjun's own flexibility, not a persona switch: "some days I'm chill, some
// days I'm rushing" changes how the same commuter's 3 routes get ranked, and
// whether a load-spreading incentive is even offered.
function UrgencyToggle({ urgency, onChange }) {
  return (
    <div className="urgency-toggle" role="radiogroup" aria-label="How much time do you have?">
      <button
        type="button"
        role="radio"
        aria-checked={urgency === 'chill'}
        className={urgency === 'chill' ? 'urgency-option active' : 'urgency-option'}
        onClick={() => onChange('chill')}
      >
        <span className="urgency-icon" aria-hidden="true">🌿</span>
        I have time to spare
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={urgency === 'rushing'}
        className={urgency === 'rushing' ? 'urgency-option active' : 'urgency-option'}
        onClick={() => onChange('rushing')}
      >
        <span className="urgency-icon" aria-hidden="true">⚡</span>
        I need to get there fast
      </button>
    </div>
  )
}

export default UrgencyToggle
