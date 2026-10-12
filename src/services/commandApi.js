import { adminApi } from 'src/services/adminApi'

/** Everything the Command Center, Live Ops, Alerts and System Health screens call. */

export const getCommandCenter = (days = 7) => adminApi.get('/admin/command-center', { query: { days } })
export const getAdminMeta = () => adminApi.get('/admin/meta')
export const searchAdmin = (q, signal) => adminApi.get('/admin/search', { query: { q }, signal })

export const getLiveOps = (limit = 100) => adminApi.get('/admin/live-ops', { query: { limit } })
export const getSystemHealth = () => adminApi.get('/admin/system/health')
export const getApiHealth = (hours = 24) => adminApi.get('/admin/system/api-health', { query: { hours } })

export const listAlerts = ({ status = 'open', severity, stream, page = 1, pageSize = 25 } = {}) =>
  adminApi.list('/admin/alerts', { query: { status, severity, stream, page, pageSize } })
export const getAlertCount = () => adminApi.get('/admin/alerts/count')
export const ackAlert = id => adminApi.post(`/admin/alerts/${encodeURIComponent(id)}/ack`)
export const snoozeAlert = (id, minutes) => adminApi.post(`/admin/alerts/${encodeURIComponent(id)}/snooze`, { minutes })

export const getSentryStats = (range = '24h') => adminApi.get('/admin/sentry/stats', { query: { range } })
export const searchSentry = query => adminApi.get('/admin/sentry/search', { query: { query } })
export const getSentryReleases = project => adminApi.get('/admin/sentry/releases', { query: { project } })

// Per-lesson views (existing endpoints; shapes are read defensively by the drawer).
export const getBookingDetail = sessionId => adminApi.get(`/admin/booking/${encodeURIComponent(sessionId)}`)
export const getLessonJourney = sessionId => adminApi.get(`/admin/live-lesson-logs/${encodeURIComponent(sessionId)}`)
export const getCallQualitySummary = sessionId =>
  adminApi.get(`/admin/call-quality-summary/${encodeURIComponent(sessionId)}`)
export const getSessionOpsEvents = sessionId => adminApi.get(`/admin/ops-events/session/${encodeURIComponent(sessionId)}`)
export const getUser360Summary = userId => adminApi.get(`/admin/user-360/${encodeURIComponent(userId)}`)
