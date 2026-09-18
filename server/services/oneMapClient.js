import { env, hasOneMap } from '../env.js'
import { fetchJson } from '../utils/fetchJson.js'

let cachedToken = null
let cachedTokenExpiry = 0

async function getToken() {
  if (!hasOneMap()) {
    throw new Error('ONEMAP_EMAIL/ONEMAP_PASSWORD not configured')
  }

  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return cachedToken
  }

  const data = await fetchJson('https://www.onemap.gov.sg/api/auth/post/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.oneMapEmail, password: env.oneMapPassword }),
  })

  cachedToken = data.access_token
  // OneMap tokens are valid ~3 days; refresh a little early to be safe.
  cachedTokenExpiry = Date.now() + (Number(data.expiry_timestamp) || 0) * 1000 - 60_000
  return cachedToken
}

// Multi-modal public-transport routing via OneMap's official routing service.
// Primary engine per the brief's requirement: OSM-based / OneMap over Google
// Maps, and OneMap specifically preferred where it covers the journey.
export async function getPublicTransportRoute({ start, end, date, time }) {
  const token = await getToken()
  const url = new URL('https://www.onemap.gov.sg/api/public/routingsvc/route')
  url.searchParams.set('start', `${start.lat},${start.lng}`)
  url.searchParams.set('end', `${end.lat},${end.lng}`)
  url.searchParams.set('routeType', 'pt')
  url.searchParams.set('date', date)
  url.searchParams.set('time', time)
  url.searchParams.set('mode', 'TRANSIT')
  url.searchParams.set('numItineraries', '3')

  return fetchJson(url.toString(), { headers: { Authorization: token } })
}
