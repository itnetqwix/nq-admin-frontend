import { describe, expect, it } from 'vitest'
import { apiCharts, apiSummary, businessCharts, gapNote } from './historyView'

describe('businessCharts', () => {
  it('keeps days that were never summarised as gaps, not zeros', () => {
    const c = businessCharts({
      series: [
        { date: '2026-10-10', signups_trainees: 3, signups_trainers: 1, bookings: 4, gmv_minor: 5000, revenue_minor: 900 },
        { date: '2026-10-11', signups_trainees: null, signups_trainers: null, bookings: null, gmv_minor: null, revenue_minor: null }
      ]
    })
    expect(c.categories).toEqual(['Oct 10', 'Oct 11'])
    expect(c.signups).toEqual([{ name: 'Trainees', data: [3, null] }, { name: 'Coaches', data: [1, null] }])
    expect(c.bookings[0].data).toEqual([4, null])
    expect(c.money.map(s => s.name)).toEqual(['GMV', 'Platform revenue'])
  })
  it('copes with no data yet', () => {
    expect(businessCharts(undefined).categories).toEqual([])
  })
})

describe('apiCharts and apiSummary', () => {
  const h = { series: [{ date: '2026-10-10', errorRate: 0.01, avgMs: 120 }, { date: '2026-10-11', errorRate: null, avgMs: null }], totals: { estRequests: 12345, errors5xx: 100, errorRate: 0.0081, avgMs: 140 } }
  it('plots rate and latency with gaps', () => {
    const c = apiCharts(h)
    expect(c.errorRate[0].data).toEqual([0.01, null])
    expect(c.latency[0].data).toEqual([120, null])
  })
  it('summarises the span in a sentence', () => {
    expect(apiSummary(h)).toBe('12,345 requests estimated · 0.81% failed with a server error · 140 ms average')
    expect(apiSummary({ totals: { estRequests: 0 } })).toBeNull()
    expect(apiSummary(undefined)).toBeNull()
  })
})

describe('gapNote', () => {
  it('says nothing when complete, and explains holes otherwise', () => {
    expect(gapNote([])).toBeNull()
    expect(gapNote(undefined)).toBeNull()
    expect(gapNote(['2026-10-09'])).toBe('2026-10-09 hasn’t been summarised yet.')
    expect(gapNote(['2026-10-05', '2026-10-09'])).toMatch(/2 days haven’t been summarised yet \(2026-10-05 to 2026-10-09\)/)
  })
})
