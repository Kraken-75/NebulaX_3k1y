import { useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import RewardsPage from './pages/RewardsPage'
import BottomNav from './components/BottomNav'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [urgency, setUrgency] = useState(() => localStorage.getItem('nebulax:urgency') || 'chill')

  function handleUrgencyChange(next) {
    setUrgency(next)
    try {
      localStorage.setItem('nebulax:urgency', next)
    } catch {
      // Non-critical — just means the toggle won't persist across visits.
    }
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
          <HomePage urgency={urgency} onNavigateToPlanner={() => setActivePage('planner')} />
        )}
        {activePage === 'planner' && (
          <PlannerPage urgency={urgency} onUrgencyChange={handleUrgencyChange} />
        )}
        {activePage === 'announcements' && <AnnouncementsPage />}
        {activePage === 'rewards' && <RewardsPage />}
      </main>

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  )
}

export default App
