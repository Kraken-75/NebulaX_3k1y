# Audit v7 — disruption-scoped urgency controls

Delta note for the seventh round of feedback, covering the visibility of the urgency choice on
Home.

## Root cause found

The "I have time to spare" / "I need to get there fast" control was rendered unconditionally at
the top of `HomePage`. That made a disruption-response decision look like a permanent route-planner
setting, including for ordinary journeys and for active faults elsewhere on the network that did
not touch the selected From/To journey.

The backend already computes the correct route-specific source of truth: `rankRoutes()` marks legs
as affected only when a real `Disruption` alert matches the leg's rail line and affected stations,
then exposes each route's `affected` flag. `HomePage` already aggregates those flags as
`hasDisruption` for route comparison and notification behavior. The fix therefore uses that same
flag to render the urgency control only when the selected journey is affected, rather than adding
a second frontend approximation of disruption overlap.

## Scope

The notification behavior is unchanged: an active disruption elsewhere on the network can still
notify the commuter that their trip is not affected. The demo controls, persisted urgency
preference, and mock-data honesty pattern are also unchanged.

## Follow-up fixes in the same feedback round

**The bridging shuttle appeared under both urgency choices and received an incentive under "time
to spare".** The endpoint inserted the shuttle into one shared candidate pool before applying
either urgency profile. Both rankings could retain it, and the generic chill-mode incentive pass
treated it like any other lower-ranked route. The shuttle is now exclusive to the "need to get
there fast" pool, so it cannot receive a chill-mode incentive. Journey fallback caches are keyed
by urgency as well, preventing one choice from reusing the other's offline result.

For "time to spare", the two user-supplied SBS Transit and SMRT JSON datasets now live under
`server/data/busAlternatives/`. A backend-only graph router normalizes their station keys. It keeps
the unaffected prefix of the original journey, boards a supplied bus at the first disrupted rail
segment, and considers only connections that alight at an unaffected MRT station. From there, the
existing real interchange graph calculates the train remainder while excluding the disrupted line
and stations. OSM/OSRM cannot calculate MRT itineraries, so it remains limited to supported street
geometry rather than being mislabeled as a transit API. The files provide connectivity, exits, and
services—not live travel times—so bus durations and stop counts remain estimated and the response
stays in demo mode. Route details expose each supplied exit and service list.

**The route-detail scrollbar remained visible.** The sheet's own scrollbar is now visually hidden
across Firefox, legacy Edge, and WebKit/Blink while retaining touch, wheel, and keyboard scrolling.
The underlying document is also scroll-locked whenever the fixed sheet is open, removing the
second page scrollbar visible at the right edge of the supplied screenshot.

**Returning to Home reset the selected From/To stations.** Those values lived inside `HomePage`,
which tab navigation unmounts. The active selection now lives in `App`, above the tab boundary, so
edits and swaps survive navigation within the current session. A genuine reload still starts from
the saved home/work defaults, as requested.

## Verification

- Confirmed the control is absent for an ordinary journey and for a disruption whose affected
  route flags are all false.
- Confirmed it appears when at least one returned route is marked `affected`.
- Ran `npm run lint` and `npm run build` successfully.
- Checked the Home page at the established 390×844 mobile viewport.
- Confirmed chill mode shows the best generated bus alternatives and no bridging shuttle, while
  rushing mode can include the shuttle and carries no incentives.
- Opened a bus route detail and confirmed its exits, service numbers, estimated transfer/wait time,
  total duration, and arrival time agree.
- Confirmed generated alternatives switch from bus to MRT only at unaffected stations and that the
  remaining rail legs contain neither the disrupted line nor affected stations.
- Confirmed no scrollbar is visible with route details open and that the sheet still scrolls.
- Changed From/To, navigated to Rewards and back, and confirmed the selection remained intact;
  reloading restored the saved home/work defaults.
# Audit v7 — map painting over the bottom nav

Delta note for the seventh round of feedback.

## Root cause found

1. **The Leaflet map spilled over the fixed bottom nav.** `.bottom-nav` is `position: fixed` with no
   `z-index`, while Leaflet's own stylesheet gives its panes `z-index` 400–700 and its +/- controls
   1000. `.map-shell` only set `overflow: hidden` and a border, which doesn't create a stacking
   context, so Leaflet's layers joined the page's root stacking context and painted above the nav
   when the map scrolled beneath it. The phone notification (1500) and station dropdown (1200)
   already sat above Leaflet's 1000, which is why only the nav showed the bug.
   Fixed by adding `isolation: isolate` to `.map-shell` (`src/App.css`), so Leaflet's z-indexes are
   contained inside the map box and can no longer compete with anything outside it. Chosen over
   raising `.bottom-nav`'s z-index because it fixes the cause for every fixed element, not just the nav.

## Left out of scope

- The station dropdown stays capped at 6 results (`StationSearchInput.jsx`), by explicit decision this
  round — not a bug.

## Verification

- `npm run lint` and `npm run build` pass clean.
- Not verified visually in a browser (no Playwright screenshot taken this round).
