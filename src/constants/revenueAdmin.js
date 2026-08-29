/** Shared labels & helpers for Pricing + Promo admin screens. */

export const LOCKER_PLAN_META = {
  free: { label: 'Free', short: 'Free' },
  plus_5gb: { label: 'Plus', short: 'Plus' },
  pro_10gb: { label: 'Pro', short: 'Pro' },
  max_25gb: { label: 'Max', short: 'Max' }
}

export function lockerPlanLabel(planId) {
  return LOCKER_PLAN_META[planId]?.label || planId
}

export const BOOKING_TYPE_OPTIONS = [
  {
    value: 'all',
    label: 'All bookings',
    hint: 'Instant, scheduled, and live session extensions'
  },
  {
    value: 'instant',
    label: 'Instant lesson',
    hint: 'On-demand bookings only'
  },
  {
    value: 'scheduled',
    label: 'Scheduled session',
    hint: 'Calendar bookings only'
  },
  {
    value: 'session_extension',
    label: 'Session extension',
    hint: 'Live-lesson extend pay only — not new bookings'
  }
]

export const BOOKING_TYPE_LABELS = Object.fromEntries(
  BOOKING_TYPE_OPTIONS.map(o => [o.value, o.label])
)

export function formatBookingTypes(types) {
  const list = Array.isArray(types) ? types : ['all']
  if (list.includes('all')) return 'All'
  return list.map(t => BOOKING_TYPE_LABELS[t] || t).join(', ')
}

/** 100 bps = 1% */
export function bpsToPercent(bps) {
  return Math.round(Math.max(0, Number(bps) || 0) / 100)
}

export function percentToBps(percent) {
  return Math.round(Math.max(0, Math.min(100, Number(percent) || 0)) * 100)
}

/** 10000 bps = 1.00× multiplier */
export function bpsToMultiplier(bps) {
  return (Math.max(0, Number(bps) || 0) / 10000).toFixed(2)
}

export function multiplierToBps(mult) {
  return Math.round(Math.max(0, Number(mult) || 0) * 10000)
}

export function previewPromoDiscount(form, sampleAmount = 50) {
  const amount = Math.max(0, Number(sampleAmount) || 0)
  const val = Math.max(0, Number(form.discount_value) || 0)
  const maxCap = Math.max(0, Number(form.max_discount_amount) || 0)
  const minOrder = Math.max(0, Number(form.min_order_amount) || 0)
  if (amount < minOrder) {
    return { eligible: false, reason: `Min order $${minOrder.toFixed(2)}`, discount: 0, final: amount }
  }
  let discount = 0
  if (form.discount_type === 'percentage') {
    discount = amount * (val / 100)
    if (maxCap > 0) discount = Math.min(discount, maxCap)
  } else {
    discount = Math.min(val, amount)
  }
  discount = Number(discount.toFixed(2))
  return {
    eligible: true,
    discount,
    final: Number(Math.max(amount - discount, 0).toFixed(2))
  }
}

export const PROMO_PRESETS = [
  {
    id: 'instant_15',
    label: 'Instant 15%',
    form: {
      discount_type: 'percentage',
      discount_value: '15',
      applicable_booking_types: ['instant'],
      display_label: '15% off instant lessons'
    }
  },
  {
    id: 'extension_20',
    label: 'Extension 20%',
    form: {
      discount_type: 'percentage',
      discount_value: '20',
      applicable_booking_types: ['session_extension'],
      display_label: '20% off extensions'
    }
  },
  {
    id: 'scheduled_10',
    label: 'Scheduled $10 off',
    form: {
      discount_type: 'fixed_amount',
      discount_value: '10',
      applicable_booking_types: ['scheduled'],
      display_label: '$10 off scheduled sessions'
    }
  },
  {
    id: 'platform_wide',
    label: 'Platform-wide 10%',
    form: {
      discount_type: 'percentage',
      discount_value: '10',
      applicable_booking_types: ['all'],
      display_label: '10% off'
    }
  }
]

export const PRICING_TAB_FLOW = [
  { tab: 0, slug: 'rates', label: 'Rates & fees', hint: 'Commission, lesson fees, taxes, escrow' },
  { tab: 1, slug: 'locker', label: 'Locker plans', hint: 'Storage tiers, recording, extension %' },
  { tab: 2, slug: 'surge', label: 'Surge & peak', hint: 'Busy-hour multiplier rules' },
  { tab: 3, slug: 'profit', label: 'Profit check', hint: 'Unit economics on a sample lesson' },
  { tab: 4, slug: 'history', label: 'History', hint: 'Published pricing versions' }
]
