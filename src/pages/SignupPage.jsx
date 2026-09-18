import { useEffect, useState } from 'react'
import { getStations } from '../lib/api'

// First-run only, 2 taps: pick home, pick work/school, done. Station option
// data comes from the backend (GET /api/stations) rather than being
// duplicated here. Only the Punggol <-> one-north pair has a fully modeled
// live route in this MVP — picking anything else still works, but the app
// is upfront that it's an unsupported pair rather than faking data for it.
function SignupPage({ onComplete }) {
  const [options, setOptions] = useState(null)
  const [error, setError] = useState('')
  const [home, setHome] = useState(null)

  useEffect(() => {
    getStations()
      .then(setOptions)
      .catch(() => setError('Could not load stations. Check your connection and reload.'))
  }, [])

  function finish(nextWork) {
    onComplete({ home, work: nextWork })
  }

  if (error) return <div className="page signup-page"><p className="error-line">{error}</p></div>
  if (!options) return <div className="page signup-page"><p className="loading-line">Loading…</p></div>

  return (
    <div className="page signup-page">
      <div className="signup-hero">
        <p className="eyebrow">Welcome</p>
        <h1>Let's set up your commute</h1>
        <p className="hero-copy">Two taps and you're done — we'll remember this.</p>
      </div>

      {!home && (
        <div className="signup-step">
          <h2>Which station is closest to home?</h2>
          <div className="signup-options">
            {options.homeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="signup-option"
                onClick={() => setHome(opt)}
              >
                {opt.station.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {home && (
        <div className="signup-step">
          <h2>Which station is closest to work or school?</h2>
          <div className="signup-options">
            {options.workOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="signup-option"
                onClick={() => finish(opt)}
              >
                {opt.station.name}
              </button>
            ))}
          </div>
          <button type="button" className="signup-back" onClick={() => setHome(null)}>
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}

export default SignupPage
