import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getIncentiveState, awardIncentive } from '../state/incentiveStore.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(getIncentiveState())
  }),
)

// Mocked redemption: choosing the incentivized route earns points. No real
// payment/voucher provider is involved — see docs/WRITEUP.md.
router.post(
  '/redeem',
  asyncHandler(async (req, res) => {
    const { routeId } = req.body || {}
    if (!routeId) {
      return res.status(400).json({ error: 'routeId is required' })
    }
    const result = awardIncentive({ routeId })
    res.json(result)
  }),
)

export default router
