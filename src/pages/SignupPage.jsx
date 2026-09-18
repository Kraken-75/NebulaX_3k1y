import { useState } from 'react'
import StationSearchInput from '../components/StationSearchInput'
import { useStations } from '../hooks/useStations'

// First-run only, 2 taps: search and pick home, search and pick work/school,
// done. Station data comes from the backend (GET /api/stations) — the same
// directory and search component used everywhere else a station is picked
// (Home's from/to fields, Settings' "change home/work").
function SignupPage({ onComplete }) {
  const { stations, loading } = useStations()
  const [home, setHome] = useState(null)
  const [work, setWork] = useState(null)

  if (loading) return <div className="page signup-page"><p className="loading-line">Loading…</p></div>

  return (
    <div className="page signup-page">
      <div className="signup-hero">
        <p className="eyebrow">Welcome</p>
        <h1>Let's set up your commute</h1>
        <p className="hero-copy">Search and pick two stations — we'll remember this.</p>
      </div>

      <div className="signup-step">
        <StationSearchInput
          label="Home station"
          value={home}
          onSelect={setHome}
          stations={stations}
          placeholder="e.g. Punggol"
        />
        <StationSearchInput
          label="Work or school station"
          value={work}
          onSelect={setWork}
          stations={stations}
          placeholder="e.g. one-north"
        />
        <button
          type="button"
          className="primary-button"
          disabled={!home || !work}
          onClick={() => onComplete({ home, work })}
        >
          Done
        </button>
      </div>
    </div>
  )
}

export default SignupPage
