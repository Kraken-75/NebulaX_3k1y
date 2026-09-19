import { readFileSync } from 'node:fs'
import { STATION_DIRECTORY } from '../data/stationDirectory.js'
import { generateTrainLegs } from './mockRouteGenerator.js'

const DATASETS = [
  { operator: 'SMRT', file: '../data/busAlternatives/smrt.json' },
  { operator: 'SBS Transit', file: '../data/busAlternatives/sbs-transit.json' },
]

const EARTH_RADIUS_KM = 6371
const AVG_BUS_KMH = 18
const WAIT_AND_TRAFFIC_MINUTES = 6
const TRANSFER_MINUTES = 8
const MAX_BUS_LEGS = 3

function normalizeStationName(value) {
  return value
    .replace(/^[A-Z]{1,3}\d+[A-Z]?(?:\/[A-Z]{1,3}\d+[A-Z]?)*\s+/i, '')
    .trim()
    .toLowerCase()
}

const stationsByName = new Map(STATION_DIRECTORY.map((station) => [normalizeStationName(station.name), station]))

function resolveStation(value) {
  const normalized = normalizeStationName(value)
  const direct = stationsByName.get(normalized)
  if (direct) return direct
  return [...stationsByName.entries()]
    .filter(([name]) => normalized.includes(name) || name.includes(normalized))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
}

function haversineKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function estimatedBusMinutes(from, to) {
  return Math.max(8, Math.round((haversineKm(from, to) / AVG_BUS_KMH) * 60 + WAIT_AND_TRAFFIC_MINUTES))
}

function buildGraph() {
  const combined = new Map()

  for (const dataset of DATASETS) {
    const content = JSON.parse(readFileSync(new URL(dataset.file, import.meta.url), 'utf8'))
    for (const [rawFrom, destinations] of Object.entries(content)) {
      const fromName = normalizeStationName(rawFrom)
      for (const [rawTo, choices] of Object.entries(destinations)) {
        const toName = normalizeStationName(rawTo)
        const key = `${fromName}|${toName}`
        const edge = combined.get(key) || { fromName, toName, choices: [] }
        for (const choice of choices) {
          edge.choices.push({
            exit: choice.exit || '',
            services: [...new Set(choice.bus_service || [])],
            operator: dataset.operator,
          })
        }
        combined.set(key, edge)
      }
    }
  }

  const graph = new Map()
  for (const edge of combined.values()) {
    const from = stationsByName.get(edge.fromName)
    const to = stationsByName.get(edge.toName)
    if (!from || !to || from.id === to.id) continue
    const list = graph.get(edge.fromName) || []
    list.push({ ...edge, from, to, minutes: estimatedBusMinutes(from, to) })
    graph.set(edge.fromName, list)
  }
  return graph
}

const BUS_GRAPH = buildGraph()

function findPaths(from, to, limit) {
  const start = normalizeStationName(from.name)
  const target = normalizeStationName(to.name)
  const queue = [{ node: start, edges: [], visited: new Set([start]), cost: 0 }]
  const results = []

  while (queue.length > 0 && results.length < limit) {
    queue.sort((a, b) => a.cost - b.cost)
    const current = queue.shift()
    if (current.node === target) {
      results.push(current)
      continue
    }
    if (current.edges.length >= MAX_BUS_LEGS) continue

    for (const edge of BUS_GRAPH.get(current.node) || []) {
      if (current.visited.has(edge.toName)) continue
      const transfer = current.edges.length > 0 ? TRANSFER_MINUTES : 0
      queue.push({
        node: edge.toName,
        edges: [...current.edges, edge],
        visited: new Set([...current.visited, edge.toName]),
        cost: current.cost + edge.minutes + transfer,
      })
    }
  }

  return results
}

function preferredChoice(edge) {
  return [...edge.choices].sort((a, b) => {
    if (a.services.length !== b.services.length) return b.services.length - a.services.length
    return a.operator.localeCompare(b.operator)
  })[0]
}

export function generateBusAlternativeRoutes(from, to, { limit = 3 } = {}) {
  if (!from || !to) return []

  return findPaths(from, to, limit).map((path, index) => {
    const busLegs = path.edges.map((edge, edgeIndex) => {
      const choice = preferredChoice(edge)
      const transferMinutes = edgeIndex > 0 ? TRANSFER_MINUTES : 0
      return {
        mode: 'bus',
        from: edge.from,
        to: edge.to,
        minutes: edge.minutes + transferMinutes,
        transferMinutes,
        line: `Bus ${choice.services.join(' / ')}`,
        services: choice.services,
        boardingExit: choice.exit,
        operator: choice.operator,
        estimatedStops: Math.max(2, Math.round(haversineKm(edge.from, edge.to) / 0.8)),
        dataSource: 'user-provided-static-bus-alternatives',
      }
    })
    const via = busLegs.slice(0, -1).map((leg) => leg.to.name).join(' & ')
    const totalMinutes = path.cost + 4

    return {
      id: `bus-alternative-${index + 1}`,
      label: via ? `Bus alternative via ${via}` : 'Direct bus alternative',
      totalMinutes,
      uncertaintyMinutes: Math.max(8, Math.round(totalMinutes * 0.18)),
      dataSource: 'user-provided-static-bus-alternatives',
      legs: [
        { mode: 'walk', from, to: from, minutes: 2 },
        ...busLegs,
        { mode: 'walk', from: to, to, minutes: 2 },
      ],
    }
  })
}

function alertAffectsLeg(alert, leg) {
  if (alert.status !== 'Disruption' || leg.line !== alert.line) return false
  const affected = (alert.affectedStations || []).map((name) => name.toLowerCase())
  return affected.some(
    (name) => leg.from?.name?.toLowerCase().includes(name) || leg.to?.name?.toLowerCase().includes(name),
  )
}

export function generateHybridBusRailRoutes({ baselineRoute, disruptions, to, limit = 4 }) {
  const alerts = disruptions.trainAlerts || []
  const affectedIndex = baselineRoute.legs.findIndex((leg) => alerts.some((alert) => alertAffectsLeg(alert, leg)))
  if (affectedIndex < 0) return []

  const affectedLeg = baselineRoute.legs[affectedIndex]
  const alert = alerts.find((candidate) => alertAffectsLeg(candidate, affectedLeg))
  const boardingStation = resolveStation(affectedLeg.from.name) || affectedLeg.from
  const affectedNames = (alert.affectedStations || []).map((name) => name.toLowerCase())
  const affectedSet = new Set(affectedNames)
  const prefixLegs = baselineRoute.legs.slice(0, affectedIndex)
  const finalWalk = baselineRoute.legs.at(-1)?.mode === 'walk'
    ? baselineRoute.legs.at(-1)
    : { mode: 'walk', from: to, to, minutes: 2 }
  const candidates = []

  for (const edge of BUS_GRAPH.get(normalizeStationName(boardingStation.name)) || []) {
    if (affectedSet.has(edge.to.name.toLowerCase())) continue

    const trainLegs = edge.to.id === to.id
      ? []
      : generateTrainLegs(edge.to, to, {
          excludedStationNames: affectedNames,
          excludedLines: [alert.line],
        })
    if (trainLegs === null) continue

    const choice = preferredChoice(edge)
    const busLeg = {
      mode: 'bus',
      from: boardingStation,
      to: edge.to,
      minutes: edge.minutes,
      transferMinutes: 0,
      line: `Bus ${choice.services.join(' / ')}`,
      services: choice.services,
      boardingExit: choice.exit,
      operator: choice.operator,
      estimatedStops: Math.max(2, Math.round(haversineKm(boardingStation, edge.to) / 0.8)),
      dataSource: 'user-provided-static-bus-alternatives',
    }
    const legs = [...prefixLegs, busLeg, ...trainLegs, finalWalk]
    const totalMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0)
    candidates.push({
      id: `bus-rail-${edge.to.id}`,
      label: `Bus to ${edge.to.name}, then MRT`,
      totalMinutes,
      uncertaintyMinutes: Math.max(7, Math.round(edge.minutes * 0.22)),
      dataSource: 'user-provided-static-bus-alternatives-plus-rail-network',
      legs,
    })
  }

  return candidates.sort((a, b) => a.totalMinutes - b.totalMinutes).slice(0, limit)
}
