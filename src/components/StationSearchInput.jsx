import { useState } from 'react'

// GMaps-style editable field: always shows the current station, always
// editable, filters the (already-fetched) station list as the user types.
// Used for Home's From/To rectangles, Signup, and Settings' "change
// home/work" — one component, one behavior, everywhere a station is picked.
function StationSearchInput({ label, value, onSelect, stations, placeholder }) {
  const [query, setQuery] = useState(value?.name || '')
  const [open, setOpen] = useState(false)
  const [lastValue, setLastValue] = useState(value)

  // Keep the field in sync when `value` changes from outside (e.g. Home
  // seeding its initial From/To) without fighting the user's own typing —
  // adjusted during render rather than in an effect, per React's own
  // guidance for state derived from a prop.
  if (value !== lastValue) {
    setLastValue(value)
    setQuery(value?.name || '')
  }

  const matches =
    query.trim().length === 0
      ? stations
      : stations.filter((station) => station.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)

  return (
    <div className="station-input">
      <span className="station-input-label">{label}</span>
      <input
        type="text"
        className="station-input-field"
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          const nextQuery = event.target.value
          const exactMatch = stations.find((station) => station.name.toLowerCase() === nextQuery.trim().toLowerCase())
          setQuery(nextQuery)
          if (exactMatch) onSelect(exactMatch)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && matches.length > 0 && (
        <ul className="station-input-dropdown">
          {matches.map((station) => (
            <li key={station.id}>
              <button
                type="button"
                // Fires before the input's onBlur closes the dropdown.
                onMouseDown={(event) => {
                  event.preventDefault()
                  onSelect(station)
                  setQuery(station.name)
                  setOpen(false)
                }}
              >
                {station.name}
                <span className="station-input-line">{station.line}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default StationSearchInput
