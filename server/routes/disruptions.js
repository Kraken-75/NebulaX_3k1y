import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getTrainServiceAlerts, getRoadWorks, getPlannedBusRoutes } from '../services/ltaClient.js'
import { MOCK_DISRUPTIONS } from '../data/mockDisruptions.js'
import { isDemoDisruptionActive, getActiveDemoScenario } from '../state/demoState.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (isDemoDisruptionActive()) {
      return res.json(getActiveDemoScenario())
    }

    try {
      const [trainAlerts, roadWorks, plannedBusRoutes] = await Promise.all([
        getTrainServiceAlerts(),
        getRoadWorks(),
        getPlannedBusRoutes(),
      ])
      return res.json({ isMock: false, trainAlerts, roadWorks, plannedBusRoutes })
    } catch {
      return res.json(MOCK_DISRUPTIONS)
    }
  }),
)

export default router
