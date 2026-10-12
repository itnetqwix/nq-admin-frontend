import { describe, expect, it } from 'vitest'
import { apiTrend, dailyTrend, shortDay, shortHour } from './chartData'

describe('labels', () => {
  it('formats calendar days without timezone drift', () => {
    expect(shortDay('2026-10-05')).toBe('Oct 5')
    expect(shortDay('2026-01-31')).toBe('Jan 31')
    expect(shortDay('garbage')).toBe('garbage')
    expect(shortDay(null)).toBe('')
  })
  it('formats hour buckets', () => {
    expect(shortHour('2026-10-11T14:00:00Z')).toBe('14:00')
    expect(shortHour(undefined)).toBe('')
  })
})

describe('dailyTrend', () => {
  it('builds GMV and booking series aligned to the categories', () => {
    const t = dailyTrend([
      { date: '2026-10-09', bookings: 2, gmvMinor: 2000 },
      { date: '2026-10-10', bookings: 5, gmvMinor: 9000 }
    ])
    expect(t.categories).toEqual(['Oct 9', 'Oct 10'])
    expect(t.gmv[0].data).toEqual([2000, 9000])
    expect(t.bookings[0].data).toEqual([2, 5])
  })
  it('omits the money series when GMV was redacted for this role', () => {
    const t = dailyTrend([{ date: '2026-10-09', bookings: 2, gmvMinor: null }])
    expect(t.gmv).toBeNull()
    expect(t.bookings[0].data).toEqual([2])
  })
  it('is safe with no data', () => {
    const t = dailyTrend([])
    expect(t.categories).toEqual([])
    expect(t.gmv).toBeNull()
  })
})

describe('apiTrend', () => {
  it('maps buckets and plots missing values as zero rather than gaps', () => {
    const t = apiTrend([
      { hour: '2026-10-11T10:00:00Z', errorRate: 0.02, avgMs: 140 },
      { hour: '2026-10-11T11:00:00Z', errorRate: null, avgMs: null }
    ])
    expect(t.categories).toEqual(['10:00', '11:00'])
    expect(t.errorRate[0].data).toEqual([0.02, 0])
    expect(t.latency[0].data).toEqual([140, 0])
  })
})
