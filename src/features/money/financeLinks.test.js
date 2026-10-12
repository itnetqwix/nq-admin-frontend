import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { stateFromQuery } from '../finance/financeTabs'
import { ESCROW_STATUSES, FINANCE_TABS, financeLink } from './financeLinks'

describe('financeLink', () => {
  it('builds tab and escrow-status links using the params Finance reads', () => {
    expect(financeLink({ tab: 'refunds' })).toBe('/apps/finance?tab=refunds')
    expect(financeLink({ tab: 'escrow', status: 'disputed' })).toBe('/apps/finance?tab=escrow&status=disputed')
    expect(financeLink({ sessionId: 'abc' })).toBe('/apps/finance?sessionId=abc')
    expect(financeLink()).toBe('/apps/finance')
  })

  it('rejects a tab or status Finance would ignore', () => {
    expect(() => financeLink({ tab: 'nope' })).toThrow(/Unknown finance tab/)
    expect(() => financeLink({ tab: 'escrow', status: 'bogus' })).toThrow(/Unknown escrow status/)
    expect(() => financeLink({ tab: 'refunds', status: 'held' })).toThrow(/only apply to the escrow tab/)
  })
})

describe('Finance page contract', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../finance/FinancePage.js'), 'utf8')

  it('really handles every tab slug this helper offers', () => {
    // Behavioural: feed the page's own URL parser the query each link produces.
    FINANCE_TABS.forEach(tab => expect(stateFromQuery({ tab }).tab, `tab=${tab}`).toBeTypeOf('number'))
  })

  it('reads the escrow filter from `status`, not `escrowStatus`', () => {
    expect(stateFromQuery({ tab: 'escrow', status: 'disputed' }).escrowStatus).toBe('disputed')
    expect(stateFromQuery({ tab: 'escrow', escrowStatus: 'disputed' }).escrowStatus).toBeUndefined()
    expect(source).toContain('router.query?.status') // the page re-reads the URL when `status` changes
    expect(source).not.toContain('router.query?.escrowStatus')
    expect(ESCROW_STATUSES).toContain('disputed')
  })
})
