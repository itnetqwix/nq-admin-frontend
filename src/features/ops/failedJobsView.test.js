import { describe, expect, it } from 'vitest'
import { groupFailedJobs } from './failedJobsView'
import { buildDebugBundle, splitJobDrawerId } from 'src/features/entity-drawers/drawers/JobDrawer'

const row = (over = {}) => ({
  queue: 'nq-cron',
  errorType: 'TypeError',
  failedReason: 'x is undefined',
  failedAt: '2026-10-12T10:00:00.000Z',
  ...over
})

describe('groupFailedJobs', () => {
  it('groups by queue + error type and counts', () => {
    const groups = groupFailedJobs([
      row(),
      row(),
      row({ errorType: 'MongoServerError' }),
      row({ queue: 'nq-data-export' })
    ])
    expect(groups).toHaveLength(3)
    expect(groups.find(g => g.queue === 'nq-cron' && g.errorType === 'TypeError').count).toBe(2)
  })

  it('tracks first/last seen and keeps the latest reason', () => {
    const [g] = groupFailedJobs([
      row({ failedAt: '2026-10-12T09:00:00.000Z', failedReason: 'old' }),
      row({ failedAt: '2026-10-12T11:00:00.000Z', failedReason: 'new' })
    ])
    expect(g.reason).toBe('new')
    expect(g.lastSeen - g.firstSeen).toBe(2 * 3600 * 1000)
  })

  it('orders groups newest first and tolerates missing times', () => {
    const groups = groupFailedJobs([
      row({ errorType: 'A', failedAt: '2026-10-12T08:00:00.000Z' }),
      row({ errorType: 'B', failedAt: null, at: null })
    ])
    expect(groups.map(g => g.errorType)).toEqual(['A', 'B'])
  })
})

describe('JobDrawer helpers', () => {
  it('splits on the first colon only (job ids may contain colons)', () => {
    expect(splitJobDrawerId('nq-booking-reminder:reminder:abc:24h')).toEqual({
      queue: 'nq-booking-reminder',
      jobId: 'reminder:abc:24h'
    })
    expect(splitJobDrawerId('nope')).toEqual({ queue: '', jobId: '' })
  })

  it('debug bundle has error, correlation and stack', () => {
    const text = buildDebugBundle({
      queue: 'nq-cron',
      name: 'tick',
      id: '7',
      errorType: 'TypeError',
      failedReason: 'x is undefined\nmore',
      attemptsMade: 3,
      maxAttempts: 3,
      correlation: { sessionId: 's1' },
      stacktrace: ['TypeError: x\n at a (b.js:1:1)'],
      data: { a: 1 }
    })
    expect(text).toContain('TypeError — x is undefined')
    expect(text).toContain('Lesson: s1')
    expect(text).toContain('at a (b.js:1:1)')
    expect(text).not.toContain('more')
  })
})
