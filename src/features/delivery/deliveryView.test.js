import { describe, expect, it } from 'vitest'
import { channelTile, healthOf, recipientLabel } from './deliveryView'

describe('healthOf', () => {
  it('judges by failure rate once there is enough traffic', () => {
    expect(healthOf({ total: 100, failed: 1, failureRate: 0.01 }).label).toBe('Healthy')
    expect(healthOf({ total: 100, failed: 8, failureRate: 0.08 }).label).toBe('Degraded')
    expect(healthOf({ total: 100, failed: 30, failureRate: 0.3 }).label).toBe('Failing')
  })
  it('does not raise the alarm over a tiny sample', () => {
    expect(healthOf({ total: 2, failed: 1, failureRate: 0.5 })).toEqual({ tone: 'warning', label: 'Some failed' })
    expect(healthOf({ total: 4, failed: 0, failureRate: 0 }).tone).toBe('success')
  })
  it('handles a channel nobody used', () => {
    expect(healthOf({ total: 0, failed: 0, failureRate: null })).toEqual({ tone: 'neutral', label: 'No sends' })
    expect(healthOf(undefined).label).toBe('No sends')
  })
})

describe('channelTile', () => {
  it('summarises a channel', () => {
    expect(channelTile({ channel: 'sms', sent: 90, failed: 10, total: 100, failureRate: 0.1 })).toMatchObject({ label: 'SMS', value: '90', hint: '10 failed · 10.0% failure rate', health: { label: 'Degraded' } })
    expect(channelTile({ channel: 'push', sent: 0, failed: 0, total: 0, failureRate: null }).hint).toBe('nothing sent')
  })
})

describe('recipientLabel', () => {
  it('shows the masked address and how many others got it', () => {
    expect(recipientLabel({ recipient_masked: 'ta***@gmail.com', recipient_count: 3 })).toBe('ta***@gmail.com +2 more')
    expect(recipientLabel({ recipient_masked: 'ta***@gmail.com', recipient_count: 1 })).toBe('ta***@gmail.com')
    expect(recipientLabel({})).toBe('—')
  })
})
