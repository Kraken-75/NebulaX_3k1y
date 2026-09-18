import { fetchJson } from '../utils/fetchJson.js'

const NOWCAST_URL = 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast'

// No API key needed. We look for the forecast area closest to Punggol
// (Arjun's origin) since that's what should drive "is a sheltered route
// worth it right now" in the ranking engine.
export async function getWeather() {
  const data = await fetchJson(NOWCAST_URL)
  const forecasts = data?.items?.[0]?.forecasts || []
  const punggolForecast = forecasts.find((f) => f.area?.toLowerCase().includes('punggol'))
  const forecastText = punggolForecast?.forecast || forecasts[0]?.forecast || 'Fair'
  const isRaining = /rain|shower|thunder/i.test(forecastText)

  return { isMock: false, forecast: forecastText, isRaining }
}
