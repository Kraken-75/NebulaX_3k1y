import { env, hasLta } from '../env.js'
import { fetchJson } from '../utils/fetchJson.js'

const BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice/'

// LTA's real Load values: SEA (Seats Available), SDA (Standing Available),
// LSD (Limited Standing) — mapped onto the same l/m/h scale used everywhere
// else in the app.
const LOAD_MAP = { SEA: 'l', SDA: 'm', LSD: 'h' }

// Priority 1: real v3/BusArrival Load field, when the API actually has a
// usable reading for this stop/service.
export async function getRealBusLoad(busStopCode, serviceNo) {
  if (!hasLta()) {
    throw new Error('LTA_ACCOUNT_KEY not configured')
  }
  const url = `${BASE_URL}v3/BusArrival?BusStopCode=${busStopCode}&ServiceNo=${serviceNo}`
  const data = await fetchJson(url, { headers: { AccountKey: env.ltaAccountKey, Accept: 'application/json' } })
  const load = data?.Services?.[0]?.NextBus?.Load
  if (!load || !LOAD_MAP[load]) {
    throw new Error('No usable live load reading for this service')
  }
  return { isMock: false, level: LOAD_MAP[load] }
}

// Priority 2: a bridging/shuttle service has no real telemetry (it doesn't
// exist in LTA's schedule data), or the gap right after a disruption starts
// before real data catches up. This simulates a "next arrival" crowding
// read the same way a real commuter bus app would show one — refreshed per
// call, not a static number — but it is always explicitly flagged as mock.
//
// `deterministic: true` is used specifically for the demo-trigger scenario:
// a screen recording needs the same outcome every take, so it fixes the
// reading instead of rolling it, while the ambient/non-demo path still
// varies call to call like a real live feed would.
const WEIGHTED_LEVELS = ['l', 'l', 'm', 'm', 'm', 'h']
export function getMockLiveBusCrowding({ deterministic = false } = {}) {
  const level = deterministic ? 'm' : WEIGHTED_LEVELS[Math.floor(Math.random() * WEIGHTED_LEVELS.length)]
  return { isMock: true, level, source: 'mock' }
}
