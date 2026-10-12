export const SEVERITY_FILTERS = [
  { value: '', label: 'All severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' }
]
export const STREAM_FILTERS = [
  { value: '', label: 'Everything' },
  { value: 'lesson', label: 'Lessons & calls' },
  { value: 'business', label: 'Money & operations' }
]
export const STATUS_TABS = [
  { value: 'open', label: 'Open' },
  { value: 'snoozed', label: 'Snoozed' },
  { value: 'acked', label: 'Acknowledged' },
  { value: 'all', label: 'All' }
]
export const SNOOZE_OPTIONS = [
  { minutes: 60, label: '1 hour' },
  { minutes: 240, label: '4 hours' },
  { minutes: 1440, label: 'Until tomorrow' }
]

/** A row from /admin/alerts -> what the card shows. Rows from before streams existed read as lessons. */
export function alertView(a) {
  const stream = a.stream === 'business' ? 'business' : 'lesson'
  const sessionId = a.session_id ? String(a.session_id._id || a.session_id) : null
  const user = a.user_id && typeof a.user_id === 'object' ? { id: String(a.user_id._id), name: a.user_id.fullname || a.user_id.email || 'User' } : null
  return {
    id: String(a._id),
    severity: a.severity,
    stream,
    streamLabel: stream === 'business' ? 'Money & ops' : 'Lesson',
    title: a.title,
    summary: a.summary || null,
    type: a.event_type,
    sessionId,
    user,
    status: a.alert_status || 'open',
    at: a.createdAt,
    resolution: a.resolution_status,
    links: (a.suggested_actions || []).filter(x => x && x.href).slice(0, 4)
  }
}
