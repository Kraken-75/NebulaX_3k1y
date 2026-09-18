# Audit v6 — dedupe, honest bus data, and real multi-transfer routing

Delta note for the sixth round of feedback, all three items against the generic (non-Arjun) route
generator. All three were root-caused, not patched at the symptom.

## Root causes found

1. **"Fastest" and "Alternative" showing as the same route with a different, made-up duration.**
   `generateGenericRoutes()` built a 3rd "Alternative" train route by re-running the same transfer
   logic as "Fastest" with a different arbitrary speed constant — since both always resolved to the
   exact same interchange (there's only one real shortest path), they produced an identical line
   sequence, just relabeled with a different fabricated total time. Not a genuine alternative, a
   fabricated-looking duplicate. Fixed by removing the 3rd route entirely:
   `server/services/mockRouteGenerator.js` now returns exactly 2 routes ("Fastest" and "Comfort"),
   never a manufactured near-duplicate. Per the explicit instruction this round ("we cannot suggest
   the same route twice... just suggest lesser alternate routes, but not the same"), offering fewer,
   honest options beats a 3rd one that only pretends to differ.
2. **Fabricated bus service number ("Bus 110") with no real route behind it.** The generic
   "Comfort" route invented a bus service number from `100 + station-name-length % 50` — a number
   with no connection to any real SBS Transit/SMRT service. Checked this environment for a live LTA
   DataMall key first (`server/env.js`'s `LTA_ACCOUNT_KEY`, and `.env`): none is configured, so there
   is no way to look up a real bus stop code/name or verify a real service actually runs between an
   arbitrary station pair — LTA's BusServices/BusRoutes/BusStops APIs return data, not a "does a bus
   run between these two points" answer, so even a live key wouldn't fully solve this without real
   routing logic this environment can't build against live data. Per this round's own conditional
   instruction, the fallback now: (a) boards/alights at the real MRT station itself rather than
   inventing a distinct bus-stop name, which was already effectively happening since the leg's
   `from`/`to` were always the real station objects; (b) stopped fabricating a specific service
   number — the leg is now labeled plainly `"Bus (simulated route)"` and renders a generic "BUS"
   badge (`src/lib/lineColors.js`'s `legCode()`) instead of a fake digit code that looked real but
   wasn't verified.
3. **Wrong (much longer) route for pairs needing more than one change, e.g. Woodlands -> Sengkang.**
   The interchange lookup added in v5 only ever searched for a single station serving both the
   origin and destination line directly. For Woodlands (North South Line) -> Sengkang (North East
   Line), the only *direct* common interchange is Dhoby Ghaut — geographically a large detour south
   into town and back out — even though a real commuter takes North South Line to Bishan, Circle
   Line to Serangoon, North East Line to Sengkang, staying in the northern part of the island the
   whole way and covering meaningfully less distance. The old logic could never find this because it
   only ever considered 0 or 1 transfers, never a genuine multi-hop path. Replaced with a proper
   shortest-path search (Dijkstra) over a small graph of this trip's own from/to stations plus every
   real interchange in `STATION_DIRECTORY`, where two stations are connected only if they actually
   share a rail line, weighted by a realistic per-leg travel-time estimate (distance/speed + a flat
   per-leg overhead for dwell time and the walk to a connecting platform) — so an extra transfer only
   wins when it's genuinely faster overall, and the search generalizes to any number of changes
   instead of being hardcoded to at most one. Verified: Woodlands -> Sengkang now correctly resolves
   to Woodlands -NS-> Bishan -CC-> Serangoon -NE-> Sengkang.

   **Also fixed as part of this:** each leg's minutes and "~N stops" estimate are now computed from
   that leg's *own* real distance, not a single direct-distance estimate split evenly across however
   many legs happen to exist. Previously, a 2-leg trip's total time was estimated once from the
   straight-line distance between the trip's endpoints, then divided roughly in half — for a detour
   route (like the old Woodlands -> Dhoby Ghaut -> Sengkang path) whose real travel distance was much
   longer than that direct line, this produced legs that looked far too short (e.g. "~6 stops (14
   min)" for a leg that geographically takes far longer at typical train speeds) — the specific
   "double check the stop number/travel time" complaint this round. Stop counts are now estimated
   from each leg's real distance (`~1.2 km` average inter-station spacing) rather than backed out of
   an already-approximate duration number, so the two figures no longer drift independently of each
   other or of reality.

## Scope note

Per this round's instruction ("if you cannot [find a real bus API], just let me know so I can
exclude such examples") and this project's established practice of flagging what's still
approximate rather than silently shipping it: the "Comfort" bus route for any *generic* (non-Arjun)
pair remains entirely simulated — no real bus stop, service number, or route has been verified to
exist between the selected pair, only honestly labeled as such now instead of looking specific. If a
demo needs to avoid this, stick to routes where only the "Fastest" train option is shown, or exclude
the bus-route comparison from what's recorded. The train "Fastest" route, by contrast, now reflects
a real shortest path across the real interchange network for any pair, verified against several
different line combinations beyond the one reported (Pasir Ris -> Jurong East same-line direct;
Hougang -> Botanic Gardens via Serangoon, a different 2-transfer pair on a different set of lines).
