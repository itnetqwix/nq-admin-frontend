import { formatMinor, timeAgo } from 'src/utils/format'

/**
 * Cell text for the directory's metric columns. `metric` is undefined while the batch is still
 * loading (shown as an ellipsis, not a misleading zero) and an object once it arrives.
 */
export function lastBookedCell(metric, now = Date.now()) {
  if (metric === undefined) return '…'
  if (!metric?.lastBookingAt) return 'Never'
  return timeAgo(metric.lastBookingAt, now)
}

export function spendCell(metric) {
  if (metric === undefined) return '…'
  // Only trainees have spend; for a coach the API returns 0, which would read as "spent nothing".
  return metric.spendMinor > 0 ? formatMinor(metric.spendMinor, { compact: true }) : '—'
}

/** Ids on the current page, de-duplicated and capped at the API's batch limit. */
export function pageIds(rows = []) {
  return [...new Set(rows.map(r => String(r.id || r._id || '')).filter(Boolean))].slice(0, 100)
}
