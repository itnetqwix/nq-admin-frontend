import { describe, expect, it } from 'vitest'
import { healthLine, reconciliationNote, statTiles } from './promoStatsView'

const stats = (over = {}) => ({
  outcome: { bookings: 3, completed: 1, canceled: 1, refunded: 0, uniqueUsers: 3, discountMinor: 2000, discountReturnedMinor: 1000, revenueMinor: 10000, commissionMinor: 2000, platformFundedDiscountMinor: 2000, trainerFundedDiscountMinor: 0, averageOrderMinor: 5000, newCustomerShare: 0.3333 },
  redemptionsRecorded: 3,
  ...over
})

describe('statTiles', () => {
  it('turns minor units into dollars and explains each figure', () => {
    const t = Object.fromEntries(statTiles(stats()).map(x => [x.key, x]))
    expect(t.bookings).toMatchObject({ value: '3', hint: '1 completed · 1 cancelled · 0 refunded' })
    expect(t.customers.hint).toBe('33% were booking their first lesson')
    expect(t.discount.value).toBe('$20.00')
    expect(t.discount.hint).toContain('$10.00 more went back')
    expect(t.revenue).toMatchObject({ value: '$100.00', hint: '$50.00 per lesson' })
    expect(t.funding.hint).toBe('NetQwix · $0.00 came from coaches')
  })
  it('does not invent figures for a code nobody used', () => {
    const t = Object.fromEntries(statTiles(stats({ outcome: { bookings: 0, completed: 0, canceled: 0, refunded: 0, uniqueUsers: 0, discountMinor: 0, discountReturnedMinor: 0, revenueMinor: 0, commissionMinor: 0, platformFundedDiscountMinor: 0, trainerFundedDiscountMinor: 0, averageOrderMinor: null, newCustomerShare: null } })).map(x => [x.key, x]))
    expect(t.bookings.hint).toBe('Nobody has used it yet')
    expect(t.customers.hint).toBeNull()
    expect(t.revenue.hint).toBeNull()
  })
})

describe('healthLine', () => {
  it('says what is left, or why it is not working', () => {
    expect(healthLine({ state: 'live', daysLeft: 1, remaining: 6 })).toBe('1 day left · 6 uses left')
    expect(healthLine({ state: 'live', daysLeft: 8, remaining: null })).toBe('8 days left')
    expect(healthLine({ state: 'exhausted' })).toMatch(/Every allowed use/)
    expect(healthLine({ state: 'paused' })).toMatch(/Turned off/)
    expect(healthLine({ state: 'expired' })).toMatch(/end date/)
  })
})

describe('reconciliationNote', () => {
  it('stays quiet when the numbers agree and explains a gap otherwise', () => {
    expect(reconciliationNote(stats())).toBeNull()
    expect(reconciliationNote(stats({ redemptionsRecorded: 5 }))).toMatch(/logged 5 redemptions but 3 lessons carry it/)
  })
})
