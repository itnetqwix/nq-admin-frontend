export const REFUND_REASON_LABELS = {
  accept_expired: 'Accept window expired',
  join_expired: 'Join window missed',
  declined: 'Declined by coach',
  no_show: 'No-show',
  scheduled_trainer_no_show: 'No-show',
  trainer_cancelled: 'Coach cancelled',
  trainer_cancelled_scheduled: 'Coach cancelled',
  trainee_cancelled: 'Enthusiast cancelled',
  trainee_cancelled_scheduled: 'Cancelled before confirmation',
  scheduled_unconfirmed_expired: 'Unconfirmed — expired at start',
  scheduled_overlap_superseded: 'Overlap — another session confirmed first',
  duplicate_charge: 'Duplicate charge',
  quality_issue: 'Session quality / support exception',
  support_exception: 'Support exception'
}

export const REFUND_REASON_PRESETS = [
  { key: 'no_show', label: 'No-show' },
  { key: 'trainer_cancelled', label: 'Coach cancelled' },
  { key: 'trainee_cancelled', label: 'Enthusiast cancelled' },
  { key: 'duplicate_charge', label: 'Duplicate charge' },
  { key: 'quality_issue', label: 'Quality / support exception' },
  { key: 'other', label: 'Other' }
]

export function refundReasonLabel(reason) {
  if (!reason) return '—'
  const raw = String(reason).trim()
  const key = raw.toLowerCase()
  if (REFUND_REASON_LABELS[key]) return REFUND_REASON_LABELS[key]
  const prefix = key.split(':')[0].trim()
  if (REFUND_REASON_LABELS[prefix] && raw.includes(':')) {
    return `${REFUND_REASON_LABELS[prefix]} — ${raw.slice(raw.indexOf(':') + 1).trim()}`
  }
  return raw
}

export function isRefundTerminal(status) {
  const s = String(status || '').trim().toLowerCase()
  return s === 'refunded' || s === 'completed' || s === 'processing'
}

export function refundStatusLabel(status) {
  const s = String(status || '').trim().toLowerCase()
  if (s === 'completed' || s === 'refunded') return 'Refunded'
  if (s === 'processing') return 'Processing'
  if (s === 'failed') return 'Failed'
  if (s === 'pending') return 'Pending'
  if (s === 'logged') return 'Logged'
  if (s === 'releasing') return 'Releasing'
  return status || '—'
}

export function refundDestinationCopy(destination) {
  const d = String(destination || '').toLowerCase()
  if (d === 'wallet') return 'Wallet — usually instant'
  if (d === 'card') return 'Card — 5–10 business days'
  if (d === 'bank') return 'Bank — typically 3–5 business days'
  return destination || 'Original payment method'
}

export function personDisplayName(info, fallbackId) {
  if (!info && !fallbackId) return '—'
  return info?.fullName || info?.fullname || info?.name || (fallbackId ? String(fallbackId).slice(-6) : '—')
}
