# Audit v8 — persist disruption acknowledgement across tabs

## Root cause found

The selected From/To stations already lived in `App`, but the disruption notification state still
lived inside `HomePage`. Switching to Rewards or Settings unmounted Home; returning mounted a fresh
page with `revealed` reset, so the notification appeared again and the route comparison collapsed
back to only its top route.

## Fix

`App` now stores the acknowledgement key for the active disruption. `HomePage` derives a stable key
from the active alert ID and uses it to keep the notification dismissed and the full affected-route
comparison open across tab navigation. Triggering or resetting a demo disruption clears the key, so
a genuinely new disruption still produces the initial notification. The acknowledgement remains
session-only; a new app boot starts with the normal initial notification behavior.

## Scope and verification

Route ranking, urgency behavior, the disruption notification copy, and mock-data handling are
unchanged. Verified with lint/build and a mobile navigation flow: click the first notification,
visit Rewards, return Home, and confirm the notification stays dismissed while alternatives remain
visible.
