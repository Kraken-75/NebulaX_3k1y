// Every outbound call to an external API (LTA DataMall, OneMap, OSRM,
// data.gov.sg) goes through this so timeouts, non-2xx responses and bad JSON
// all fail the same predictable way, and callers can decide how to degrade.
export async function fetchJson(url, { headers, timeoutMs = 6000, ...rest } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { headers, signal: controller.signal, ...rest })

    if (!response.ok) {
      throw new Error(`Request to ${url} failed with status ${response.status}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}
