import { formatDelta, formatInt, formatMinor, formatPct } from 'src/utils/format'
import { financeLink } from './financeLinks'

const REASON_LABELS = {
  fraudulent: 'Fraud',
  product_not_received: 'Service not received',
  product_unacceptable: 'Service not as described',
  duplicate: 'Duplicate charge',
  subscription_canceled: 'Subscription cancelled',
  credit_not_processed: 'Credit not processed',
  unrecognized: 'Unrecognised charge',
  general: 'General'
}
export const reasonLabel = reason => REASON_LABELS[reason] || (reason ? String(reason).replace(/_/g, ' ') : '—')

/**
 * How worried to be about a dispute. An open dispute with no evidence and a near deadline is the
 * one that loses money, so it is the loudest.
 */
export function disputeUrgency(d) {
  if (d.state === 'closed') {
    const map = { won: ['success', 'Won'], lost: ['danger', 'Lost'], refunded: ['neutral', 'Refunded'], warning_closed: ['neutral', 'Warning closed'] }
    const [tone, label] = map[d.outcome] || ['neutral', 'Closed']
    return { tone, label, rank: 9 }
  }
  if (d.evidence_submitted) return { tone: 'info', label: 'Evidence submitted', rank: 5 }
  const days = d.evidenceDaysLeft
  if (days === null || days === undefined) return { tone: 'warning', label: 'Needs evidence', rank: 3 }
  if (days < 0) return { tone: 'danger', label: `Overdue by ${Math.abs(days)}d`, rank: 0 }
  if (days <= 2) return { tone: 'danger', label: days === 0 ? 'Due today' : `Due in ${days}d`, rank: 1 }
  if (days <= 5) return { tone: 'warning', label: `Due in ${days}d`, rank: 2 }
  return { tone: 'neutral', label: `Due in ${days}d`, rank: 4 }
}

/** Revenue sources as bar rows (width = share of the largest source). */
export function revenueRows(revenue) {
  const rows = revenue?.rows || []
  const top = Math.max(...rows.map(r => r.minor), 0)
  return rows.map(r => ({
    key: r.key,
    label: r.label,
    value: formatMinor(r.minor),
    share: r.share === null || r.share === undefined ? '—' : formatPct(r.share, 0),
    widthPct: top > 0 ? Math.max(r.minor > 0 ? 3 : 0, Math.round((r.minor / top) * 100)) : 0
  }))
}

/** What the platform owes, by whom. */
export function liabilityRows(l) {
  if (!l) return []
  return [
    { key: 'trainee', label: 'Trainee wallet balances', minor: l.traineeWalletMinor, hint: 'Prepaid, available to spend' },
    { key: 'coachAvail', label: 'Coach balances', minor: l.coachAvailableMinor, hint: 'Earned and withdrawable' },
    { key: 'coachPending', label: 'Coach pending', minor: l.coachPendingMinor, hint: 'Releasing or paying out' },
    { key: 'escrow', label: 'Held in escrow', minor: l.inEscrowMinor, hint: 'Lessons not yet settled' }
  ].map(r => ({ ...r, value: formatMinor(r.minor) }))
}

/** Headline tiles. `deltas` are not on this endpoint, so no period comparison is shown. */
export function overviewTiles(o) {
  if (!o) return []
  return [
    { key: 'gmv', label: 'GMV', value: formatMinor(o.gmvMinor, { compact: true }), hint: `${formatInt(o.bookings)} bookings`, href: '/apps/booking' },
    { key: 'revenue', label: 'Platform revenue', value: formatMinor(o.revenue.totalMinor, { compact: true }), hint: `${formatPct(o.takeRate)} take rate on completed`, href: '/apps/pricing' },
    { key: 'refunds', label: 'Refunds', value: formatMinor(o.refunds.amountMinor, { compact: true }), hint: `${formatInt(o.refunds.count)} refunds · ${formatPct(o.refunds.rate)} of bookings`, href: financeLink({ tab: 'refunds' }) },
    { key: 'escrow', label: 'Held in escrow', value: formatMinor(o.escrow.heldMinor, { compact: true }), hint: `${formatMinor(o.escrow.releasingMinor, { compact: true })} releasing`, href: financeLink({ tab: 'escrow', status: 'held' }) },
    { key: 'payouts', label: 'Payouts waiting', value: formatMinor(o.payouts.pendingMinor, { compact: true }), hint: `${formatInt(o.payouts.pendingCount)} requests`, href: financeLink({ tab: 'payouts' }) },
    { key: 'disputes', label: 'Open disputes', value: formatInt(o.disputes.open), hint: `${formatMinor(o.disputes.openMinor, { compact: true })} at stake`, href: '/apps/finance/disputes', tone: o.disputes.open > 0 ? 'danger' : undefined },
    { key: 'liability', label: 'Owed to users', value: formatMinor(o.walletLiability.totalMinor, { compact: true }), hint: 'wallets + coach balances', href: financeLink({ tab: 'overview' }) },
    { key: 'win', label: 'Dispute win rate', value: o.disputes.winRate === null ? '—' : formatPct(o.disputes.winRate, 0), hint: `${o.disputes.won} won · ${o.disputes.lost} lost`, href: '/apps/finance/disputes' }
  ]
}

/** GMV and revenue daily, as chart series (money, minor units). */
export function moneyTrend(daily = []) {
  return {
    categories: daily.map(d => d.date),
    gmv: [{ name: 'GMV', data: daily.map(d => d.gmvMinor ?? 0) }],
    revenue: [{ name: 'Platform revenue', data: daily.map(d => d.revenueMinor ?? 0) }]
  }
}

export { formatDelta }
