// Real SG rail-line colors so the map reads like an actual transit map, not
// a generic route line. Bus and walk get their own distinct, non-rail colors
// so they never get mistaken for a train line.
const LINE_COLORS = {
  'North East Line': '#9900AA',
  'Circle Line': '#FA9E0D',
  'North South Line': '#D42E12',
  'East West Line': '#009645',
  'Downtown Line': '#005EC4',
  'Punggol LRT': '#748477',
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

export function legIsWalk(leg) {
  return leg.mode === 'walk'
}
