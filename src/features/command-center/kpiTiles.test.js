import { describe, expect, it } from 'vitest'
import { buildKpiTiles } from './kpiTiles'

const kpis = (over = {}) => ({
  current: {
    totals: { bookings: 120, completed: 100, cancelled: 10, activeTrainers: 12, activeTrainees: 80, gmvMinor: 1234500, revenueMinor: 185000, ...over.totals },
    rates: { completionRate: 0.909, takeRate: 0.15, refundRate: 0.02, ...over.rates }
  },
  deltas: { gmvMinor: 0.25, revenueMinor: -0.1, bookings: 0.05, completionRate: 0.02, activeTrainers: 0, activeTrainees: 0.1, takeRate: 0, refundRate: 0.01, ...over.deltas }
})

describe('buildKpiTiles', () => {
  it('formats values and deltas per kind: percent for amounts, points for rates', () => {
    const tiles = Object.fromEntries(buildKpiTiles(kpis()).map(t => [t.key, t]))
    expect(tiles.gmv.value).toBe('$12.3K') // compact above $10k on headline tiles
    expect(tiles.gmv.deltaLabel).toBe('+25.0%')
    expect(tiles.revenue.deltaLabel).toBe('-10.0%')
    expect(tiles.completion.value).toBe('90.9%')
    expect(tiles.completion.deltaLabel).toBe('+2.0 pts')
    expect(tiles.refunds.deltaLabel).toBe('+1.0 pts')
  })

  it('treats a rising refund rate as bad', () => {
    const refunds = buildKpiTiles(kpis()).find(t => t.key === 'refunds')
    expect(refunds.higherIsBetter).toBe(false)
  })

  it('drops every money tile when the figures were redacted, keeping the rest', () => {
    const tiles = buildKpiTiles(kpis({ totals: { gmvMinor: null, revenueMinor: null }, rates: { takeRate: null, refundRate: null } }))
    expect(tiles.map(t => t.key)).toEqual(['bookings', 'completion', 'trainers', 'trainees'])
  })

  it('carries sparkline series from the daily rows', () => {
    const tiles = buildKpiTiles(kpis(), [
      { date: 'a', bookings: 1, gmvMinor: 100 },
      { date: 'b', bookings: 3, gmvMinor: 300 }
    ])
    expect(tiles.find(t => t.key === 'gmv').series).toEqual([100, 300])
    expect(tiles.find(t => t.key === 'bookings').series).toEqual([1, 3])
  })

  it('returns nothing without data and tolerates a missing baseline', () => {
    expect(buildKpiTiles(null)).toEqual([])
    const tiles = buildKpiTiles({ current: kpis().current, deltas: undefined })
    expect(tiles.find(t => t.key === 'gmv').deltaLabel).toBeNull()
  })

  it('shows a dash rather than a number for a rate with no data', () => {
    const tiles = buildKpiTiles(kpis({ rates: { completionRate: null } }))
    expect(tiles.find(t => t.key === 'completion').value).toBe('—')
  })
})
