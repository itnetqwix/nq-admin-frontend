import { formatMinor, formatPct } from 'src/utils/format'

export const HEALTH = {
  live: { label: 'Live', tone: 'success' },
  scheduled: { label: 'Not started', tone: 'neutral' },
  paused: { label: 'Paused', tone: 'warning' },
  expired: { label: 'Expired', tone: 'neutral' },
  exhausted: { label: 'Fully used', tone: 'warning' }
}

export function healthLine(h) {
  if (!h) return ''
  if (h.state === 'live') {
    const parts = []
    if (h.daysLeft != null) parts.push(`${h.daysLeft} day${h.daysLeft === 1 ? '' : 's'} left`)
    if (h.remaining != null) parts.push(`${h.remaining} use${h.remaining === 1 ? '' : 's'} left`)
    return parts.join(' · ')
  }
  if (h.state === 'exhausted') return 'Every allowed use has been taken'
  if (h.state === 'paused') return 'Turned off — customers can’t use it'
  if (h.state === 'scheduled') return 'Starts later'
  return 'Past its end date'
}

/** The headline numbers, each with a plain-words hint so an admin knows what it is counting. */
export function statTiles(s) {
  const o = s.outcome
  const cur = { currency: 'USD' }
  const tiles = [
    { key: 'bookings', label: 'Lessons booked', value: String(o.bookings), hint: o.bookings ? `${o.completed} completed · ${o.canceled} cancelled · ${o.refunded} refunded` : 'Nobody has used it yet' },
    { key: 'customers', label: 'Customers', value: String(o.uniqueUsers), hint: o.newCustomerShare == null ? null : `${formatPct(o.newCustomerShare, 0)} were booking their first lesson` },
    { key: 'discount', label: 'Discount given', value: formatMinor(o.discountMinor, cur), hint: o.discountReturnedMinor ? `${formatMinor(o.discountReturnedMinor, cur)} more went back on cancelled or refunded lessons` : 'On lessons that stood' },
    { key: 'revenue', label: 'Paid by customers', value: formatMinor(o.revenueMinor, cur), hint: o.averageOrderMinor == null ? null : `${formatMinor(o.averageOrderMinor, cur)} per lesson` },
    { key: 'commission', label: 'Platform commission', value: formatMinor(o.commissionMinor, cur), hint: 'After the discount, on lessons that stood' },
    { key: 'funding', label: 'Who paid for the discount', value: formatMinor(o.platformFundedDiscountMinor, cur), hint: `NetQwix · ${formatMinor(o.trainerFundedDiscountMinor, cur)} came from coaches` }
  ]
  return tiles
}

/** Redemptions the code recorded vs lessons carrying it. A gap is normal (extensions, reversed bookings) but worth saying. */
export function reconciliationNote(s) {
  if (s.redemptionsRecorded === s.outcome.bookings) return null
  return `The code logged ${s.redemptionsRecorded} redemption${s.redemptionsRecorded === 1 ? '' : 's'} but ${s.outcome.bookings} lesson${s.outcome.bookings === 1 ? '' : 's'} carry it. Lesson extensions and reversed bookings account for most gaps.`
}
