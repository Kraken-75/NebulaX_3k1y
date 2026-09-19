# Audit V10 — static Firebase Hosting route fallback

## Root cause

The hosted site is deployed to Firebase Hosting, which serves the Vite output but does not run
the repository's Express server. Consequently, the browser's relative `/api/journey` request
returned a hosting 404 and the UI reported that there was no saved route.

## Fix

The frontend now keeps the backend request as the primary path, but falls back to the labelled
Punggol → one-north demo fixture when that API is unavailable. The fallback adds map geometry and
explicitly marks the response as demo/static data, so it cannot be mistaken for live routing.

## Scope

This fallback is intentionally limited to the default demo commute. Live disruptions, incentive
redemption, and arbitrary station pairs still require deploying the Express API separately (for
example with Cloud Run or Firebase Functions) and routing the frontend API requests to it.

## Verification

`npm run lint` and `npm run build` pass after the change.
