/**
 * @returns {'inactive' | 'upcoming' | 'live' | 'expired'}
 */
export function computeScheduleStatus(row) {
  if (!row?.is_active) return 'inactive'
  const now = Date.now()
  const start = row.start_date ? new Date(row.start_date).getTime() : null
  const end = row.end_date ? new Date(row.end_date).getTime() : null
  if (start != null && start > now) return 'upcoming'
  if (end != null && end < now) return 'expired'

  return 'live'
}

export function scheduleStatusChip(status) {
  const map = {
    live: { label: 'Live', color: 'success' },
    upcoming: { label: 'Scheduled', color: 'warning' },
    expired: { label: 'Expired', color: 'default' },
    inactive: { label: 'Off', color: 'default' }
  }

  return map[status] || map.inactive
}
