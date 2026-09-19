# Audit v9 — first-run setup on static hosting

## Root cause found

The setup page enabled `Done` only after `StationSearchInput` called `onSelect` with a station
object. On the hosted phone site, the frontend was deployed as a static Firebase site while
`/api/stations` remained on the local Express server. The station request therefore failed,
leaving the autocomplete directory empty; typed text was only a query and never became a valid
selection.

## Fix

The frontend now bundles the same complete station directory as a fallback when `/api/stations` is
unreachable. The backend response remains authoritative when available. Exact typed station names
also commit automatically to their matching station object, which makes mobile keyboard entry
sufficient even when tapping a suggestion is awkward. Focusing an empty station field shows the
full directory in a scrollable dropdown; typing narrows it to the first six matches.

## Verification

- Confirmed lint and production build pass.
- Confirmed the setup fallback exposes the complete MRT/LRT station directory without the API.
- Confirmed exact typing commits both fields and enables `Done`.
