# Audit v5 — real interchange routing + disruption scenario variety

Delta note for the fifth round of feedback. Both items were about the generic (non-Arjun) route
generator and the demo disruption trigger; both were root-caused rather than patched at the symptom.

## Root cause found

**Map drawing a straight line through cross-line trips, and the route detail sheet showing
"Interchange" instead of a real station name.** Reported against Woodlands → Kent Ridge, but not
specific to that pair — the generic mock route generator's `transitLegs()`
(`server/services/mockRouteGenerator.js`) modeled every cross-line transfer as the arithmetic
midpoint of the from/to coordinates, labeled `"Interchange"`. For two points that happen to be
roughly collinear (like Woodlands and Kent Ridge, both near the north-south axis), that midpoint
lands almost exactly on the straight line between them, so the map never visibly bent, and the
label was never a real station name the route detail sheet could show.

Fixed generically, not just for this one pair: `server/data/stationDirectory.js`'s ~140 stations
already had one `line` per station; every station that's a real interchange (Jurong East, Bishan,
Newton, Orchard, Dhoby Ghaut, City Hall, Raffles Place, Marina Bay, Paya Lebar, Bugis, Outram Park,
Buona Vista, MacPherson, Expo, HarbourFront, Chinatown, Little India, Serangoon, Promenade, Botanic
Gardens, Bayfront, Caldecott, Stevens — 23 in total) now also carries a `lines` array naming every
line it actually serves. `mockRouteGenerator.js` gained `findInterchange(from, to)`, which searches
the directory for a station serving both the origin and destination lines and, when more than one
exists for a line pair, picks whichever minimizes total travel distance
(`haversineKm(from, candidate) + haversineKm(candidate, to)`). The old geometric midpoint is now
only a fallback for the (currently nonexistent, but possible as the directory evolves) case where no
tagged interchange exists for a given line pair — a data gap degrades gracefully instead of
crashing.

Verified against the reported pair and a second, unrelated pair on different lines (Pasir Ris → 
Woodleigh, East West → North East) to confirm this isn't a special case for Woodlands/Kent Ridge —
both correctly resolve through their real interchange (Bishan; Outram Park) with the map bending at
that station's real coordinates and the route detail sheet naming it.

## New work

**Two additional demo disruption scenarios, randomly selected per trigger.** The demo trigger
previously had exactly one hard-coded scenario (North East Line, Sengkang → Dhoby Ghaut).
`server/data/mockDisruptions.js`'s `DEMO_TRIGGER_DISRUPTIONS` (a single object) is now
`DEMO_TRIGGER_SCENARIOS` (an array of 3): the original NEL one, an East West Line one (Clementi →
Redhill), and a North South Line one (Orchard → Raffles Place) — both new corridors and affected-
station lists taken from the real SG MRT map. `server/state/demoState.js` now stores which scenario
is active, chosen at random on each `POST /api/demo/trigger` call; it deliberately excludes
immediately re-picking the scenario that's already showing, so pressing "Trigger disruption" twice
in a row always visibly changes something for a demo recording rather than silently reselecting the
same fault by a 1-in-3 chance. The active scenario stays fixed across repeated `/api/journey` polls
(same pattern as the original single-scenario design) so a recording doesn't flicker mid-take.

**Found while implementing, not part of the original ask:** the bridging-bus route candidate
(`BRIDGING_BUS_ROUTE` in `mockJourneys.js`, labeled "NEL relief") and the mock Telegram community
feed are both hand-written specifically about the North East Line fault — they only make sense for
that one scenario. The pre-existing gating in `server/routes/journey.js` added the bridging bus
candidate whenever *any* disruption declared `bridgingBusDeclared: true`, regardless of which line —
harmless with only one scenario, but with 3 now live it would have wrongly offered "NEL Bridging
Bus" as a route option during an East West or North South Line fault. Fixed by scoping that check to
`alert.line === 'North East Line'` specifically, alongside the existing `isArjunCorridor` check —
the community feed uses the same fix. The other two scenarios still correctly show the disruption
notification and (for any generic route that actually crosses the affected line) mark the relevant
leg as affected; they just don't have a hand-crafted bridging-bus fixture the way the NEL one does,
consistent with this app's existing documented limitation that only Arjun's specific corridor gets
hand-crafted route fixtures.

Verified via repeated `POST /api/demo/trigger` calls (confirmed rotation across all 3 lines, no
consecutive repeats), and visually: with the North South Line scenario active, Arjun's own
Punggol → one-north corridor correctly shows the "this doesn't affect your trip" notification copy
(from Audit v4's affected/unaffected distinction) rather than a false-positive bridging-bus offer.
