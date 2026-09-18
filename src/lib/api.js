// The ONLY module in the frontend allowed to call an HTTP endpoint. It only
// ever talks to our own backend (/api/*) — never LTA, OneMap or any other
// external service directly, since those need a secret key.

async function request(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed (${response.status})`)
  }
  return response.json()
}

export function getJourney(urgency, { altDestination = false } = {}) {
  const params = new URLSearchParams({ urgency })
  if (altDestination) params.set('dest', 'today')
  return request(`/api/journey?${params.toString()}`)
}

export function getStations() {
  return request('/api/stations')
}

export function getIncentives() {
  return request('/api/incentives')
}

export function redeemIncentive(routeId, tier) {
  return request('/api/incentives/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ routeId, tier }),
  })
}

export function redeemVoucher(tierId) {
  return request('/api/incentives/redeem-voucher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tierId }),
  })
}

export function triggerDemoDisruption() {
  return request('/api/demo/trigger', { method: 'POST' })
}

export function resetDemoDisruption() {
  return request('/api/demo/reset', { method: 'POST' })
}
