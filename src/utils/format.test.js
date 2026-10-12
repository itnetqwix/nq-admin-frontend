import { describe, expect, it } from 'vitest'
import {
  deltaTone,
  formatDelta,
  formatDuration,
  formatInt,
  formatMinor,
  formatPct,
  formatPoints,
  timeAgo
} from './format'

describe('formatMinor', () => {
  it('formats cents as dollars', () => {
    expect(formatMinor(12345)).toBe('$123.45')
    expect(formatMinor(0)).toBe('$0.00')
    expect(formatMinor(-500)).toBe('-$5.00')
  })
  it('shows an em dash for unknown values, never NaN or $0.00', () => {
    expect(formatMinor(null)).toBe('—')
    expect(formatMinor(undefined)).toBe('—')
    expect(formatMinor('')).toBe('—')
    expect(formatMinor(NaN)).toBe('—')
  })
  it('compacts only large amounts', () => {
    expect(formatMinor(5000000, { compact: true })).toBe('$50K')
    expect(formatMinor(123456, { compact: true })).toBe('$1,234.56')
  })
  it('adds a plus sign for positive signed amounts', () => {
    expect(formatMinor(1000, { signed: true })).toBe('+$10.00')
    expect(formatMinor(-1000, { signed: true })).toBe('-$10.00')
  })
})

describe('numbers', () => {
  it('formats integers with separators and handles missing', () => {
    expect(formatInt(1234567)).toBe('1,234,567')
    expect(formatInt(null)).toBe('—')
  })
  it('formats ratios as percentages', () => {
    expect(formatPct(0.1234)).toBe('12.3%')
    expect(formatPct(0)).toBe('0.0%')
    expect(formatPct(null)).toBe('—')
  })
  it('formats deltas with sign, and null when there is no baseline', () => {
    expect(formatDelta(0.125)).toBe('+12.5%')
    expect(formatDelta(-0.3)).toBe('-30.0%')
    expect(formatDelta(0)).toBe('0.0%')
    expect(formatDelta(null)).toBeNull()
  })
  it('formats rate changes as percentage points', () => {
    expect(formatPoints(0.05)).toBe('+5.0 pts')
    expect(formatPoints(-0.012)).toBe('-1.2 pts')
    expect(formatPoints(undefined)).toBeNull()
  })
})

describe('formatDuration', () => {
  it('picks a sensible unit', () => {
    expect(formatDuration(42)).toBe('42s')
    expect(formatDuration(125)).toBe('2m 05s')
    expect(formatDuration(3725)).toBe('1h 02m')
    expect(formatDuration(null)).toBe('—')
  })
})

describe('timeAgo', () => {
  const now = Date.parse('2026-10-11T12:00:00Z')
  it('describes the past', () => {
    expect(timeAgo('2026-10-11T11:59:50Z', now)).toBe('just now')
    expect(timeAgo('2026-10-11T11:57:00Z', now)).toBe('3m ago')
    expect(timeAgo('2026-10-11T09:00:00Z', now)).toBe('3h ago')
    expect(timeAgo('2026-10-06T12:00:00Z', now)).toBe('5d ago')
  })
  it('describes the future', () => {
    expect(timeAgo('2026-10-11T12:10:00Z', now)).toBe('in 10m')
  })
  it('is safe on bad input', () => {
    expect(timeAgo(null, now)).toBe('—')
    expect(timeAgo('garbage', now)).toBe('—')
  })
})

describe('deltaTone', () => {
  it('reads direction against what is good', () => {
    expect(deltaTone(0.1)).toBe('success')
    expect(deltaTone(-0.1)).toBe('danger')
    expect(deltaTone(0.1, { higherIsBetter: false })).toBe('danger')
    expect(deltaTone(-0.1, { higherIsBetter: false })).toBe('success')
    expect(deltaTone(0)).toBe('neutral')
    expect(deltaTone(null)).toBe('neutral')
  })
})
