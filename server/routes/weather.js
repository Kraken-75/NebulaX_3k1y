import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getWeather } from '../services/weatherClient.js'
import { MOCK_WEATHER } from '../data/mockWeather.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const weather = await getWeather().catch(() => MOCK_WEATHER)
    res.json(weather)
  }),
)

export default router
