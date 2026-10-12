/** Board filters, applied on the rows the API already returned (it caps at ~100). */
export const STATE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'late', label: 'Late' },
  { value: 'upcoming', label: 'Starting soon' }
]

export function filterLessons(lessons = [], { state = 'all', q = '', issuesOnly = false, kind = 'all' } = {}) {
  const needle = String(q || '').trim().toLowerCase()
  return lessons.filter(l => {
    if (state !== 'all' && l.state !== state) return false
    if (issuesOnly && !(l.lowQualityEvents30m > 0)) return false
    if (kind === 'instant' && !l.isInstant) return false
    if (kind === 'scheduled' && l.isInstant) return false
    if (needle) {
      const hay = `${l.trainer?.name || ''} ${l.trainee?.name || ''} ${l.sessionId}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

/** Count per state for the filter chips, ignoring the active state filter. */
export function stateCounts(lessons = []) {
  const counts = { all: lessons.length, live: 0, waiting: 0, late: 0, upcoming: 0 }
  lessons.forEach(l => {
    if (counts[l.state] !== undefined) counts[l.state] += 1
  })
  return counts
}

/** "12m", "1h 04m" since a time, or "in 8m" until it. Ticks with the `now` passed in. */
export function elapsedLabel(from, now = Date.now()) {
  if (!from) return '—'
  const t = new Date(from).getTime()
  if (!Number.isFinite(t)) return '—'
  const sec = Math.round((now - t) / 1000)
  const abs = Math.abs(sec)
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const text = h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : m > 0 ? `${m}m` : `${abs}s`
  return sec >= 0 ? text : `in ${text}`
}
