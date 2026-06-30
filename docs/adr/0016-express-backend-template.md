# ADR-0016: Express backend template for mobile/extension clients

## Status

Accepted — 2026-06-30

## Context

Mobile and extension clients cannot hold server secrets. They need an API server for sign-in,
payments, and data. Forcing buyers to scaffold the full Next.js web template when they only want a
phone app or Chrome extension created dead ends and violated the "do it for them" contract.

## Decision

Add a fourth owned template: **`templates/backend/`** — Express MVC API server scaffolded via
`vybekiit scaffold backend` into the buyer's existing repo. Web stays Next.js full-stack; backend
serves mobile/extension via `APP_URL` / `EXPO_PUBLIC_APP_URL` / `WXT_PUBLIC_APP_URL`.

`planFeatureReadiness()` orchestrates auto-scaffolding when mobile/extension features need a backend
and neither `backend/` nor Next.js web exists.

## Consequences

- CLI gains `scaffold backend`, `backend add-route`, `backend add-crud`, `backend add-upload`.
- `@vybekiit/agent-kit` gains goal routing, feature readiness, and setup planners (CLI-first).
- Buyers may have web + mobile + backend in one monorepo — agent orchestrates, builder never chooses.
