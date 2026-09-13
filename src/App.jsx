import { useMemo, useState } from 'react'
import './App.css'
import { announcements, routes } from './data'
import MainPage from './pages/MainPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import NavigationPage from './pages/NavigationPage'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [start, setStart] = useState('Bishan')
  const [destination, setDestination] = useState('Marina Bay')
  const [mode, setMode] = useState('Train')

  const recommendedRoutes = useMemo(() => {
    return routes.filter(
      (route) =>
        route.from.toLowerCase().includes(start.toLowerCase()) &&
        route.to.toLowerCase().includes(destination.toLowerCase()) &&
        route.mode === mode,
    )
  }, [destination, mode, start])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <p className="eyebrow">Traffic flow support</p>
            <h1>NebulaX</h1>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation">
          <button
            className={activePage === 'home' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActivePage('home')}
            type="button"
          >
            Main
          </button>
          <button
            className={activePage === 'announcements' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActivePage('announcements')}
            type="button"
          >
            Announcements
          </button>
          <button
            className={activePage === 'navigation' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActivePage('navigation')}
            type="button"
          >
            Navigation
          </button>
        </nav>
      </header>

      <main className="content">
        {activePage === 'home' && <MainPage onNavigateToRoute={() => setActivePage('navigation')} />}
        {activePage === 'announcements' && <AnnouncementsPage announcements={announcements} />}
        {activePage === 'navigation' && (
          <NavigationPage
            start={start}
            destination={destination}
            mode={mode}
            setStart={setStart}
            setDestination={setDestination}
            setMode={setMode}
            recommendedRoutes={recommendedRoutes}
          />
        )}
      </main>
    </div>
  )
}

export default App
