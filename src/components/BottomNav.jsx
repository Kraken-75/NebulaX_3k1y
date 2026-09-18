const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'planner', label: 'Plan', icon: '🧭' },
  { id: 'announcements', label: 'Alerts', icon: '📣' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
]

// Bottom tab bar, not a top nav: large one-handed-reachable tap targets for
// a mobile-first, elderly-legible commuter app.
function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activePage === tab.id ? 'bottom-nav-item active' : 'bottom-nav-item'}
          onClick={() => onNavigate(tab.id)}
          aria-current={activePage === tab.id ? 'page' : undefined}
        >
          <span className="bottom-nav-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
