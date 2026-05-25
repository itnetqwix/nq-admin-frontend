# NetQwix Admin Portal (`nq-admin-frontend`) — Project Documentation

> Single source of truth for **what is in the admin app, how it works, and the cases it handles**.
> Update this file every time a new page/route/service/ACL key is added.

---

## 1. Project Overview

**Type:** Next.js 13 admin dashboard for NetQwix operators. Based on the Materialize React Admin template (MUI v5 + Material design). Companion to the backend (`nq-backend-main`), web app (`nq-frontend-main`), and mobile app (`nq-mobile`).

**Runtime:** Next.js `13.2.4`, React `18.2.0`, Node `v18` (`.nvmrc`).

**Key libs:**
- **UI:** MUI v5 (`@mui/material`, `@mui/lab`, `@mui/icons-material`, `@mui/x-data-grid`), Emotion, Iconify (`@iconify/react`), `react-feather`, `react-icons`.
- **Auth/Access control:** `@casl/ability` + `@casl/react` (`AppAbility`, `AclGuard`, `AuthGuard`, `GuestGuard`).
- **State:** Redux Toolkit (`@reduxjs/toolkit`) + `react-redux`. Mostly local React state per page; Redux available for slices when needed.
- **Forms:** `react-hook-form` + `@hookform/resolvers` + `yup`.
- **Notifications/toasts:** `react-hot-toast`, `react-toastify`.
- **Calendars/charts:** `@fullcalendar/*`, `recharts`, `react-apexcharts`, `chart.js` + `react-chartjs-2`.
- **Other:** `date-fns`, `moment`, `react-datepicker`, `nprogress`, `clipboard-copy`, `react-dropzone`, `keen-slider`, `react-perfect-scrollbar`, `socket.io-client`, `bootstrap-scss`, `react-credit-cards`.

**Networking:** Native `fetch` wrapped in per-service helpers under `src/services/*Api.js`. All requests attach `Authorization: Bearer <token>` from `localStorage` (`authConfig.storageTokenKeyName`).

**Real-time:** Socket.IO client (`AdminRealtimeContext`) connects to the same backend, joins the `admin-presence` room, listens for `ADMIN_ONLINE_USERS` + `ADMIN_DASHBOARD_METRICS` updates, polls every 30 s as a fallback.

**Environment variables:** Only `NEXT_PUBLIC_*` are exposed to the client (`.env`).

- `NEXT_PUBLIC_API_BASE_URL` — backend origin (required for everything).
- `NEXT_PUBLIC_ADMIN_REGISTER_ENABLED` — show/hide the `Register administrator` flow (default `true`).
- `NEXT_PUBLIC_ADMIN_MFA_NOTICE` — show an MFA warning banner.

---

## 2. Entry Points & Layout

| File | Purpose |
|------|---------|
| `src/pages/_app.js` | Wraps every page with: `AuthProvider`, `AdminRealtimeProvider`, `CommonProvider`, `SettingsProvider`, `ThemeComponent`, `Guard` (auth/guest), `AclGuard`, `Toaster`, NProgress route loader. Default layout is `UserLayout`. |
| `src/pages/_document.js` | Custom Next.js document. |
| `src/pages/index.js` | Root route — redirects authenticated admins to `/home`, otherwise to `/login`. |
| `src/layouts/UserLayout.js` | App shell — sidebar (vertical/horizontal nav), top bar, content frame, theme toggles. |
| `src/layouts/UserThemeOptions.js` | Per-user MUI theme overrides. |
| `src/configs/themeConfig.js` | Template constants (app name, logos, routing loader, etc.). |
| `src/configs/auth.js` | Token storage key + login/register URLs. |
| `src/configs/adminEnv.js` | Feature flags from env (`isAdminRegisterEnabled`, `adminRegisterEnvHint`, `getAdminApiEnvLabel`, `showAdminMfaNotice`). |

**Guard flow (`_app.js`):**
- `Guard` renders `GuestGuard` for `guestGuard:true` pages (e.g. `/login`, `/register`, `/forgot-password`), `AuthGuard` for protected pages (default), pass-through otherwise.
- `AclGuard` evaluates `Component.acl` (or `defaultACLObj`) against `useAuth().user`.
- `getLayout` is per-page; default uses `UserLayout`.

---

## 3. Authentication

**Module:** `src/context/AuthContext.js` + `src/configs/auth.js` + `src/utils/sessionExpired.js` + `src/utils/installApiAuthHandler.js`.

**Login flow:**
1. `POST {NEXT_PUBLIC_API_BASE_URL}/auth/login` with `{ email, password }`.
2. Response shape — `result.data.access_token` + `result.data.account_type`.
3. Reject if `account_type` is not `Admin` (admin-only login).
4. Save token to `localStorage` under `authConfig.storageTokenKeyName` and call `GET /user/me` to load profile (`userInfo`).
5. Redirect to `router.query.returnUrl` or `/home`.

**Session expiry:**
- Any 401/`isUnauthorizedResponse` triggers `handleSessionExpired` → clears storage + signals provider to reset state.
- `installApiAuthHandler` patches any non-service fetch usage to detect 401s globally.

**Admin signup (bootstrap):**
- `src/services/adminAuthApi.js → registerAdminAccount` posts to `/auth/signup` with `account_type:"Admin"`.
- Requires `NEXT_PUBLIC_ADMIN_REGISTER_ENABLED` (admin app) and `ADMIN_PUBLIC_SIGNUP_ENABLED=true` (backend).

---

## 4. Access Control (`src/configs/acl.js`)

**Library:** `@casl/ability`. Subject names are kebab-cased nav/action keys (e.g. `admin-nav-finance`, `admin-action-refund`).

Rules are derived **per user**:
- If the role is not `Admin` → no rules.
- If `user.extraInfo.admin_permissions` is missing or empty → `manage all` (full access).
- If permissions object exists, each `nav_*` and `can_*` key must be present and not `false` for the matching ability to be granted.

**Nav subjects** (mirrors `src/navigation/vertical/index.js`):

| Section | Subjects |
|---------|----------|
| Home | `admin-nav-home` |
| People | `admin-nav-people`, `admin-nav-trainer-verifications`, `admin-nav-trainers`, `admin-nav-trainees` |
| Clips & video | `admin-nav-clips-library`, `admin-nav-clip-taxonomy`, `admin-nav-library-submissions`, `admin-nav-netqwix-library` |
| Operations | `admin-nav-operations`, `admin-nav-bookings`, `admin-nav-user-feedback`, `admin-nav-support-tickets`, `admin-nav-call-diagnostics` |
| Logs & audit | `admin-nav-logs`, `admin-nav-audit-logs`, `admin-nav-ops-logs` |
| Business | `admin-nav-business`, `admin-nav-finance`, `admin-nav-promo-codes`, `admin-nav-broadcasts` |

**Action subjects:**
- `admin-action-commission` (update)
- `admin-action-refund` (update)
- `admin-action-hard-delete` (delete)
- `admin-action-soft-delete` (update)

`AclGuard` uses these to hide nav items and gate page-level actions. `defaultACLObj = { action: 'manage', subject: 'all' }` for un-annotated pages.

---

## 5. Navigation (`src/navigation/`)

| File | Role |
|------|------|
| `vertical/index.js` | Primary sidebar. Section headers + grouped children. Each item carries `action`, `subject`, `path`, and `icon` (Iconify). |
| `horizontal/` | Optional horizontal nav variant. |

**Top-level menu:**
- Home — `/home`.
- People → Trainer verifications, Trainers (`manage-trainer`), Trainees (`manage-trainee`).
- Netqwix Library → Categories (`clip-taxonomy`), Library requests (`library-submissions`), Published clips (`netqwix-library`).
- Platform ops → Bookings, User feedback (`write-by-user`), Support tickets (`concern-by-user`), Call diagnostics.
- Logs → Audit log, Operations log (`ops-logs`).
- Revenue & growth → Finance, Promo codes, Broadcasts.

---

## 6. Pages (`src/pages/`)

Auth/utility pages (`guestGuard: true` or static):

| Path | Purpose |
|------|---------|
| `/index.js` | Redirect by auth status. |
| `/login` | Admin login (admin-only). |
| `/register` | Admin bootstrap signup (when enabled). |
| `/forgot-password` | Password reset request. |
| `/home` | Dashboard landing — metrics, online users, charts. |
| `/second-page` | Sample/landing template. |
| `/acl` | ACL demo / debug view. |
| `/401.js`, `/404.js`, `/500.js` | Error pages. |

App pages (under `/apps/...`):

| Route | Purpose | Backend endpoints (key) |
|-------|---------|-------------------------|
| `/apps/users/[id]` | User 360 detail (timeline, lessons, reviews, assets, audit). | `/admin/user-360/:id`, `/admin/user-timeline/:id`, `/admin/user-lessons/:id`, `/admin/user-reviews/:id`, `/admin/user-assets/:id`. |
| `/apps/manage-trainer` | Trainer management (status, commission, approve). | `/user/get-all-trainer`, `/user/update-trainer-commission`, `/user/update-trainer-status`, `/user/approve-expert/:id`. |
| `/apps/manage-trainee` | Trainee management. | `/user/get-all-trainee`. |
| `/apps/trainer-verifications` | Trainer KYC/verification queue. | `/admin/trainer-verifications`, `/admin/trainer-verifications/:userId`, `/approve`, `/reject`, `/pending-count`, `/migrate`. |
| `/apps/booking` | Bookings list & detail. | `/user/booking-list`, `/admin/booking/:bookingId`. |
| `/apps/write-by-user` | “Write us” / user feedback inbox. | `/user/write-us`, `/user/update-contact-us-status`. |
| `/apps/concern-by-user` | Support tickets (raise-concern). | `/user/raise-concern`, `/user/update-raised-concern-ticket`. |
| `/apps/call-diagnostics` | WebRTC call diagnostics + per-session call quality. | `/admin/call-diagnostics`, `/admin/call-quality-summary/:sessionId`. |
| `/apps/audit-logs` | Admin audit trail. | `/admin/audit-logs`. |
| `/apps/ops-logs` | Ops events list / resolve. | `/admin/ops-events`, `/admin/ops-events/:eventId`, `/admin/ops-events/stats`, `/admin/ops-events/playbook`, PATCH `/admin/ops-events/:eventId`. |
| `/apps/finance` | Financial ledger, escrow, payouts, audit, adjustments. | `/admin/finance/ledger`, `/admin/finance/escrow`, `/admin/finance/escrow/:holdId/release`, `/admin/finance/payouts`, `/admin/finance/payouts/:payoutId/approve`, `/admin/finance/audit-log`, `/admin/finance/wallet/adjust`. |
| `/apps/promo-codes` | Promo CRUD + toggle + visibility. | `/admin/promo-codes` (+ `/:id`, `/:id/toggle`, `/:id/visibility`). |
| `/apps/broadcasts` | Broadcast compose, history, preview audience, resend. | `/admin/broadcasts` (+ `/:id`, `/:id/resend`, `/preview-count`). |
| `/apps/clip-taxonomy` | Category + subcategory CRUD for Netqwix library. | `/admin/clip-categories`, `/admin/clip-subcategories`. |
| `/apps/library-submissions` | Review user-submitted clips. | `/admin/library-submissions` + `/:id/{approve,reject,under-review}`. |
| `/apps/netqwix-library` | Browse published library clips + presigned uploads. | `/admin/library/clips`, `/admin/library/clips/presign`, `/admin/library/clips/confirm`, `/admin/clip-play-url/:clipId`. |

Sub-pages under `/pages/apps/components/` (reusable modal/forms shared across grids):
`add-edit-commision`, `common`, `modal`, `tables`, `ticket-status`, `trainee-reject`, `trainer-status`, `user360`.

---

## 7. Views & Dashboards (`src/views/`)

| Path | Purpose |
|------|---------|
| `views/dashboards/analytics/AnalyticsOverview.js` | High-level KPIs on the home page. |
| `views/dashboards/analytics/AnalyticsSessions.js` | Session-volume chart. |
| `views/dashboards/analytics/AnalyticsTotalRevenue.js` | Revenue chart. |
| `views/broadcasts/BroadcastCompose.jsx` | Compose new broadcast (channels, audience, message preview). |
| `views/broadcasts/BroadcastHistory.jsx` | History list + filters. |
| `views/broadcasts/BroadcastDetailDrawer.jsx` | Detail side-panel. |
| `views/broadcasts/ChannelPicker.jsx` | Channel selector (email/SMS/push/in-app). |
| `views/broadcasts/MessagePreview.jsx` | Live preview. |
| `views/broadcasts/{constants.js, utils.js}` | Channel + filter constants. |
| `views/pages/auth/*` | Auth-related view fragments. |
| `views/pages/misc/*` | Misc pages (401/404/500 visuals). |

---

## 8. Shared Components

**Admin grid framework (`src/components/admin/`):**
- `AdminDataGrid.jsx` — MUI Data Grid wrapper with sane defaults.
- `AdminFilterBar.jsx` — search + filter chips.
- `AdminGridContainer.jsx` — page container with header + toolbar slots.
- `AdminLoadingState.jsx` — skeletons.
- `AdminRefreshButton.jsx` — manual refresh.
- `adminDataGridDefaults.js` — column defaults + locale.
- `index.js` — barrel.

**Clips workflow (`src/components/clips/`):**
- `ClipTaxonomyPanel.jsx` — category/subcategory CRUD UI.
- `LibrarySubmissionsPanel.jsx` — submission triage UI.
- `SubmissionStatusChip.jsx` — status pill.

**Auth gates (`src/@core/components/auth/`):**
- `AclGuard.js`, `AuthGuard.js`, `GuestGuard.js`.

**Theme + spinner + utils (`src/@core/`):** template scaffolding (theme, layout components, hooks, utils). Treat as third-party — only modify when needed.

**Mock DB (`src/@fake-db/`):** sample data hooks used by template demos. Most pages use real APIs; the fake-db import in `_app.js` is intentional template behaviour but does not affect admin endpoints.

---

## 9. Services (`src/services/`)

Each service file exports thin `fetch` wrappers. All use:
- `requireApiBaseUrl()` (utility that pulls `NEXT_PUBLIC_API_BASE_URL`, throws if missing).
- `Authorization: Bearer <token>` header.
- `Content-Type: application/json` for mutating calls.
- A consistent error path (`status === "fail"` or non-2xx throws `Error`).

| File | Backend coverage |
|------|------------------|
| `adminAuthApi.js` | `POST /auth/signup` (admin bootstrap). |
| `adminDashboardApi.js` | `/admin/dashboard-metrics`, `/admin/get-global-commission`, `/admin/online-users` + `unwrapAdminResult` helper. |
| `bookingApi.js` | `/admin/booking/:bookingId`. |
| `broadcastApi.js` | `/admin/broadcasts` CRUD + `/preview-count` + `/:id/resend`. |
| `clipsAdminApi.js` | `/admin/clip-categories`, `/admin/clip-subcategories`, `/admin/library/clips/{presign,confirm}`, `/admin/library/clips`, `/admin/library-submissions/*`, `/admin/clip-play-url/:clipId`, `/admin/trainee-accounts/:userId/{approve,reject}`. |
| `financeApi.js` | `/admin/finance/ledger`, `/escrow`, `/escrow/:holdId/release`, `/payouts`, `/payouts/:payoutId/approve`, `/audit-log`. |
| `opsApi.js` | `/admin/ops-events` (+ `:eventId`, `/stats`, `/playbook`, PATCH resolve, `/user/:userId`). |
| `promoCodeApi.js` | `/admin/promo-codes` CRUD + `/toggle` + `/visibility`. |
| `user360Api.js` | `/admin/user-360/:id`, `/user-lessons`, `/user-reviews`, `/user-assets`, `/user-timeline`, `/clip-play-url`, `/entity/:type/:id` (soft/hard delete), `/audit-logs`, `/call-diagnostics`. |
| `verificationApi.js` | `/admin/trainer-verifications` list/detail/approve/reject + `/pending-count`. |

**Convention:** All response payloads expose `data` (or `result`) as the source of truth. `unwrapAdminResult` strips out `message`/`status` envelope fields when present.

---

## 10. Real-time (Admin) — `src/context/AdminRealtimeContext.js`

- Connects only when the current user is `Admin`.
- Reads token from `localStorage` and opens `socket.io-client` against `NEXT_PUBLIC_API_BASE_URL`.
- Listens for:
  - `ADMIN_ONLINE_USERS` → updates `onlineUsers` (trainers/trainees with active socket).
  - `ADMIN_DASHBOARD_METRICS` → updates dashboard metrics.
- Falls back to polling every 30 s via `refreshMetrics` + `refreshOnlineUsers`.
- Exposed via `useAdminRealtime()` hook: `{ onlineUsers, metrics, metricsLoading, socketConnected, refreshMetrics, refreshOnlineUsers }`.
- Automatically disposes socket on sign-out / role change.

---

## 11. Common Context (`src/context/CommonContext.js`)

Holds cross-page state for shared modals, current filter selections, and notification reads. Imported by `_app.js` so it is available platform-wide.

---

## 12. Utilities (`src/utils/`)

- `apiBase.js` — `requireApiBaseUrl()` reads `NEXT_PUBLIC_API_BASE_URL` and throws with a developer-friendly message if absent.
- `sessionExpired.js` — `isUnauthorizedResponse`, `handleSessionExpired`, `clearAuthStorage`, `registerSessionExpiredCallback`.
- `installApiAuthHandler.js` — global fetch wrapper that triggers session expiry on any 401.
- `unwrapAdminResult` (in `adminDashboardApi.js`) — strips `status`/`message` envelope.

---

## 13. Pages → Backend Mapping (Cheat Sheet)

| Admin page | Routes used |
|------------|-------------|
| Home | `/admin/dashboard-metrics`, `/admin/get-global-commission`, `/admin/online-users` (+ socket). |
| User 360 | `/admin/user-360/:id`, `/admin/user-timeline/:id`, `/admin/user-lessons/:id`, `/admin/user-reviews/:id`, `/admin/user-assets/:id`, `/admin/clip-play-url/:clipId`, `/admin/entity/:type/:id`, `/admin/audit-logs`. |
| Trainers | `/user/get-all-trainer`, `/user/update-trainer-commission`, `/user/update-trainer-status`, `/user/approve-expert/:id`. |
| Trainees | `/user/get-all-trainee`. |
| Verifications | `/admin/trainer-verifications[/pending-count][/migrate]`, `/:userId[/approve][/reject]`. |
| Bookings | `/user/booking-list`, `/admin/booking/:bookingId`. |
| Write us / Concerns | `/user/write-us`, `/user/raise-concern`, `/user/update-contact-us-status`, `/user/update-raised-concern-ticket`. |
| Call diagnostics | `/admin/call-diagnostics`, `/admin/call-quality-summary/:sessionId`. |
| Audit log | `/admin/audit-logs`. |
| Ops log | `/admin/ops-events`, `/admin/ops-events/{stats,playbook,:eventId,user/:userId}`. |
| Finance | `/admin/finance/{ledger,escrow,escrow/:holdId/release,escrow/:holdId/refund,payouts,payouts/:payoutId/approve,wallet/adjust,audit-log,migrate-legacy-balances}`. |
| Promo codes | `/admin/promo-codes` (+ `/:id`, `/toggle`, `/visibility`). |
| Broadcasts | `/admin/broadcasts` (+ `/:id`, `/preview-count`, `/:id/resend`). |
| Netqwix Library | `/admin/clip-categories`, `/admin/clip-subcategories`, `/admin/library/clips` (+ `/presign`, `/confirm`, `/:clipId`), `/admin/library-submissions/*`, `/admin/trainee-accounts/:userId/{approve,reject}`, `/admin/clip-play-url/:clipId`. |
| Messaging health (admin tool) | `/admin/messaging-health`. |

---

## 14. Cases Handled

- **Admin-only access:** Login rejects non-Admin accounts. Re-renders signal `account_type` and reject otherwise.
- **Restricted admins:** Per-key ACL via `extraInfo.admin_permissions`. Falls back to “full access” for legacy admins with no permissions object.
- **Session expiry:** Centralised `handleSessionExpired` clears storage + state + redirects to `/login` when any API responds 401.
- **Realtime metrics:** 30 s poll + socket-pushed events keep the home dashboard fresh without a manual refresh.
- **Soft / hard deletes:** `/admin/entity/:entityType/:entityId` with `mode=soft|hard` (gated by `can_hard_delete`).
- **Two-admin payout approval:** `/admin/finance/payouts/:payoutId/approve` requires `second_admin_id` (handled in Finance page).
- **Bulk migrations:** “Migrate legacy trainer balances” + “Migrate trainer verifications” surfaces in the relevant pages.
- **Clip presigned uploads:** Admin Netqwix Library uploads go through `presign` → S3 PUT → `confirm`.
- **Audience preview:** Broadcast composer queries `/admin/broadcasts/preview-count` before send.
- **Idempotency:** Most admin mutations are idempotent server-side (re-running approve/reject is safe). Library presign is deterministic per key.
- **Soft 401s:** `installApiAuthHandler` ignores 401 on whitelisted no-auth endpoints (login, signup).
- **Theming + RTL:** Materialize template supports light/dark + RTL via `stylis-plugin-rtl`.

---

## 15. Scripts

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Run production build
npm run export       # Static export (rarely used)
npm run lint         # ESLint --fix on src/**/*.{js,jsx}
npm run format       # Prettier on src/**/*.{js,jsx}
npm run build:icons  # Rebuild iconify-bundle (only when adding icon packs)
```

---

## 16. How to Extend (Convention)

1. **New admin page**
   - Add a file under `src/pages/apps/<area>/index.jsx`.
   - Set `Component.authGuard = true` (default) and `Component.acl = { action, subject }` to gate access.
   - Add a corresponding nav entry in `src/navigation/vertical/index.js` with the same `subject`.
   - Add the subject to `src/configs/acl.js` (so `manage all` covers it implicitly; add explicit `can(...)` only if granular permission is required).

2. **New service**
   - Add `src/services/<feature>Api.js` using the same helpers (`requireApiBaseUrl`, auth headers, error normalization).
   - Keep one file per backend area.

3. **Reusable UI**
   - Prefer composing on top of `AdminDataGrid`, `AdminFilterBar`, `AdminGridContainer` to keep visual consistency.

4. **New realtime event**
   - Subscribe inside `AdminRealtimeContext` (or create a feature-specific provider) — re-use the same socket connection.

5. **Modals & dialogs**
   - Place shared dialogs in `src/pages/apps/components/modal/` or `…/common/` so the page directory stays focused.

6. **Always update this `PROJECT_DOCUMENTATION.md`** when adding/renaming pages, services, ACL keys, or env vars.

---

## 17. Cross-references

- Backend module catalog → `nq-backend-main/PROJECT_DOCUMENTATION.md`.
- Mobile companion → `nq-mobile/PROJECT_DOCUMENTATION.md`.
- The backend exposes admin functionality under `/admin/*` (see Routes in the backend doc) — every page in this app maps to one or more of those routes.
