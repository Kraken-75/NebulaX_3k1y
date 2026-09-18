// Real SG rail-line colors so the map reads like an actual transit map, not
// a generic route line. Bus and walk get their own distinct, non-rail colors
// so they never get mistaken for a train line.
const LINE_COLORS = {
  'North East Line': '#9900AA',
  'Circle Line': '#FA9E0D',
  'North South Line': '#D42E12',
  'East West Line': '#009645',
  'Downtown Line': '#005EC4',
  'Thomson-East Coast Line': '#9D5B25',
  'Punggol LRT': '#748477',
}

// Short line-code badges, GMaps-style ("EW", "NE", ...).
const LINE_CODES = {
  'North East Line': 'NE',
  'Circle Line': 'CC',
  'North South Line': 'NS',
  'East West Line': 'EW',
  'Downtown Line': 'DT',
  'Thomson-East Coast Line': 'TE',
  'Punggol LRT': 'PG',
}

const MODE_COLORS = {
  bus: '#2E86DE',
  lrt: LINE_COLORS['Punggol LRT'],
  train: '#334155',
  walk: '#94A3B8',
}

export function legColor(leg) {
  if (leg.line && LINE_COLORS[leg.line]) return LINE_COLORS[leg.line]
  return MODE_COLORS[leg.mode] || '#334155'
}

// Short badge text for a leg — a real line's code, or the bus service
// number, or null for walk (no badge).
export function legCode(leg) {
  if (leg.mode === 'walk') return null
  if (leg.line && LINE_CODES[leg.line]) return LINE_CODES[leg.line]
  if (leg.mode === 'bus' && leg.line) return leg.line.replace('Bus ', '')
  return leg.mode === 'train' ? 'MRT' : leg.mode.toUpperCase()
}
