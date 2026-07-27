# Admin Next upgrade spike (NET-31) — verdict

**Decision: No-go on big-bang Next 15 App Router + TypeScript rewrite.**

**Go: harden in place on Pages Router**, delete leftover template surface only when found, upgrade deps in small PR trains.

## Current state (as of 2026-07-27)

| Item | Reality |
|------|---------|
| Framework | Next **14.2.x** Pages Router (Phase B security train) |
| Language | JavaScript (Materialize template) |
| Nav surface | Real ops routes (`/apps/*`, MFA, CMS) — template demo nav already gone |
| Auth | JWT + CASL; MFA enroll/challenge shipped (NET-29) |
| Fake-db | Dev-only (`NODE_ENV === 'development'`) |

## Security / EOL risk

- Next 14.2 Pages is the approved security line for this template (no App Router).
- MUI 5 / Emotion 11 remain; do not force MUI 6 + App Router in one leap.

## Effort estimate

| Path | Effort | Risk to ops |
|------|--------|-------------|
| Big-bang Next 15 App Router + TS | Many weeks | High |
| Stay Pages; bump Next 13.2 → **14.x Pages** | Days | Low–medium |
| Incremental TS on new files only | Ongoing | Low |

## Phased plan (approved)

1. **Phase A** — Stay Pages Router; ship features. ✅
2. **Phase B** — Next 13.2 → **14.2.x Pages**, `eslint-config-next` aligned, React 18 stay. ✅
3. **Phase C** — Prune leftover `@fake-db` / dead template pages if they reappear.
4. **Phase D (optional)** — Greenfield App Router + TS only for **new** modules; never rewrite Home/Users/Booking in one PR.

## Explicitly out of scope

- Rewriting admin to match website App Router
- better-auth / Clerk migration
- Neon warehouse reports until metrics demand it (**never as OLTP**)

## Exit criteria

- [x] Go/No-go recorded
- [x] Phased plan without big-bang
- [x] Phase B Next 14 Pages bump
