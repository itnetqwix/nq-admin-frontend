import { describe, expect, it } from 'vitest'
import { describeIssue, rankIssues } from './describeIssue'

const NOW = Date.parse('2026-10-11T12:00:00Z')

describe('describeIssue', () => {
  it('turns an issue into a headline and a one-line impact', () => {
    const d = describeIssue(
      {
        title: 'TypeError: x is undefined',
        userCount: 14,
        count: 230,
        firstSeen: '2026-10-11T10:00:00Z',
        impact: 'payment',
        project: 'backend',
        substatus: 'regressed',
        permalink: 'https://sentry.io/x'
      },
      NOW
    )
    expect(d.headline).toBe('TypeError: x is undefined')
    expect(d.detail).toBe('14 users affected · 230 events · first seen 2h ago')
    expect(d.state).toBe('Regressed')
    expect(d.impactLabel).toBe('Payments')
    expect(d.tone).toBe('danger')
    expect(d.permalink).toBe('https://sentry.io/x')
  })

  it('uses singular forms and says so when no user is identified', () => {
    expect(describeIssue({ title: 't', userCount: 1, count: 1 }, NOW).detail).toBe('1 user affected · 1 event')
    expect(describeIssue({ title: 't', userCount: 0, count: 3 }, NOW).detail).toBe('No users identified · 3 events')
  })

  it('rates severity by people affected, with fatal always danger', () => {
    expect(describeIssue({ userCount: 10 }).tone).toBe('danger')
    expect(describeIssue({ userCount: 3 }).tone).toBe('warning')
    expect(describeIssue({ userCount: 0 }).tone).toBe('neutral')
    expect(describeIssue({ userCount: 0, level: 'fatal' }).tone).toBe('danger')
  })

  it('marks new issues and falls back for missing fields', () => {
    expect(describeIssue({ substatus: 'new' }).state).toBe('New')
    const d = describeIssue({})
    expect(d.headline).toBe('Untitled error')
    expect(d.impactLabel).toBe('Other')
    expect(d.state).toBeNull()
  })
})

describe('rankIssues', () => {
  it('orders by users affected then events, without mutating', () => {
    const input = [
      { id: 'a', userCount: 1, count: 100 },
      { id: 'b', userCount: 5, count: 1 },
      { id: 'c', userCount: 5, count: 9 }
    ]
    expect(rankIssues(input).map(i => i.id)).toEqual(['c', 'b', 'a'])
    expect(input[0].id).toBe('a')
  })
})
