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
    return <SignupPage onComplete={saveHomeWork} />
  }

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
          <HomePage urgency={urgency} onUrgencyChange={handleUrgencyChange} homeWork={homeWork} />
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
