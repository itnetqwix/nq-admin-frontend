import { describe, expect, it } from 'vitest'
import { TAB } from '../constants'
import { buildExportRequest, buildTabRequest, stateFromQuery } from '../financeTabs'

const SID = 'b'.repeat(24)
const base = { page: 2, pageSize: 50 }

describe('stateFromQuery', () => {
  it('reads nothing from an empty or unrelated URL', () => {
    expect(stateFromQuery({})).toEqual({})
    expect(stateFromQuery(undefined)).toEqual({})
    expect(stateFromQuery({ foo: 'bar', userId: '   ' })).toEqual({})
  })
  it('a user link searches transactions for that user', () => {
    expect(stateFromQuery({ userId: ' u1 ' })).toEqual({ searchQ: 'u1', tab: TAB.TRANSACTIONS })
  })
  it('a booking link opens transactions, or escrow / ledger when asked', () => {
    expect(stateFromQuery({ sessionId: SID })).toEqual({ searchQ: SID, tab: TAB.TRANSACTIONS })
    expect(stateFromQuery({ sessionId: SID, tab: 'ESCROW' })).toEqual({ searchQ: SID, tab: TAB.ESCROW })
    expect(stateFromQuery({ sessionId: SID, tab: 'ledger' })).toEqual({ searchQ: SID, tab: TAB.LEDGER })
  })
  it('an explicit tab wins, and every tab slug is understood', () => {
    expect(stateFromQuery({ sessionId: SID, tab: 'refunds' }).tab).toBe(TAB.REFUNDS)
    for (const [slug, tab] of [['overview', TAB.OVERVIEW], ['ledger', TAB.LEDGER], ['transactions', TAB.TRANSACTIONS], ['escrow', TAB.ESCROW], ['refunds', TAB.REFUNDS], ['payouts', TAB.PAYOUTS], ['stuck_topups', TAB.STUCK_TOPUPS], ['topups', TAB.TOPUPS], ['audit', TAB.AUDIT]]) {
      expect(stateFromQuery({ tab: slug })).toEqual({ tab })
    }
  })
  it('ignores a tab name it does not know, including names that exist on every object', () => {
    expect(stateFromQuery({ tab: 'nope' })).toEqual({})
    expect(stateFromQuery({ tab: 'constructor' })).toEqual({})
    expect(stateFromQuery({ tab: '__proto__' })).toEqual({})
  })
  it('passes an escrow status through', () => {
    expect(stateFromQuery({ tab: 'escrow', status: ' disputed ' })).toEqual({ tab: TAB.ESCROW, escrowStatus: 'disputed' })
  })
})

describe('buildTabRequest', () => {
  it('treats a 24-character search as an id and pi_ as a payment intent', () => {
    expect(buildTabRequest(TAB.TRANSACTIONS, { ...base, searchQ: SID }).args).toEqual({ page: 2, limit: 50, q: SID, paymentIntentId: undefined, userId: SID, sessionId: SID })
    expect(buildTabRequest(TAB.TRANSACTIONS, { ...base, searchQ: 'pi_1' }).args).toMatchObject({ paymentIntentId: 'pi_1', userId: undefined, sessionId: undefined })
    expect(buildTabRequest(TAB.TRANSACTIONS, { ...base, searchQ: 'alice@x.com' }).args).toMatchObject({ q: 'alice@x.com', userId: undefined })
    expect(buildTabRequest(TAB.TRANSACTIONS, { ...base, searchQ: '' }).args.q).toBeUndefined()
  })
  it('uses each tab’s own filters', () => {
    expect(buildTabRequest(TAB.LEDGER, { ...base, searchQ: 'u1', ledgerReferenceType: 'escrow_hold' })).toEqual({ call: 'ledger', args: { page: 2, limit: 50, userId: 'u1', referenceType: 'escrow_hold', sessionId: undefined } })
    expect(buildTabRequest(TAB.ESCROW, { ...base, searchQ: SID, escrowStatus: 'held' }).args).toEqual({ page: 2, limit: 50, status: 'held', sessionId: SID })
    expect(buildTabRequest(TAB.REFUNDS, { ...base, searchQ: 'x', refundStatus: 'failed' }).args).toEqual({ page: 2, limit: 50, status: 'failed', q: 'x' })
    expect(buildTabRequest(TAB.TOPUPS, { ...base, searchQ: 'u1' }).args.userId).toBe('u1')
  })
  it('stuck top-ups are a fixed 30-minute window, not paged', () => {
    expect(buildTabRequest(TAB.STUCK_TOPUPS, base)).toEqual({ call: 'stuckTopUps', args: { maxAgeMinutes: 30 } })
  })
  it('overview needs no table', () => {
    expect(buildTabRequest(TAB.OVERVIEW, base).call).toBe('overview')
  })
})

describe('buildExportRequest', () => {
  it('refuses the overview', () => {
    expect(buildExportRequest(TAB.OVERVIEW, {})).toEqual({ error: 'Switch to a data tab to export' })
  })
  it('sends only the filters that apply to the tab', () => {
    const f = { searchQ: SID, refundStatus: 'failed', escrowStatus: 'held', ledgerReferenceType: 'escrow_hold' }
    expect(buildExportRequest(TAB.ESCROW, f)).toEqual({ kind: 'escrow', params: { q: SID, userId: SID, sessionId: SID, status: 'held', referenceType: undefined, maxAgeMinutes: undefined } })
    expect(buildExportRequest(TAB.REFUNDS, f).params.status).toBe('failed')
    expect(buildExportRequest(TAB.LEDGER, f).params).toMatchObject({ status: undefined, referenceType: 'escrow_hold' })
    expect(buildExportRequest(TAB.STUCK_TOPUPS, {}).params.maxAgeMinutes).toBe(30)
  })
})
