/** Pure helpers for the Failed jobs tab. */

const groupKey = r => `${r.queue}|${r.errorType}`

/** Collapse failures into "issues": same queue + same error class = one row with a count. */
export function groupFailedJobs(rows) {
  const map = new Map()
  for (const r of rows) {
    const at = Date.parse(r.failedAt || r.at || '') || 0
    const g = map.get(groupKey(r)) || {
      key: groupKey(r),
      queue: r.queue,
      errorType: r.errorType,
      reason: r.failedReason,
      count: 0,
      firstSeen: at,
      lastSeen: at
    }
    g.count += 1
    if (at && (!g.firstSeen || at < g.firstSeen)) g.firstSeen = at
    if (at >= g.lastSeen) {
      g.lastSeen = at
      g.reason = r.failedReason
    }
    map.set(g.key, g)
  }
  return [...map.values()].sort((a, b) => b.lastSeen - a.lastSeen)
}
