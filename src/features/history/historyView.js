import { shortDay } from 'src/features/command-center/chartData'

export const HISTORY_RANGES = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' }
]

/** A null (never rolled up) stays null so the line shows a gap instead of a false zero. */
const col = (series, key) => series.map(d => (d[key] === undefined ? null : d[key]))

/** Business history -> chart-ready series. Money is in minor units; the chart formats it. */
export function businessCharts(history) {
  const s = history?.series || []
  const categories = s.map(d => shortDay(d.date))
  return {
    categories,
    signups: [
      { name: 'Trainees', data: col(s, 'signups_trainees') },
      { name: 'Coaches', data: col(s, 'signups_trainers') }
    ],
    bookings: [{ name: 'Lessons booked', data: col(s, 'bookings') }],
    money: [
      { name: 'GMV', data: col(s, 'gmv_minor') },
      { name: 'Platform revenue', data: col(s, 'revenue_minor') }
    ]
  }
}

export function apiCharts(history) {
  const s = history?.series || []
  return {
    categories: s.map(d => shortDay(d.date)),
    errorRate: [{ name: '5xx share', data: col(s, 'errorRate') }],
    latency: [{ name: 'Average response', data: col(s, 'avgMs') }]
  }
}

/** One sentence when the rollup has holes, so a gap in a chart is explained rather than mistaken for a quiet day. */
export function gapNote(missingDays) {
  const n = missingDays?.length || 0
  if (!n) return null
  if (n === 1) return `${missingDays[0]} hasn’t been summarised yet.`
  return `${n} days haven’t been summarised yet (${missingDays[0]} to ${missingDays[n - 1]}); they appear as gaps. The nightly job fills recent days; older ones need a backfill.`
}

export function apiSummary(history) {
  const t = history?.totals
  if (!t || t.estRequests === 0) return null
  const pct = t.errorRate === null ? '—' : `${(t.errorRate * 100).toFixed(2)}%`
  return `${Math.round(t.estRequests).toLocaleString('en-US')} requests estimated · ${pct} failed with a server error${t.avgMs === null ? '' : ` · ${t.avgMs} ms average`}`
}
