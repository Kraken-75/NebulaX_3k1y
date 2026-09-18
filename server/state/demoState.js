import { DEMO_TRIGGER_SCENARIOS } from '../data/mockDisruptions.js'

// In-memory only, by design: this is a hackathon demo toggle for reliably
// recording the "one complete commuter journey through a disruption" flow,
// not persisted state. Restarting the server resets it.
let disruptionTriggered = false
let activeScenarioIndex = 0

// Random, but never repeats the scenario that's still showing on screen —
// re-pressing "Trigger disruption" twice in a row should visibly change
// something for a demo, not silently reselect the same fault by chance.
function pickNextScenarioIndex() {
  if (DEMO_TRIGGER_SCENARIOS.length <= 1) return 0
  let next = activeScenarioIndex
  while (next === activeScenarioIndex) {
    next = Math.floor(Math.random() * DEMO_TRIGGER_SCENARIOS.length)
  }
  return next
}

export function triggerDemoDisruption() {
  disruptionTriggered = true
  activeScenarioIndex = pickNextScenarioIndex()
}

export function resetDemoDisruption() {
  disruptionTriggered = false
}

export function isDemoDisruptionActive() {
  return disruptionTriggered
}

// The scenario stays fixed across repeated /api/journey polls for the same
// triggered disruption (rather than re-randomizing per request), so a
// screen recording doesn't flicker between different fault lines mid-take.
export function getActiveDemoScenario() {
  return DEMO_TRIGGER_SCENARIOS[activeScenarioIndex]
}
