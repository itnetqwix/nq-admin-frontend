import { describe, expect, it } from 'vitest'
import { cohortTable, cohortUsersLink, heatBackground, overviewTiles, signupTrend, stageRows } from './growthView'

describe('stageRows', () => {
  it('labels stages and scales bars to the biggest', () => {
    const rows = stageRows({ stages: [{ stage: 'engaged', users: 40, share: 0.4 }, { stage: 'churned', users: 10, share: 0.1 }, { stage: 'new', users: 0, share: 0 }] })
    expect(rows.map(r => r.label)).toEqual(['Engaged', 'Churned', 'New'])
    expect(rows.map(r => r.widthPct)).toEqual([100, 25, 0])
    expect(rows[0]).toMatchObject({ share: '40%', tone: 'success' })
    expect(rows[1].tone).toBe('danger')
  })
  it('survives an unknown stage and no data', () => {
    expect(stageRows({ stages: [{ stage: 'mystery', users: 1, share: null }] })[0]).toMatchObject({ label: 'mystery', share: '—' })
    expect(stageRows(null)).toEqual([])
  })
})

describe('heatBackground', () => {
  it('shades by percentage and clamps', () => {
    expect(heatBackground(0)).toContain(' 0%')
    expect(heatBackground(0.5)).toContain(' 35%')
    expect(heatBackground(1)).toContain(' 70%')
    expect(heatBackground(5)).toContain(' 70%')
    expect(heatBackground(-1)).toContain(' 0%')
  })
  it('has no shade for missing data', () => {
    expect(heatBackground(null)).toBeNull()
    expect(heatBackground(undefined)).toBeNull()
    expect(heatBackground(NaN)).toBeNull()
  })
})

describe('cohortTable', () => {
  const data = {
    cohorts: [
      { label: 'Sep 29', start: '2026-09-28T00:00:00.000Z', size: 10, cells: [{ n: 0, users: 6, pct: 0.6, revenueMinor: 60000 }, { n: 1, users: 3, pct: 0.3, revenueMinor: 0 }] },
      { label: 'Oct 6', start: '2026-10-05T00:00:00.000Z', size: 0, cells: [{ n: 0, users: 0, pct: null, revenueMinor: 0 }] }
    ],
    average: [{ n: 0, users: 6, size: 10, pct: 0.6 }, { n: 1, users: 3, size: 10, pct: 0.3 }]
  }
  it('pads shorter rows so the grid stays rectangular, leaving unobserved periods empty', () => {
    const t = cohortTable(data)
    expect(t.columns).toBe(2)
    expect(t.rows[1].cells).toEqual([expect.objectContaining({ text: '—', pct: null }), null])
  })
  it('shows retention percentages with the people behind them', () => {
    const c = cohortTable(data).rows[0].cells[0]
    expect(c).toMatchObject({ text: '60%', pct: 0.6, title: '6 of 10 people' })
    expect(cohortTable(data).average[1]).toMatchObject({ text: '30%' })
  })
  it('switches to revenue', () => {
    const c = cohortTable(data, 'revenue').rows[0].cells
    expect(c[0]).toMatchObject({ text: '$600', pct: null })
    expect(c[1].text).toBe('—')
  })
  it('is empty without data', () => {
    expect(cohortTable(null)).toEqual({ columns: 0, rows: [], average: [] })
  })
})

describe('cohortUsersLink', () => {
  it('spans the cohort week or month and carries the role', () => {
    expect(cohortUsersLink({ start: '2026-10-05T00:00:00.000Z' }, 'week', 'Trainee')).toBe('/apps/users?account_type=Trainee&from=2026-10-05&to=2026-10-12')
    expect(cohortUsersLink({ start: '2026-10-01T00:00:00.000Z' }, 'month', 'Trainer')).toBe('/apps/users?account_type=Trainer&from=2026-10-01&to=2026-11-01')
  })
})

describe('overviewTiles', () => {
  const o = { signups: { trainees: 30, trainers: 3, previousTrainees: 20, previousTrainers: 0 }, activeTrainees7d: 12, activeTrainees30d: 40, activeTrainers30d: 5 }
  it('compares signups with the previous period, with no delta when there was no baseline', () => {
    const t = Object.fromEntries(overviewTiles(o, { activeShare: 0.5, pendingReview: 8 }).map(x => [x.key, x]))
    expect(t.trainees.deltaLabel).toBe('+50.0%')
    expect(t.coaches.deltaLabel).toBeNull()
    expect(t.c30.hint).toBe('50% of approved coaches')
    expect(t.review).toMatchObject({ value: '8', tone: 'danger' })
  })
  it('is empty without data', () => {
    expect(overviewTiles(null)).toEqual([])
  })
})

describe('signupTrend', () => {
  it('builds two aligned series', () => {
    const s = signupTrend([{ date: '2026-10-01', trainees: 2, trainers: 1 }, { date: '2026-10-02', trainees: 3, trainers: 0 }])
    expect(s.series[0].data).toEqual([2, 3])
    expect(s.series[1].data).toEqual([1, 0])
  })
})

describe('Users directory contract', () => {
  it('still reads the URL params that cohort links depend on', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const source = fs.readFileSync(path.resolve(__dirname, '../users/UsersDirectoryPage.jsx'), 'utf8')
    for (const key of ['q.account_type', 'q.from', 'q.to']) expect(source).toContain(key)
  })
})
