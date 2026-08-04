# Realtime + call-diagnostics ops playbook (NET-33)

Ops guide for admin live metrics and bad-call triage. No SSH required for the happy path.

## Admin realtime signals

| Signal | Source | Meaning | Act |
|--------|--------|---------|-----|
| Chip **Realtime connected** (home) | `AdminRealtimeContext` Socket.IO `connect` | Admin JWT socket joined; will receive pushes | Healthy |
| Chip **Realtime connecting** / disconnected | `disconnect` / no connect | Socket down or auth failed | Refresh page; check API base URL + token; if Redis adapter off see below |
| `ADMIN_ONLINE_USERS` | Backend `SocketInit` → room `admin-presence` | Trainers/trainees with an **active socket on this Node process** (or cluster when Redis adapter is on) | Presence is best-effort; empty list ≠ zero users if adapter/multi-PM2 is misconfigured |
| `ADMIN_DASHBOARD_METRICS` | Periodic push + `GET /admin/dashboard-metrics` | Open tickets, refunds, KYC pending, ICE/preflight failures (24h), etc. | Cards deep-link into queues; prefer metrics over guessing |
| HTTP fallback | `refreshMetrics` / `refreshOnlineUsers` | Same data without waiting for socket | Use when chip stays disconnected |

### Redis adapter off / single-process

- Socket.IO Redis adapter (`attachSocketRedisAdapter`) fans rooms across PM2 workers. If attach fails or Redis is down, `socketAdapterAttached=false` and **each process only sees its own sockets**.
- **Symptom:** Online users flap or look empty under `PM2_INSTANCES>1`; metrics may still work via HTTP.
- **Act:** Prefer `PM2_INSTANCES=1` until sticky sessions + Redis adapter are green (see `SCALE_PLAYBOOK.md`). Confirm Redis health. Admin home chip can be green on one worker while presence is incomplete — trust HTTP metrics for ops counts.
- **Reconnect:** Client uses Socket.IO default reconnect. If stuck, hard refresh. Do not “fix” by opening multiple admin tabs against different workers without sticky load balancing.

## Call-diagnostics page (`/apps/call-diagnostics`)

API: `GET /admin/call-diagnostics?sessionId=&userId=&eventType=&from=&to=`

### Event types (`eventType`)

| Event | What it is | How to read |
|-------|------------|-------------|
| `CLIENT_PRECALL_CHECK` | Device/API readiness before join | `preflight.passed=false` + reason (`NO_CAMERA`, `NO_MICROPHONE`, `NO_RTCPeerConnection`, …) → user-side hardware/permission; not ICE |
| `CLIENT_CALL_DIAGNOSTICS` | Client env snapshot | `env.connectionType`, `rtt`, platform — useful for “corporate Wi‑Fi / cellular” |
| `CALL_QUALITY_STATS` | In-call WebRTC stats | `overallScore`, `rtt`, `usingRelay`, candidate types — high relay % or high RTT → TURN/NAT path |
| `CLIENT_CLIP_PLAYBACK` | Clip play/pause media outcome | Prefer **Live lessons** (`/apps/live-lessons`) — both users + clip log |

### During a bad call

1. Grab **session Mongo id** from booking / User 360 / support ticket.
2. Filter call-diagnostics by that `sessionId` (and optionally each party’s `userId`).
3. Order of blame:
   - Preflight fail → fix camera/mic permissions or browser; do not restart Redis.
   - Preflight pass + no/low media + `usingRelay` or host candidates → ICE/TURN; check TURN creds and `SCALE_PLAYBOOK` ICE thresholds.
   - Good scores then sudden drop → mid-call network; ask both parties to move networks; check if Redis adapter / multi-instance dropped signaling (room membership).
4. Cross-check home metrics `opsCallPreflightFailures24h` / `opsInstantFailures24h` and Failed jobs (PDF/reminder are **not** call path — different queue).
5. Escalate with: session id, both user ids, event types + timestamps, preflight reason, score/RTT/relay, whether admin realtime chip was connected.

## Related

- Admin socket client: `nq-admin/src/context/AdminRealtimeContext.js`
- Backend: `src/modules/socket/init.ts`, `src/services/socketRedisAdapter.ts`
- Scale/ICE gates: `docs/SCALE_PLAYBOOK.md`
