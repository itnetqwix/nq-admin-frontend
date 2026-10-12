import { describe, expect, it } from 'vitest'
import { elapsedLabel, filterLessons, stateCounts } from './filterLessons'

const lessons = [
  { sessionId: 'a1', state: 'live', trainer: { name: 'Tara Coach' }, trainee: { name: 'Tim' }, isInstant: false, lowQualityEvents30m: 3 },
  { sessionId: 'b2', state: 'live', trainer: { name: 'Sam' }, trainee: { name: 'Tina' }, isInstant: true, lowQualityEvents30m: 0 },
  { sessionId: 'c3', state: 'late', trainer: { name: 'Lee' }, trainee: { name: 'Pat' }, isInstant: false, lowQualityEvents30m: 0 },
  { sessionId: 'd4', state: 'upcoming', trainer: null, trainee: null, isInstant: false, lowQualityEvents30m: 0 }
]

describe('filterLessons', () => {
  it('returns everything by default', () => {
    expect(filterLessons(lessons)).toHaveLength(4)
  })
  it('filters by state', () => {
    expect(filterLessons(lessons, { state: 'live' }).map(l => l.sessionId)).toEqual(['a1', 'b2'])
    expect(filterLessons(lessons, { state: 'waiting' })).toEqual([])
  })
  it('keeps only lessons with call-quality alerts', () => {
    expect(filterLessons(lessons, { issuesOnly: true }).map(l => l.sessionId)).toEqual(['a1'])
  })
  it('separates instant from scheduled', () => {
    expect(filterLessons(lessons, { kind: 'instant' }).map(l => l.sessionId)).toEqual(['b2'])
    expect(filterLessons(lessons, { kind: 'scheduled' })).toHaveLength(3)
  })
  it('searches coach, trainee and session id case-insensitively, tolerating missing people', () => {
    expect(filterLessons(lessons, { q: 'TARA' }).map(l => l.sessionId)).toEqual(['a1'])
    expect(filterLessons(lessons, { q: 'pat' }).map(l => l.sessionId)).toEqual(['c3'])
    expect(filterLessons(lessons, { q: 'd4' }).map(l => l.sessionId)).toEqual(['d4'])
  })
  it('combines filters', () => {
    expect(filterLessons(lessons, { state: 'live', kind: 'instant', q: 'sam' }).map(l => l.sessionId)).toEqual(['b2'])
  })
})

describe('stateCounts', () => {
  it('counts each state and the total', () => {
    expect(stateCounts(lessons)).toEqual({ all: 4, live: 2, waiting: 0, late: 1, upcoming: 1 })
  })
})

describe('elapsedLabel', () => {
  const now = Date.parse('2026-10-11T12:00:00Z')
  it('reads elapsed and upcoming times', () => {
    expect(elapsedLabel('2026-10-11T11:48:00Z', now)).toBe('12m')
    expect(elapsedLabel('2026-10-11T10:56:00Z', now)).toBe('1h 04m')
    expect(elapsedLabel('2026-10-11T11:59:30Z', now)).toBe('30s')
    expect(elapsedLabel('2026-10-11T12:08:00Z', now)).toBe('in 8m')
  })
  it('is safe on bad input', () => {
    expect(elapsedLabel(null, now)).toBe('—')
    expect(elapsedLabel('nope', now)).toBe('—')
  })
})
