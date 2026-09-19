# LTABuddy — Smart Commuter Companion

LTABuddy is a mobile-first commuter app for Arjun, a flexible Punggol → one-north commuter who values a predictable, less-crowded journey when he has time to spare.

## How to test the app's reaction to a unplanned interuption
LTABuddy's demo app has a "Simulate a disruption(for demo)" drop down at the bottom of the homepage for user to receive a notification for unplanned disruptions. User can click trigger disruption until a random disruption lands in his desired travel path to test the LTABuddy's detour/alternate route proposals. Upon clicking the notification, he will get a chance to see the new alternate routes proposed.

## Submission demo

Demo recording: **[Recording link to be added]**

Try **Punggol → one-north**, trigger the disruption demo, tap the notification, and compare the fast route with the bus-assisted alternatives and incentives.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A modern browser

No API key is required for the reproducible demo.

## Install and run

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite serves the React frontend and Express runs on port 3001.

```bash
npm run dev:web   # frontend only
npm run dev:api   # backend only
npm run build     # production frontend build
npm run lint      # lint frontend and backend
```

## Configuration

Copy `.env.example` to `.env` only if you want optional live services. Never commit `.env` or credentials.

- `LTA_ACCOUNT_KEY`: free LTA DataMall key for alerts and crowding.
- `ONEMAP_EMAIL` and `ONEMAP_PASSWORD`: optional OneMap account.
- `MAPTILER_KEY` or `STADIA_API_KEY`: optional production map tiles.

With no keys, the app uses clearly labeled mock/demo fixtures so judges can reproduce it without registering for paid services.

## What to click

1. Choose **Punggol** as home and **one-north** as work/school.
2. On Home, expand **Simulate a disruption (for demo)** and trigger it.
3. Tap the disruption notification.
4. Compare **I need to get there fast** with **I have time to spare**. The latter uses supplied bus alternatives to reach an unaffected MRT station, then continues by rail where possible.
5. Open a route for its detailed timeline, or visit Rewards.

The app remembers the selected commute and route state across Home, Rewards, and Settings. The Punggol → one-north journey is the fully scripted scenario; other station pairs use clearly labeled generic mock routing.

## Firebase Hosting

```bash
npm run build
npx firebase-tools deploy --only hosting
```

Firebase Hosting does not execute Express. The frontend therefore includes a labeled static fallback for the default Punggol → one-north journey when `/api/journey` is unavailable. For full live API behavior, deploy `server/` separately with Cloud Run or Firebase Functions and configure the frontend API endpoint.

### Deploy the API with Cloud Run

The repository includes a `Dockerfile` for the Express API. After installing the Google Cloud CLI and authenticating, run:

```bash
gcloud auth login
gcloud config set project nebulax-5ede7
gcloud run deploy nebulax-api --source . --region asia-southeast1 --allow-unauthenticated
npm run build
npx firebase-tools deploy --only hosting
```

The `/api/**` Firebase rewrite sends API calls to the `nebulax-api` Cloud Run service; the second rewrite continues to serve the React SPA. Set optional backend secrets with Cloud Run environment variables, never in Git.

## Repository layout

```text
src/                 React frontend, pages, components, hooks, and API boundary
server/              Express API, routing logic, live clients, and fixtures
server/data/         Station directory, disruptions, and bus alternatives
docs/WRITEUP.md      Detailed persona, architecture, and limitations
.env.example         Environment variable names only
```

See [`WRITEUP.md`](WRITEUP.md) for the full submission write-up. Every unavailable external source is marked as mock/demo data.
