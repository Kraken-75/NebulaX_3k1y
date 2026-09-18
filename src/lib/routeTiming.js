// Computed display timing for the GMaps-style preview/detail views — "now"
// plus our real totalMinutes/leg minutes. Not fabricated schedule data: it's
// arithmetic on the one real number we have (duration), presented the way a
// transit app conventionally shows a trip.

export function formatClock(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

// Rough headway by mode — used only for the "every N min" preview caption,
// the same kind of frequency hint GMaps shows, not a claim of real schedule
// data.
export function headwayMinutes(mode) {
  if (mode === 'bus') return 8
  if (mode === 'lrt') return 4
  return 6
}

// Fallback estimate of intermediate stop count from leg duration alone,
// assuming ~2.5 min between stops — used only for legs with no real
// distance behind them (Arjun's hand-crafted corridor fixture). Any leg
// from the generic route generator carries its own `estimatedStops`
// computed server-side from real distance (see mockRouteGenerator.js) and
// takes priority over this — see its use in RouteDetailSheet.jsx. Neither
// is a real stop list (this app has no data source for one).
export function estimateStops(minutes) {
  return Math.max(1, Math.round(minutes / 2.5))
}
