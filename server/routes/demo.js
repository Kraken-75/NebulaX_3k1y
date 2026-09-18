import { Router } from 'express'
import { triggerDemoDisruption, resetDemoDisruption, isDemoDisruptionActive } from '../state/demoState.js'

const router = Router()

// Deterministic, reproducible "trigger test disruption" control for screen
// recording — the brief explicitly requires not depending on a real
// disruption occurring at record time.
router.post('/trigger', (req, res) => {
  triggerDemoDisruption()
  res.json({ active: true })
})

router.post('/reset', (req, res) => {
  resetDemoDisruption()
  res.json({ active: false })
})

router.get('/status', (req, res) => {
  res.json({ active: isDemoDisruptionActive() })
})

export default router
