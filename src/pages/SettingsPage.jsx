import { useState } from 'react'
import StationSearchInput from '../components/StationSearchInput'
import { useStations } from '../hooks/useStations'

function SettingsPage({ homeWork, onSaveHomeWork, isDark, onToggleDarkMode }) {
  const { stations } = useStations()
  const [home, setHome] = useState(homeWork.home)
  const [work, setWork] = useState(homeWork.work)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSaveHomeWork({ home, work })
    setSaved(true)
  }

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="label">Settings</p>
          <h2>Profile</h2>
        </div>
      </div>

      <article className="info-card">
        <p className="card-label">Commuter</p>
        <h3>Arjun</h3>
        <p>Flexible, multi-modal commuter — comfort and predictability over raw speed.</p>
      </article>

      <article className="info-card settings-toggle-card">
        <div>
          <p className="card-label">Appearance</p>
          <h3>Dark mode</h3>
        </div>
        <button
          type="button"
          className={isDark ? 'settings-toggle active' : 'settings-toggle'}
          role="switch"
          aria-checked={isDark}
          onClick={onToggleDarkMode}
        >
          <span className="settings-toggle-knob" />
        </button>
      </article>

      <div className="section-heading">
        <div>
          <p className="label">Default stations</p>
          <h2>Home &amp; work</h2>
        </div>
      </div>

      <div className="signup-step">
        <StationSearchInput label="Home station" value={home} onSelect={setHome} stations={stations} />
        <StationSearchInput label="Work or school station" value={work} onSelect={setWork} stations={stations} />
        <button type="button" className="primary-button" disabled={!home || !work} onClick={handleSave}>
          Save
        </button>
        {saved && <p className="confirmation-line">Saved — this is now your default From/To on Home.</p>}
      </div>
    </section>
  )
}

export default SettingsPage
