import { Router } from 'express'
import { STATION_DIRECTORY } from '../data/stationDirectory.js'

const router = Router()

// Backs the from/to autocomplete (Home, Signup, Settings' "change home/work"
// all share the same station data) — station reference data lives here, not
// duplicated in the frontend, per the separation-of-concerns rule. The
// directory is small enough (~40 stations) that the frontend fetches it
// once and filters client-side as the user types, rather than round-
// tripping per keystroke.
router.get('/', (req, res) => {
  res.json({ stations: STATION_DIRECTORY })
})

export default router
