/** Admin pricing UI constants — mirrors backend pricing.ts regions. */

export const PRODUCT_TYPES = [
  { value: 'session_booking', label: 'Scheduled session' },
  { value: 'instant_lesson', label: 'Instant lesson' },
  { value: 'session_extension', label: 'Session extension' },
  { value: 'storage_subscription', label: 'Storage subscription' },
  { value: 'wallet_topup', label: 'Wallet top-up' }
]

export const PRODUCT_LABELS = Object.fromEntries(PRODUCT_TYPES.map(p => [p.value, p.label]))

export const US_PAYMENT_METHODS = [
  { id: 'card_domestic_us', label: 'US card (domestic)' },
  { id: 'card_international_us', label: 'International card' },
  { id: 'apple_pay_us', label: 'Apple Pay' },
  { id: 'google_pay_us', label: 'Google Pay' },
  { id: 'link_us', label: 'Link' },
  { id: 'amazon_pay_us', label: 'Amazon Pay' },
  { id: 'cashapp_us', label: 'Cash App' },
  { id: 'wallet_us', label: 'NetQwix Wallet' },
  { id: 'wallet_mixed_us', label: 'Wallet + card' }
]

export const CA_PAYMENT_METHODS = [
  { id: 'card_domestic_ca', label: 'Canadian card (domestic)' },
  { id: 'card_international_ca', label: 'International card' },
  { id: 'apple_pay_ca', label: 'Apple Pay' },
  { id: 'google_pay_ca', label: 'Google Pay' },
  { id: 'link_ca', label: 'Link' },
  { id: 'interac_ca', label: 'Interac' },
  { id: 'wallet_ca', label: 'NetQwix Wallet' },
  { id: 'wallet_mixed_ca', label: 'Wallet + card' }
]

export const US_STATE_OPTIONS = [
  { code: 'TX', label: 'Texas (8.25%)' },
  { code: 'CA', label: 'California (9.5%)' },
  { code: 'NY', label: 'New York (8.875%)' },
  { code: 'FL', label: 'Florida (7%)' },
  { code: 'WA', label: 'Washington (10.25%)' },
  { code: 'OR', label: 'Oregon (0%)' }
]

export const CA_PROVINCE_OPTIONS = [
  { code: 'ON', label: 'Ontario HST (13%)' },
  { code: 'AB', label: 'Alberta GST (5%)' },
  { code: 'BC', label: 'British Columbia (12%)' },
  { code: 'QC', label: 'Quebec (14.975%)' },
  { code: 'NS', label: 'Nova Scotia HST (15%)' }
]

export const STORAGE_PLAN_IDS = ['free', 'plus_5gb', 'pro_10gb', 'max_25gb']

export const fmtMoney = (minor, currency = 'USD') => {
  const n = Number(minor || 0) / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'CAD' ? 'CAD' : 'USD'
  }).format(n)
}

export const fmtPct = decimal => `${(Number(decimal || 0) * 100).toFixed(1)}%`

export const centsToInput = v => (Number(v || 0) / 100).toFixed(2)
export const inputToCents = v => Math.round(Number(v || 0) * 100)
export const pctInputToDecimal = v => Number(v || 0) / 100
export const decimalToPctInput = v => (Number(v || 0) * 100).toFixed(1)

export const deepClone = obj => JSON.parse(JSON.stringify(obj ?? {}))
