import { formatDelta, formatInt, formatPct } from 'src/utils/format'

/** Plain-language names for lifecycle stages, with what each one means and how worried to be. */
export const STAGE_META = {
  new: { label: 'New', tone: 'info', help: 'Signed up in the last 2 weeks, no booking yet' },
  never_booked: { label: 'Never booked', tone: 'warning', help: 'Signed up over 2 weeks ago and still has not booked' },
  activated: { label: 'Activated', tone: 'success', help: 'Booked recently, once so far' },
  engaged: { label: 'Engaged', tone: 'success', help: 'Booked recently and more than once' },
  at_risk: { label: 'At risk', tone: 'warning', help: 'Last booked 30–90 days ago' },
  churned: { label: 'Churned', tone: 'danger', help: 'Last booked over 90 days ago' }
}

export function stageRows(segments) {
  const top = Math.max(...(segments?.stages || []).map(s => s.users), 0)
  return (segments?.stages || []).map(s => ({
    stage: s.stage,
    ...(STAGE_META[s.stage] || { label: s.stage, tone: 'neutral', help: '' }),
    users: s.users,
    share: s.share === null || s.share === undefined ? '—' : formatPct(s.share, 0),
    widthPct: top > 0 ? Math.max(s.users > 0 ? 3 : 0, Math.round((s.users / top) * 100)) : 0
  }))
}

/**
 * Cell shading for the retention heatmap: opacity follows the percentage, capped so text stays
 * readable on both themes. Returns a CSS color-mix() string; null for "no data".
 */
export function heatBackground(pct, accent = 'var(--nq-accent, #2B5FFF)') {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return null
  const strength = Math.round(Math.min(Math.max(pct, 0), 1) * 70)
  return `color-mix(in srgb, ${accent} ${strength}%, transparent)`
}

/** Cohort matrix -> table rows with display strings. `metric` picks percentage or revenue cells. */
export function cohortTable(data, metric = 'retention') {
  if (!data) return { columns: 0, rows: [], average: [] }
  const columns = Math.max(0, ...data.cohorts.map(c => c.cells.length))
  const fmtMoney = m => (m ? `$${(m / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—')
  const cellView = (cell, size) => {
    if (!cell) return null
    if (metric === 'revenue') return { text: fmtMoney(cell.revenueMinor), pct: null, title: `${formatInt(cell.users)} active · ${fmtMoney(cell.revenueMinor)} booked` }
    return {
      text: cell.pct === null ? '—' : formatPct(cell.pct, 0),
      pct: cell.pct,
      title: `${formatInt(cell.users)} of ${formatInt(size)} people`
    }
  }
  return {
    columns,
    rows: data.cohorts.map(c => ({ label: c.label, start: c.start, size: c.size, cells: Array.from({ length: columns }, (_, n) => cellView(c.cells[n], c.size)) })),
    average: Array.from({ length: columns }, (_, n) => {
      const a = data.average?.[n]
      return a ? { text: a.pct === null ? '—' : formatPct(a.pct, 0), pct: a.pct, title: `${formatInt(a.users)} of ${formatInt(a.size)} people` } : null
    })
  }
}

/** Link to the Users directory for one cohort week/month so a cell can answer "who are these people?". */
export function cohortUsersLink(cohort, kind, role) {
  const from = new Date(cohort.start)
  const to = new Date(from)
  if (kind === 'month') to.setUTCMonth(to.getUTCMonth() + 1)
  else to.setUTCDate(to.getUTCDate() + 7)
  const params = new URLSearchParams({ account_type: role, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) })
  return `/apps/users?${params.toString()}`
}

export function overviewTiles(o, supply) {
  if (!o) return []
  const delta = (cur, prev) => (prev > 0 ? (cur - prev) / prev : null)
  const t = o.signups
  return [
    { key: 'trainees', label: 'New trainees', value: formatInt(t.trainees), delta: delta(t.trainees, t.previousTrainees), deltaLabel: formatDelta(delta(t.trainees, t.previousTrainees)), href: '/apps/manage-trainee' },
    { key: 'coaches', label: 'New coaches', value: formatInt(t.trainers), delta: delta(t.trainers, t.previousTrainers), deltaLabel: formatDelta(delta(t.trainers, t.previousTrainers)), href: '/apps/manage-trainer' },
    { key: 'a7', label: 'Active trainees (7d)', value: formatInt(o.activeTrainees7d), hint: 'booked in the last week' },
    { key: 'a30', label: 'Active trainees (30d)', value: formatInt(o.activeTrainees30d), hint: 'booked in the last month' },
    { key: 'c30', label: 'Active coaches (30d)', value: formatInt(o.activeTrainers30d), hint: supply ? `${formatPct(supply.activeShare, 0)} of approved coaches` : undefined },
    { key: 'review', label: 'Coaches awaiting review', value: formatInt(supply?.pendingReview), hint: supply?.pendingReview ? 'in the verification queue' : 'queue is empty', href: '/apps/trainer-verifications', tone: supply?.pendingReview > 5 ? 'danger' : undefined }
  ]
}

export function signupTrend(daily = []) {
  return {
    categories: daily.map(d => d.date),
    series: [
      { name: 'Trainees', data: daily.map(d => d.trainees) },
      { name: 'Coaches', data: daily.map(d => d.trainers) }
    ]
  }
}
