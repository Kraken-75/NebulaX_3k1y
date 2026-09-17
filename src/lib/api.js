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

export function getJourney(urgency) {
  return request(`/api/journey?urgency=${encodeURIComponent(urgency)}`)
}

export function getDisruptions() {
  return request('/api/disruptions')
}

export function getIncentives() {
  return request('/api/incentives')
}

export function redeemIncentive(routeId) {
  return request('/api/incentives/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ routeId }),
  })
}

export function triggerDemoDisruption() {
  return request('/api/demo/trigger', { method: 'POST' })
}

export function resetDemoDisruption() {
  return request('/api/demo/reset', { method: 'POST' })
}
