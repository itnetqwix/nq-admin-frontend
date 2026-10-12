import { describe, expect, it } from 'vitest'
import { lastBookedCell, pageIds, spendCell } from './userMetricCells'

const NOW = Date.parse('2026-10-11T12:00:00Z')

describe('lastBookedCell', () => {
  it('shows an ellipsis while loading, Never when there is no booking, else how long ago', () => {
    expect(lastBookedCell(undefined, NOW)).toBe('…')
    expect(lastBookedCell({ lastBookingAt: null }, NOW)).toBe('Never')
    expect(lastBookedCell({ lastBookingAt: '2026-10-08T12:00:00Z' }, NOW)).toBe('3d ago')
  })
})

describe('spendCell', () => {
  it('formats spend, uses a dash for none, and an ellipsis while loading', () => {
    expect(spendCell(undefined)).toBe('…')
    expect(spendCell({ spendMinor: 0 })).toBe('—')
    expect(spendCell({ spendMinor: 12345 })).toBe('$123.45')
    expect(spendCell({ spendMinor: 5000000 })).toBe('$50K')
  })
})

describe('pageIds', () => {
  it('collects unique ids from either id field and caps the batch', () => {
    expect(pageIds([{ id: 'a' }, { _id: 'b' }, { id: 'a' }, {}])).toEqual(['a', 'b'])
    expect(pageIds(Array.from({ length: 150 }, (_, i) => ({ id: `u${i}` })))).toHaveLength(100)
    expect(pageIds()).toEqual([])
  })
})
