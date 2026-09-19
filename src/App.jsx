import { useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import RewardsPage from './pages/RewardsPage'
import SettingsPage from './pages/SettingsPage'
import SignupPage from './pages/SignupPage'
import BottomNav from './components/BottomNav'
import { useHomeWork } from './hooks/useHomeWork'
import { useDarkMode } from './hooks/useDarkMode'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [urgency, setUrgency] = useState(() => localStorage.getItem('nebulax:urgency') || 'chill')
  const { homeWork, save: saveHomeWork } = useHomeWork()
  const [currentJourney, setCurrentJourney] = useState(null)
  const [acknowledgedDisruptionKey, setAcknowledgedDisruptionKey] = useState(null)
  // Lifted here (not just inside SettingsPage) so the saved theme applies
  // immediately on load regardless of which tab is active first.
  const [isDark, setIsDark] = useDarkMode()

  function handleUrgencyChange(next) {
    setUrgency(next)
    try {
      localStorage.setItem('nebulax:urgency', next)
    } catch {
      // Non-critical — just means the toggle won't persist across visits.
    }
  }

  if (!homeWork) {
    return (
      <SignupPage
        onComplete={(selection) => {
          saveHomeWork(selection)
          setCurrentJourney({ from: selection.home, to: selection.work })
        }}
      />
    )
  }

  // Seed the active journey once per app boot. Keeping it here rather than
  // inside HomePage means changing tabs cannot reset the user's current
  // From/To selection when HomePage unmounts and mounts again.
  const journey = currentJourney || { from: homeWork.home, to: homeWork.work }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <p className="eyebrow">NebulaX</p>
            <h1>Smart Commuter Companion</h1>
          </div>
        </div>
      </header>

      <main className="content">
        {activePage === 'home' && (
          <HomePage
            urgency={urgency}
            onUrgencyChange={handleUrgencyChange}
            from={journey.from}
            to={journey.to}
            acknowledgedDisruptionKey={acknowledgedDisruptionKey}
            onAcknowledgeDisruption={setAcknowledgedDisruptionKey}
            onClearDisruptionAcknowledgement={() => setAcknowledgedDisruptionKey(null)}
            onFromChange={(from) => setCurrentJourney({ from, to: journey.to })}
            onToChange={(to) => setCurrentJourney({ from: journey.from, to })}
            onSwap={() => setCurrentJourney({ from: journey.to, to: journey.from })}
          />
        )}
        {activePage === 'rewards' && <RewardsPage />}
        {activePage === 'settings' && (
          <SettingsPage
            homeWork={homeWork}
            onSaveHomeWork={saveHomeWork}
            isDark={isDark}
            onToggleDarkMode={() => setIsDark((prev) => !prev)}
          />
        )}
      </main>

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  )
}

export default App
