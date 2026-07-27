# Admin Next upgrade spike (NET-31) — verdict

**Decision: No-go on big-bang Next 15 App Router + TypeScript rewrite.**

**Go: harden in place on Pages Router**, delete leftover template surface only when found, upgrade deps in small PR trains.

## Current state (as of 2026-07-27)

| Item | Reality |
|------|---------|
| Framework | Next **13.2.4** Pages Router |
| Language | JavaScript (Materialize template) |
| Nav surface | Real ops routes only (`/apps/*`, MFA enroll) — template demo nav already gone |
| Auth | JWT + CASL; MFA enroll/challenge shipped (NET-29) |
| Fake-db | Dev-only (`NODE_ENV === 'development'`) |

## Security / EOL risk

- Next 13.2 is behind current Next security releases — **patch within 13.x or 14 Pages** is higher ROI than App Router migration.
- MUI 5 / Emotion 11 are still maintainable; do not force MUI 6 + App Router in one leap.
- Biggest risk is **stale Next + eslint stack**, not “missing App Router”.

## Effort estimate

| Path | Effort | Risk to ops |
|------|--------|-------------|
| Big-bang Next 15 App Router + TS | Many weeks; every page/layout/auth guard | High — admin is money/trust tooling |
| Stay Pages; bump Next 13→14 Pages + security deps | Days | Low–medium |
| Incremental TS on new files only | Ongoing | Low |

## Phased plan (approved)

1. **Phase A (now–soon)** — Stay Pages Router. Keep shipping features (MFA, finance, diagnostics). Document this spike.
2. **Phase B** — Dependency train: Next 13.2 → latest **14.x Pages** (or last 13.x security line if 14 breaks Materialize), React 18 stay, audit `npm audit` high/critical.
3. **Phase C** — Delete any remaining unused `@fake-db` demo handlers and dead template pages if they reappear; keep `build:icons` only if used.
4. **Phase D (optional, later)** — Greenfield App Router + TS only for **new** admin modules; never rewrite Home/Users/Booking in one PR.

## Explicitly out of scope

- Rewriting admin to match website App Router
- better-auth / Clerk migration
- Neon for admin analytics until warehouse metrics demand it

## Exit criteria for this spike

- [x] Go/No-go recorded (this doc)
- [x] Phased plan without big-bang
- [x] Template demo inventory: nav already ops-only
