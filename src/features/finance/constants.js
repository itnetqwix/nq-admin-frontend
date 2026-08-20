import toast from 'react-hot-toast'

export const TAB = {
  OVERVIEW: 0,
  LEDGER: 1,
  TRANSACTIONS: 2,
  ESCROW: 3,
  REFUNDS: 4,
  PAYOUTS: 5,
  STUCK_TOPUPS: 6,
  TOPUPS: 7,
  AUDIT: 8
}

export const tabLabels = [
  'Overview',
  'Ledger',
  'Transactions',
  'Escrow',
  'Refunds',
  'Payouts',
  'Stuck top-ups',
  'Top-up history',
  'Audit log'
]

export const TAB_SLUG = {
  [TAB.OVERVIEW]: 'overview',
  [TAB.LEDGER]: 'ledger',
  [TAB.TRANSACTIONS]: 'transactions',
  [TAB.ESCROW]: 'escrow',
  [TAB.REFUNDS]: 'refunds',
  [TAB.PAYOUTS]: 'payouts',
  [TAB.STUCK_TOPUPS]: 'stuck_topups',
  [TAB.TOPUPS]: 'topups',
  [TAB.AUDIT]: 'audit'
}

export const searchPlaceholder = tab => {
  if (tab === TAB.LEDGER) return 'User ID or session ID'
  if (tab === TAB.ESCROW) return 'Session ID'
  if (tab === TAB.TOPUPS) return 'User ID'
  if (tab === TAB.TRANSACTIONS) return 'PI (pi_…), user ID, or session ID'
  if (tab === TAB.REFUNDS) return 'Booking ID, user, email, or PI'
  return 'Search…'
}

export function formatMinor(minor) {
  if (minor == null) return '—'
  return (Number(minor) / 100).toFixed(2)
}

export async function runReconcile(label, fn, onDone) {
  try {
    const result = await fn()
    const retried = result?.data?.retried ?? result?.retried
    const ok = result?.data?.ok ?? result?.ok
    if (retried != null) {
      toast.success(`${label}: retried ${retried}`)
    } else if (ok) {
      toast.success(`${label} completed`)
    } else {
      toast.success(label)
    }
    onDone?.()
  } catch (e) {
    toast.error(e?.message || `${label} failed`)
  }
}
