import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getPlatformCrowding } from '../services/ltaClient.js'
import { MOCK_CROWDING, DEMO_TRIGGER_CROWDING } from '../data/mockCrowding.js'
import { isDemoDisruptionActive } from '../state/demoState.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (isDemoDisruptionActive()) {
      return res.json(DEMO_TRIGGER_CROWDING)
    }
    const crowding = await getPlatformCrowding().catch(() => MOCK_CROWDING)
    res.json(crowding)
  }),
)

export default router
