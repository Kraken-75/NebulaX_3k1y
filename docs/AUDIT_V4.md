# Audit v4 — GMaps-fidelity + real-routing bug fixes round

Delta note for the fourth round of feedback. Two of the six items turned out to be real bugs
(traced to root cause, not just patched at the symptom), not new features.

## Root causes found

1. **Map showing one flat grey line for non-Punggol/one-north pairs.** Not a OneMap API issue —
   there is no live OneMap call anywhere in this build (no credentials exist for it; documented
   since `docs/WRITEUP.md`'s first version). The generic mock route generator
   (`server/services/mockRouteGenerator.js`) produced a single leg labeled with a combined string
   like `"North East Line / North South Line"` for cross-line pairs, which could never match a
   real line name for coloring. Fixed by splitting cross-line routes into 2 legs at a synthetic
   midpoint, each carrying one real line name.
2. **Disruption notification only ever fired for Punggol → one-north.** Same root cause: a
   combined-label leg could never match a disruption alert's exact line name, and the notification
   itself was gated on `hasDisruption` (this trip specifically affected), so any other pair — even
   ones that genuinely didn't touch the disruption — never saw a notification at all. Fixed in two
   parts: the leg-splitting fix above makes affected-leg detection work correctly for any pair that
   does cross the disrupted line, and the notification is now shown for any *active* disruption
   regardless of whether this specific trip is touched, with distinct copy ("this doesn't affect
   your trip" vs. "click to find out how your route has changed").

## New work

- **GMaps-fidelity route UI**, built directly against the reference screenshots provided (not
  independent visual design choices): `RouteCard.jsx` is now a compact preview row (duration,
  depart–arrive time range, mode-icon + colored line-code badge strip, "every N min from X"
  caption); tapping it opens `RouteDetailSheet.jsx`, a bottom sheet with a vertical timeline
  (colored per transit leg), board/alight station names and computed times, an estimated stop
  count, and a single "Start" action. Computed clock times/stop counts are arithmetic on the one
  real number we have (duration) presented the way a transit app conventionally shows a trip — not
  fabricated schedule data. Decision made without blocking on it (flagged in chat): GMaps'
  "Save"/"Report delay" buttons were dropped rather than shipped as non-functional UI; "Start" is
  the one real action (confirms the route, same as the previous "Choose this route").
- **Swap button** between From/To (GMaps-style ⇅), and From now defaults to the saved home station
  specifically (not nearest-live-location) per this round's explicit instruction, superseding the
  "clever inference" default from an earlier round.
- **Station directory expanded** from ~49 to 140 stations — every named station across all 6 rail
  lines (including Thomson-East Coast Line), in the same searchable format used everywhere a
  station is picked. LRT loop-only stops (beyond their MRT interchange) stayed out of scope — see
  the file's own comment for why.
- **Dark-mode button-text bug**: browsers don't make `<button>` inherit text color by default,
  which is how "Trigger disruption"/"Reset" ended up invisible in dark mode. Fixed at both the
  specific rule and with a global `button { color: inherit }` safety net so this class of bug can't
  silently recur elsewhere.
- **Found while testing, not part of the original ask**: Leaflet's own map controls default to
  z-index 1000+, which was bleeding through the new route-detail sheet and (potentially) the
  notification banner. Raised our overlay z-indices comfortably above Leaflet's.
