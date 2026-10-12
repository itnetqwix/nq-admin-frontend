import { describe, expect, it } from 'vitest'
import { alertView } from './alertView'

describe('alertView', () => {
  const base = { _id: 'e1', severity: 'critical', title: 'Dispute opened', event_type: 'STRIPE_DISPUTE', createdAt: 't', resolution_status: 'open' }

  it('maps a business alert', () => {
    const v = alertView({ ...base, stream: 'business', alert_status: 'acked' })
    expect(v).toMatchObject({ id: 'e1', stream: 'business', streamLabel: 'Money & ops', status: 'acked', type: 'STRIPE_DISPUTE', sessionId: null, user: null })
  })

  it('treats rows with no stream as lesson alerts', () => {
    expect(alertView(base).stream).toBe('lesson')
    expect(alertView(base).status).toBe('open')
  })

  it('reads the session whether populated or a bare id', () => {
    expect(alertView({ ...base, session_id: 'abc' }).sessionId).toBe('abc')
    expect(alertView({ ...base, session_id: { _id: 'def' } }).sessionId).toBe('def')
  })

  it('names the user from a populated reference only', () => {
    expect(alertView({ ...base, user_id: { _id: 'u1', fullname: 'Tara' } }).user).toEqual({ id: 'u1', name: 'Tara' })
    expect(alertView({ ...base, user_id: 'u1' }).user).toBeNull()
  })

  it('keeps at most four suggested links and drops ones without an href', () => {
    const links = Array.from({ length: 6 }, (_, i) => ({ label: `l${i}`, href: `/x${i}` }))
    const v = alertView({ ...base, suggested_actions: [{ label: 'no href' }, ...links] })
    expect(v.links).toHaveLength(4)
    expect(v.links.every(l => l.href)).toBe(true)
  })
})
