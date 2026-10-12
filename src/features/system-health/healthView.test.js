import { describe, expect, it } from 'vitest'
import { cronView, queueLabel, queueView, webhookView, workerView } from './healthView'

describe('queueView', () => {
  const q = (o = {}) => ({ name: 'nq-x', waiting: 0, active: 0, delayed: 0, failed: 0, paused: 0, ...o })
  it('ranks failure above backlog above paused above working above idle', () => {
    expect(queueView(q({ failed: 2, waiting: 900 }))).toEqual({ tone: 'danger', label: '2 failed' })
    expect(queueView(q({ waiting: 500 })).label).toBe('Backed up')
    expect(queueView(q({ paused: 1 })).label).toBe('Paused')
    expect(queueView(q({ active: 1 })).label).toBe('Working')
    expect(queueView(q()).label).toBe('Idle')
  })
  it('does not call a busy queue backed up below the threshold', () => {
    expect(queueView(q({ waiting: 499 })).label).toBe('Working')
  })
})

describe('queueLabel', () => {
  it('drops the nq- prefix and hyphens', () => {
    expect(queueLabel('nq-session-recording-transcode')).toBe('session recording transcode')
  })
})

describe('cronView', () => {
  const now = Date.parse('2026-10-11T12:00:00Z')
  it('flags an erroring job with its message', () => {
    expect(cronView({ lastStatus: 'error', lastError: 'boom' }, now)).toMatchObject({ tone: 'danger', label: 'Failed', note: 'boom' })
  })
  it('flags an overdue job and says how often it should run', () => {
    expect(cronView({ lastStatus: 'ok', stale: true, expectedIntervalSec: 900 }, now)).toMatchObject({ tone: 'danger', label: 'Overdue', note: 'Expected about every 15m 00s' })
  })
  it('treats a never-seen job as neutral, not broken', () => {
    expect(cronView({ lastStatus: 'never' }, now).tone).toBe('neutral')
  })
  it('shows a healthy job as on time with when it ran', () => {
    expect(cronView({ lastStatus: 'ok', lastRunAt: '2026-10-11T11:57:00Z' }, now)).toEqual({ tone: 'success', label: 'On time', note: 'Ran 3m ago' })
  })
  it('error wins over stale', () => {
    expect(cronView({ lastStatus: 'error', stale: true }, now).label).toBe('Failed')
  })
})

describe('workerView / webhookView', () => {
  it('marks a process stale after missing heartbeats', () => {
    expect(workerView({ ageSec: 12 }).label).toBe('Alive')
    expect(workerView({ ageSec: 90 }).label).toBe('Stale')
  })
  it('summarises webhook flow', () => {
    expect(webhookView({ lagSec: 0, failed24h: 0 }).label).toBe('Flowing')
    expect(webhookView({ lagSec: 900, failed24h: 0 }).label).toBe('Stuck')
    expect(webhookView({ lagSec: 0, failed24h: 3 }).label).toBe('3 failed')
    expect(webhookView(null).label).toBe('Unknown')
  })
})
