import { env, hasLta } from '../env.js'
import { fetchJson } from '../utils/fetchJson.js'

const BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice/'

function authHeaders() {
  if (!hasLta()) {
    throw new Error('LTA_ACCOUNT_KEY not configured')
  }
  return { AccountKey: env.ltaAccountKey, Accept: 'application/json' }
}

export async function getTrainServiceAlerts() {
  const data = await fetchJson(`${BASE_URL}TrainServiceAlerts`, { headers: authHeaders() })
  const messages = Array.isArray(data?.value?.Message) ? data.value.Message : []
  return messages.map((message, index) => ({
    id: `${message.CreatedDate || 'alert'}-${index}`,
    line: message.Line || 'Unknown line',
    status: data.value.Status === 2 ? 'Disruption' : 'Alert',
    affectedStations: message.Stations ? message.Stations.split(',') : [],
    message: message.Content || 'Train service alert',
    createdAt: message.CreatedDate || null,
  }))
}

export async function getPlatformCrowding() {
  const data = await fetchJson(`${BASE_URL}PCDRealTime`, { headers: authHeaders() })
  const rows = Array.isArray(data?.value) ? data.value : []
  const stations = {}
  for (const row of rows) {
    if (row.Station && row.CrowdLevel) {
      stations[row.Station] = row.CrowdLevel.toLowerCase()
    }
  }
  return { isMock: false, stations }
}

export async function getRoadWorks() {
  const data = await fetchJson(`${BASE_URL}RoadWorks`, { headers: authHeaders() })
  return Array.isArray(data?.value) ? data.value : []
}

export async function getPlannedBusRoutes() {
  const data = await fetchJson(`${BASE_URL}PlannedBusRoutes`, { headers: authHeaders() })
  return Array.isArray(data?.value) ? data.value : []
}
