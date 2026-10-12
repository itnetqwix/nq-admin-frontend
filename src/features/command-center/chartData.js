const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2026-10-05' -> 'Oct 5' (the date is a calendar day, so no timezone shifting). */
export function shortDay(isoDay) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDay || ''))
  if (!m) return String(isoDay ?? '')
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`
}

/** '2026-10-11T14:00:00Z' -> '14:00' (UTC hour bucket from the API). */
export function shortHour(isoHour) {
  const m = /T(\d{2}):/.exec(String(isoHour || ''))
  return m ? `${m[1]}:00` : String(isoHour ?? '')
}

/** Daily KPI rows -> chart series. A redacted GMV (null) yields no money series at all. */
export function dailyTrend(daily = []) {
  const categories = daily.map(d => shortDay(d.date))
  const hasMoney = daily.length > 0 && daily.every(d => d.gmvMinor !== null && d.gmvMinor !== undefined)
  return {
    categories,
    gmv: hasMoney ? [{ name: 'GMV', data: daily.map(d => d.gmvMinor) }] : null,
    bookings: [{ name: 'Bookings', data: daily.map(d => d.bookings) }]
  }
}

/** Hourly API health buckets -> chart series (error rate as a ratio, latency in ms). */
export function apiTrend(buckets = []) {
  return {
    categories: buckets.map(b => shortHour(b.hour)),
    errorRate: [{ name: '5xx rate', data: buckets.map(b => (b.errorRate == null ? 0 : b.errorRate)) }],
    latency: [{ name: 'Avg latency', data: buckets.map(b => (b.avgMs == null ? 0 : b.avgMs)) }]
  }
}
