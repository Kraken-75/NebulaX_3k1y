import { Router } from 'express'
import { HOME_OPTIONS, WORK_OPTIONS } from '../data/stations.js'

const router = Router()

// Backs the 2-tap home/work signup picker. Station reference data lives
// here, not duplicated in the frontend, per the separation-of-concerns rule.
router.get('/', (req, res) => {
  res.json({ homeOptions: HOME_OPTIONS, workOptions: WORK_OPTIONS })
})

export default router
