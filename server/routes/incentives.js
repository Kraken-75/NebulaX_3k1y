import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getIncentiveState, awardIncentive, redeemVoucher } from '../state/incentiveStore.js'

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
    const { routeId, tier } = req.body || {}
    if (!routeId) {
      return res.status(400).json({ error: 'routeId is required' })
    }
    const result = awardIncentive({ routeId, tier })
    res.json(result)
  }),
)

// Redeeming a voucher tier (from the Rewards page progress bar) is a
// different action from earning points by choosing a route — it deducts
// from the same ledger rather than adding to it.
router.post(
  '/redeem-voucher',
  asyncHandler(async (req, res) => {
    const { tierId } = req.body || {}
    if (!tierId) {
      return res.status(400).json({ error: 'tierId is required' })
    }
    try {
      const result = redeemVoucher(tierId)
      res.json(result)
    } catch (err) {
      res.status(400).json({ error: err.message })
    }
  }),
)

export default router
