/**
 * Deep links into the Finance workspace. Finance reads `tab`, `status` (escrow filter), `sessionId`
 * and `userId` from the URL (see FinancePage). Building every link here keeps a typo like
 * `escrowStatus=` (which Finance ignores) from silently losing a filter.
 */
export const FINANCE_TABS = ['overview', 'ledger', 'transactions', 'escrow', 'refunds', 'payouts', 'stuck_topups', 'topups', 'audit']
export const ESCROW_STATUSES = ['held', 'releasing', 'released', 'refunded', 'disputed', 'cancelled']

export function financeLink({ tab, status, sessionId, userId } = {}) {
  const params = new URLSearchParams()
  if (tab) {
    if (!FINANCE_TABS.includes(tab)) throw new Error(`Unknown finance tab "${tab}"`)
    params.set('tab', tab)
  }
  if (status) {
    if (tab !== 'escrow') throw new Error('status filters only apply to the escrow tab')
    if (!ESCROW_STATUSES.includes(status)) throw new Error(`Unknown escrow status "${status}"`)
    params.set('status', status)
  }
  if (sessionId) params.set('sessionId', String(sessionId))
  if (userId) params.set('userId', String(userId))
  const qs = params.toString()
  return `/apps/finance${qs ? `?${qs}` : ''}`
}
