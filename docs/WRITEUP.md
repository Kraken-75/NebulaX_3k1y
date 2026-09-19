# LTABuddy — Smart Commuter Companion

## Persona and problem

LTABuddy is built for Arjun, a flexible commuter travelling from Punggol to one-north. He prefers a predictable, less-crowded journey when he has time, but needs a clear fast option when disruption makes time important.

The app makes disruption trade-offs explicit: it surfaces a fast operational shuttle option and rewards voluntary load spreading through viable alternatives.

## Demonstrated experience

The reproducible demo uses Punggol → one-north. A demo trigger injects a disruption. When the selected trip is affected, a phone-style alert appears once. After acknowledgement, route choices remain available while navigating Home, Rewards, and Settings.

The fast option preserves the shuttle/bridging-bus route. The time-to-spare option uses the supplied static SMRT and SBS Transit alternatives: it boards a bus from the affected area, reaches an unaffected MRT station, and continues along the remaining rail network while avoiding disrupted stations and lines. Timings are labeled estimates where no live schedule exists.

## Product decisions

- The urgency toggle appears only when the selected journey is affected.
- The shuttle route is not duplicated in the time-to-spare alternatives.
- Incentives apply only to eligible load-spreading alternatives.
- Selected route and alert acknowledgement persist across in-app navigation.
- Station setup provides a searchable station dropdown and accepts exact typed names.

## Architecture

The frontend is React 19 + Vite. `src/lib/api.js` is the only browser HTTP boundary. The backend is Express; external clients live under `server/services/`, with timeouts and labeled fixture fallbacks.

Routing uses the Singapore rail topology in `server/data/stationDirectory.js`. The Punggol → one-north journey has a hand-crafted disruption scenario. Bus alternatives are stored in `server/data/busAlternatives/` from the supplied JSON snapshots. The map uses React Leaflet and OpenStreetMap tiles with attribution.

Firebase Hosting serves static files and cannot execute Express, so the frontend includes a labeled static fallback for the default demo journey when `/api/journey` is unavailable. Full live API behavior requires deploying the backend separately.

## Data and assumptions

No live credentials are committed. Without `.env`, routing, crowding, weather, disruption, and incentive values use labeled mock data. The app does not claim simulated bus services, waits, or rewards are live. Geometry and estimated timing are presentation aids, not timetable guarantees.

The disruption is replayable because backend state is intentionally in memory. The injected scenario allows judging without waiting for a real fault.

## Limitations

- OneMap has a real client but is not wired into `/api/journey` without verified credentials.
- The fully scripted disruption and bridging-bus experience is Punggol → one-north; other pairs use generic mock routes.
- Bus alternatives are static snapshots, not a live bus-planning feed.
- Stop counts, arrival times, and transfer waits are estimated from fixture durations.
- Incentive redemption and disruption state reset when the backend restarts.
- Firebase Hosting alone cannot run Express; only the static default fallback works there.
- Public OpenStreetMap tiles are suitable for this demo, not sustained production traffic.
- Mobile verification used a phone-sized browser viewport; final judging should include a physical-phone check.

## Measurement methodology

This build is a reproducible product demo, not a claims study. A production evaluation would measure: time from disruption detection to notification against the source alert timestamp; selection rate of incentivized alternatives; crowding change before and after load spreading; and post-trip comfort ratings by urgency choice. Numeric route values shown in the UI come from labeled fixtures or arithmetic over fixture leg durations and can be reproduced from the repository.
