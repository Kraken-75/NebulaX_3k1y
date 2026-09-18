# Write-up — NebulaX Smart Commuter Companion (PS2)

## Persona choice

We built for **one** named commuter, per the organizers' explicit scoring preference for
persona-focused builds over generic ones: **Arjun**, a flexible, multi-modal commuter who bikes
from home in Punggol to a Punggol interchange, then takes LRT/MRT/bus to one-north. His stated need
is comfort and predictability — avoiding crowding — over minimizing every last minute.

Arjun is also the right fit for this app's core differentiating mechanic (see below): he is
specifically the kind of commuter who, when not in a hurry, would genuinely trade a few extra
minutes for a calmer trip or a small reward. Rather than trying to also support the organizers'
other personas (which the brief explicitly warns dilutes Problem Fit scoring), we represent the
realistic "some days I'm rushing, some days I'm not" idea *within* Arjun's own profile: a simple
**urgency toggle** ("I have time to spare" vs. "I need to get there fast") that changes how the
same 3 candidate routes are ranked, and whether a load-spreading incentive is offered at all. This
is Arjun's own flexibility trait, not three competing personas.

## The core differentiators: incentivized load-spreading, and surfacing bridging buses

MyTransport, Google Maps, Citymapper and Grab all *report* crowding; none of them try to actively
rebalance it, and none of them treat a bridging/shuttle bus service as a first-class route option —
during a real disruption, that's information those apps simply don't show. This app does both.

**Load-spreading incentive.** `server/services/rankingEngine.js` scores the (up to 4) candidate
routes on time, real crowding data, and weather (rain increases the cost of exposed walk legs),
weighted differently depending on Arjun's urgency setting. When the top-ranked route is
meaningfully more crowded than a close alternative — and only when Arjun isn't rushing — the app
offers a mocked voucher for choosing that alternative instead. The reward isn't a flat amount: a
dedicated module, `server/services/incentiveCalculator.js`, tiers it (small/medium/large) from how
crowded the top route is versus how much extra time the alternative costs — a big, easy win gets a
big reward; a marginal one gets little or none. It's deliberately coarse tiering, not cent-level
math, so it stays easy to demo and explain. Styled as a partner-brand reward (FairPrice, Kopitiam,
Polar Puffs, Koufu) in `src/pages/RewardsPage.jsx`.

**Bridging buses as a genuine candidate.** When a disruption's expected delay passes LTA's real
~30-minute threshold for declaring a dedicated bridging bus service (modeled as
`bridgingBusDeclared` in `server/data/mockDisruptions.js`), the ranking engine adds that bridging
route as a real 4th candidate (`server/data/mockJourneys.js`'s `BRIDGING_BUS_ROUTE`) and scores it
on equal footing with the rest — it wins a top-3 slot only when it's genuinely competitive, not by
default and not never. Its crowding comes from `server/services/busArrivalClient.js`: real LTA
`v3/BusArrival` `Load` field first, falling back to a simulated "next arrival" reading (explicitly
flagged `isMock` in code) since a temporary bridging service has no real telemetry to query.

**This is explicitly a demonstrated concept, not a production voucher system.** No real payment or
redemption integration exists; a real deployment would need a partnership with something like
HPB Healthy365 or an SG retail rewards aggregator, plus a persistent, auditable ledger instead of
the in-memory mock store used here (`server/state/incentiveStore.js`).

**Thundering-herd risk, and how we hedged it:** if every commuter on the crowded route is steered
to the *same* alternative, that alternative stops being the less-crowded choice — the tool would
recreate the exact problem it's trying to solve. `rankRoutes()` doesn't hardcode which alternative
gets the incentive; it filters to routes that are meaningfully less crowded and not much slower,
then picks randomly among that qualifying set on every call. We have not built full operations-level
diversification (e.g. tracking how many commuters were already steered to a given route in the
last N minutes and rate-limiting further steering to it) — that would be the natural next step for
a real deployment, and a judge from transport operations would be right to push on this.

## Architecture

- **Frontend** (`src/`): React + Vite, mobile-first. The only HTTP calls it ever makes are to our
  own backend (`src/lib/api.js` is the single fetch boundary) — never to LTA, OneMap, OSRM or
  data.gov.sg directly, since those calls need a secret key or should be rate-limited server-side.
- **Backend** (`server/`): Express. `server/services/*` are the only modules that call external
  APIs; each has a timeout and throws predictably on failure so `server/routes/*` can catch and
  fall back to a labeled fixture in `server/data/*` instead of crashing or hanging. `server/state/*`
  holds two pieces of intentionally non-persistent in-memory state: the demo-disruption toggle and
  the mocked incentive ledger.
- **Routing engine**: **OneMap** (Singapore's own government geospatial/routing API) is the primary
  engine per the brief's stated preference — official infrastructure that pairs naturally with LTA
  data, and explicitly not Google Maps. A real, working OneMap client
  (`server/services/oneMapClient.js`) exists (token auth + `routingsvc` call), but this build
  environment has no OneMap credentials to obtain or verify a live token against, so `/api/journey`
  currently always serves a labeled demo itinerary for Arjun's Punggol → one-north trip rather than
  parsing an OneMap response we couldn't test. The walk/cycle leg *geometry* on top of that demo
  itinerary is real: **OSRM**'s public demo routing server (`server/services/osrmClient.js`) is used
  for those legs, which is appropriate for hackathon-scale demo traffic but would need a
  self-hosted OSRM/GraphHopper instance in production per OSM's usage policy.
- **Map**: `react-leaflet` with public OpenStreetMap raster tiles and the required
  "© OpenStreetMap contributors" attribution (`src/components/MapView.jsx`). Same production caveat
  as above — swap in MapTiler or Stadia for anything beyond a demo.
- **Crowding & disruptions**: `server/services/ltaClient.js` calls `TrainServiceAlerts`,
  `PCDRealTime`, `RoadWorks`, `PlannedBusRoutes` when `LTA_ACCOUNT_KEY` is set; otherwise labeled
  mock fixtures are used. The ranking engine treats an informational "Alert" (e.g. a crowding
  notice) differently from an actual "Disruption" — only a real disruption marks a route as
  affected and adds a time penalty; a crowding notice still feeds the ranking through the crowding
  score itself.
- **Weather**: `server/services/weatherClient.js` calls data.gov.sg's 2-hour nowcast (no key
  needed) to weight sheltered vs. exposed routes higher when it's raining near Punggol.
- **Secondary disruption signal**: `server/data/mockTelegramFeed.js`, styled on the real SGMRT
  Telegram channel's public-update format. Entirely synthetic — generated here, never scraped or
  polled from Telegram/X — every entry is labeled `source: 'mock-telegram'` in code, shown in the
  UI as an ordinary "Community updates" list rather than called out loudly, per the brief's
  guidance that this doesn't need to be defensible as real, just honest in the codebase.
- **Onboarding & location**: a 2-tap home/work signup (`GET /api/stations`, station data stays
  backend-owned) runs once and is cached in `localStorage`; a live-location marker uses browser
  geolocation with a labeled fixed-coordinate fallback if permission is denied.
- **Editable From/To routing for any pair**: Home shows always-visible, always-editable From/To
  fields (GMaps-style), seeded from live location/home/work but freely searchable against a
  ~49-station directory (`server/data/stationDirectory.js`, all 6 rail lines). Arjun's specific
  Punggol → one-north corridor keeps its hand-crafted fixture (the bridging-bus/disruption demo
  scenario); any other pair gets 3 routes generated from real straight-line distance
  (`server/services/mockRouteGenerator.js`) — clearly still mock data, but honestly reflecting the
  actual selected pair rather than silently substituting a fixed corridor, which is what the
  earlier "Ask Me" one-alternate-fixture design did and was reported as confusing/inaccurate.

## Assumptions

- No live LTA or OneMap credentials are available in this build/demo environment, so every
  integration was built and tested against its labeled mock fallback path, not a live response.
  The real API clients exist and are structurally complete, but haven't been verified against
  live data — flagged rather than claimed as working end-to-end with real feeds.
- The brief mentions a login page "already built by a teammate"; it wasn't present in any branch
  of this repository (`main`, `design-1`, or elsewhere) at the time of this build — see
  `docs/AUDIT.md`. We proceeded without one rather than block on it, since it isn't one of the 3
  mandatory capabilities.
- Arjun's origin/destination and mode mix (bike + LRT/bus, Punggol → one-north) are used as the
  default and only fully-modeled journey, per the single-persona scoring guidance.

## Limitations

- **Routing**: OneMap integration is a real client, not yet wired into the live journey endpoint
  (see Architecture above) — journeys are a labeled demo fixture with real street-level geometry
  layered on top for the walk/cycle legs.
- **Generic-pair cross-line transfers**: for any pair not on Arjun's hand-crafted corridor, the
  "Fastest" route is a real shortest path across every real interchange in
  `server/data/stationDirectory.js` — a proper multi-hop search, not just a single guessed transfer,
  so a pair needing more than one change (e.g. Woodlands → Sengkang, via Bishan then Serangoon) finds
  that real path too, not just the nearest one-transfer option. See `docs/AUDIT_V5.md`/`V6.md`. Still
  simulated travel time and straight-line leg geometry (real distance, not a real routing engine's
  street/track-level path), and per-leg stop counts are an estimate from that distance, not a real
  stop list.
- **Generic-pair bus route ("Comfort")**: entirely simulated — no live LTA DataMall key is
  configured in this environment (`LTA_ACCOUNT_KEY`), so there's no way to verify a real bus stop
  name or a real service number actually runs between an arbitrary selected pair. Rather than invent
  a specific-looking but unverified bus number, it's labeled plainly ("Bus (simulated route)",
  generic "BUS" badge) and boards/alights at the real MRT station rather than a fabricated bus stop
  name. Only the train ("Fastest") option reflects real network topology for a generic pair.
  Only 2 routes are generated for a generic pair now, not 3 — an earlier 3rd "Alternative" always
  ended up an exact duplicate of "Fastest" (same real shortest path exists only once) with just a
  different made-up duration, so it was dropped rather than kept as a fabricated-looking option —
  see `docs/AUDIT_V6.md`.
- **Route detail view (GMaps-style)**: computed board/alight clock times and estimated stop counts
  are arithmetic on the one real number available (leg duration) presented the way a transit app
  conventionally shows a trip, not real schedule/stop data (this app has no data source for either).
  GMaps' own "Save" and "Report delay" buttons were deliberately not replicated — they'd have no
  real function in this app, and shipping them would mean fake, non-functional UI.
- **Thundering-herd mitigation**: every alternative now gets an incentive (not one randomly chosen
  route), which already spreads load across 2 alternatives instead of funneling everyone onto a
  single "the" alternate. Still no rate-limited/tracked steering across time — see the incentive
  section above.
- **Mobile testing**: verified via Playwright at a 390×844 phone viewport, not a physical device,
  since this build ran in a sandboxed cloud environment without one attached. This should be
  re-verified on an actual phone before the final demo recording.
- **Offline/underground behavior**: the app caches the last successful `/api/journey` response in
  `localStorage` and shows a "reconnecting" banner when a fresh fetch fails (`useJourney`,
  `useOnlineStatus`) rather than crashing or hanging — this is not a full offline-first PWA (no
  service worker, no background sync), which the brief doesn't require.
- **Incentive system** is entirely mocked in-memory (see above) and resets on server restart.
- **Demo-disruption trigger** is also in-memory and resets on server restart — fine for a single
  recording session, not meant to represent persistent state.
- **Bridging bus crowding is deterministic only during the demo trigger** (fixed at "moderate" so
  a recording is reproducible take after take); on the ambient/non-demo path it's randomized like
  a real live feed would be, which means the bridging candidate's rank can vary outside of a demo
  session — intentional, not a bug, but worth knowing if testing manually without the trigger.
- **Any from/to pair now produces a route** (~49-station directory, see Architecture), resolving
  the earlier limitation where only Punggol ↔ one-north was functional — but only that specific
  pair has the hand-crafted fixture (bridging bus, tuned disruption/incentive numbers); every other
  pair gets a generic distance-based mock route, not real transit topology.
- **Dark mode** doesn't re-theme the map tile layer — a real dark tile needs a paid provider
  (MapTiler/Stadia), out of scope for this demo build.

## Measurement methodology (how we'd judge success)

For a real deployment, not just this hackathon build:

1. **Time-to-warn**: how far ahead of an actual disruption reaching Arjun's route the app surfaces
   a proactive re-route, measured against LTA's own alert timestamps.
2. **Route-choice deviation**: what fraction of the time commuters shown an incentive actually took
   the incentivized alternative, vs. the top-ranked route — the direct measure of whether
   load-spreading is working at all.
3. **Load-balancing effect**: change in real crowding levels (via `PCDRealTime`) on both the
   previously-top route and the incentivized alternative, before vs. after the incentive program is
   active on a given corridor — this is the test for whether the thundering-herd risk above is
   actually being avoided in practice, not just handled in theory.
4. **Comfort satisfaction**: a simple in-app rating after each trip ("was this route as comfortable
   as expected?"), segmented by urgency setting, to check the chill/rushing weighting is actually
   matching what commuters wanted that day.
