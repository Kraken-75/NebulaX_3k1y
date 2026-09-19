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
