// In-memory only, by design: this is a hackathon demo toggle for reliably
// recording the "one complete commuter journey through a disruption" flow,
// not persisted state. Restarting the server resets it.
let disruptionTriggered = false

export function triggerDemoDisruption() {
  disruptionTriggered = true
}

export function resetDemoDisruption() {
  disruptionTriggered = false
}

export function isDemoDisruptionActive() {
  return disruptionTriggered
}
