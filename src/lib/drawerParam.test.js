import { describe, expect, it } from 'vitest'
import { formatDrawerParam, parseDrawerParam, withDrawerQuery } from './drawerParam'

describe('parseDrawerParam', () => {
  it('parses type and id', () => {
    expect(parseDrawerParam('lesson:64b000000000000000000001')).toEqual({ type: 'lesson', id: '64b000000000000000000001' })
    expect(parseDrawerParam('payment:pi_3Nabc123')).toEqual({ type: 'payment', id: 'pi_3Nabc123' })
    expect(parseDrawerParam('sentry-issue:NETQWIX-API-1A')).toEqual({ type: 'sentry-issue', id: 'NETQWIX-API-1A' })
  })

  it('keeps colons inside the id', () => {
    expect(parseDrawerParam('x1:a:b')).toEqual({ type: 'x1', id: 'a:b' })
  })

  it('takes the first value when the query repeats', () => {
    expect(parseDrawerParam(['user:abc', 'lesson:def'])).toEqual({ type: 'user', id: 'abc' })
  })

  it('rejects malformed or unsafe values', () => {
    for (const bad of [undefined, null, '', 'nocolon', ':id', 'type:', 'Bad Type:1', 'user:<script>', 'user:a b', 'u:1', 123]) {
      expect(parseDrawerParam(bad)).toBeNull()
    }
    expect(parseDrawerParam(`user:${'x'.repeat(200)}`)).toBeNull()
  })
})

describe('withDrawerQuery', () => {
  it('adds the drawer without disturbing other filters', () => {
    expect(withDrawerQuery({ status: 'open', page: '2' }, { type: 'user', id: 'abc' })).toEqual({
      status: 'open',
      page: '2',
      drawer: 'user:abc'
    })
  })
  it('replaces an existing drawer and removes it when closing', () => {
    expect(withDrawerQuery({ drawer: 'user:abc', a: '1' }, { type: 'lesson', id: 'z' }).drawer).toBe('lesson:z')
    expect(withDrawerQuery({ drawer: 'user:abc', a: '1' }, null)).toEqual({ a: '1' })
  })
  it('round-trips through formatDrawerParam', () => {
    expect(parseDrawerParam(formatDrawerParam('lesson', 'abc123'))).toEqual({ type: 'lesson', id: 'abc123' })
  })
})
