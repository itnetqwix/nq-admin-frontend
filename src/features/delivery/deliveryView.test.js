import { describe, expect, it } from 'vitest'
import { channelTile, healthOf, recipientLabel, STATUS_VALUES, statusMeta } from './deliveryView'

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
    expect(channelTile({ channel: 'email', sent: 90, failed: 10, bounced: 3, complained: 1, total: 100, failureRate: 0.1 }).hint).toBe('10 failed (3 bounced, 1 complaint) · 10.0% failure rate')
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

describe('statusMeta', () => {
  it('only calls a message delivered when the provider confirmed it', () => {
    expect(statusMeta('sent')).toEqual({ label: 'Sent', tone: 'neutral' })
    expect(statusMeta('delivered').tone).toBe('success')
  })
  it('treats failures, bounces and complaints as problems', () => {
    for (const s of ['failed', 'bounced', 'complained']) expect(statusMeta(s).tone).toBe('danger')
  })
  it('does not break on a status it has not seen', () => {
    expect(statusMeta('deferred')).toEqual({ label: 'deferred', tone: 'neutral' })
    expect(statusMeta(undefined).label).toBe('Unknown')
  })
  it('offers a filter for every status plus the problem group', () => {
    expect(STATUS_VALUES).toEqual(expect.arrayContaining(['sent', 'delivered', 'failed', 'bounced', 'complained', 'problem']))
  })
})
