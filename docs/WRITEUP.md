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

## The core differentiator: incentivized load-spreading

MyTransport, Google Maps, Citymapper and Grab all *report* crowding; none of them try to actively
rebalance it. `server/services/rankingEngine.js` scores the 3 candidate routes on time, real
crowding data, and weather (rain increases the cost of exposed walk/cycle legs), weighted
differently depending on Arjun's urgency setting. When the top-ranked route is meaningfully more
crowded than a close alternative — and only when Arjun isn't rushing — the app offers a mocked
voucher (`server/state/incentiveStore.js`) for choosing that alternative instead, styled as a
partner-brand reward (FairPrice, Kopitiam, Polar Puffs, Koufu) in `src/pages/RewardsPage.jsx`.

**This is explicitly a demonstrated concept, not a production voucher system.** No real payment or
redemption integration exists; a real deployment would need a partnership with something like
HPB Healthy365 or an SG retail rewards aggregator, plus a persistent, auditable ledger instead of
the in-memory mock store used here.

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
- **Thundering-herd mitigation** is randomized diversification only, not rate-limited/tracked
  steering — see the incentive section above.
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
