/**
 * Display formatting shared by every admin screen. Money arrives from the API in minor units
 * (cents) so it is formatted in exactly one place; a missing value is always an em dash, never
 * "NaN" or "$0.00" (zero and unknown mean different things to an admin).
 */
const DASH = '—'

const isMissing = v => v === null || v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v))

export function formatMinor(minor, { currency = 'USD', compact = false, signed = false } = {}) {
  if (isMissing(minor)) return DASH
  const amount = Number(minor) / 100
  if (!Number.isFinite(amount)) return DASH
  const useCompact = compact && Math.abs(amount) >= 10000
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    ...(useCompact ? { notation: 'compact', maximumFractionDigits: 1 } : {})
  }).format(amount)
  return signed && amount > 0 ? `+${formatted}` : formatted
}

export function formatInt(value) {
  if (isMissing(value)) return DASH
  return new Intl.NumberFormat('en-US').format(Number(value))
}

/** 0.1234 -> "12.3%". */
export function formatPct(ratio, digits = 1) {
  if (isMissing(ratio)) return DASH
  return `${(Number(ratio) * 100).toFixed(digits)}%`
}

/** Relative change vs the previous period: 0.125 -> "+12.5%". Null when there is no baseline. */
export function formatDelta(ratio, digits = 1) {
  if (isMissing(ratio)) return null
  const pct = Number(ratio) * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(digits)}%`
}

/** Absolute change in a rate, in percentage points: 0.05 -> "+5.0 pts". */
export function formatPoints(diff, digits = 1) {
  if (isMissing(diff)) return null
  const pts = Number(diff) * 100
  const sign = pts > 0 ? '+' : ''
  return `${sign}${pts.toFixed(digits)} pts`
}

export function formatDuration(totalSeconds) {
  if (isMissing(totalSeconds)) return DASH
  const s = Math.max(0, Math.round(Number(totalSeconds)))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`
  return `${sec}s`
}

const UNITS = [
  ['d', 86400],
  ['h', 3600],
  ['m', 60]
]

/** "3m ago", "2h ago", "5d ago"; future times read "in 3m". */
export function timeAgo(date, now = Date.now()) {
  if (isMissing(date)) return DASH
  const t = new Date(date).getTime()
  if (!Number.isFinite(t)) return DASH
  const diffSec = Math.round((now - t) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 45) return diffSec >= 0 ? 'just now' : 'in a moment'
  for (const [label, size] of UNITS) {
    if (abs >= size) {
      const n = Math.floor(abs / size)
      return diffSec >= 0 ? `${n}${label} ago` : `in ${n}${label}`
    }
  }
  return diffSec >= 0 ? 'just now' : 'in a moment'
}

/** Which way a delta should be read: higher is good for revenue, bad for refunds/errors. */
export function deltaTone(ratio, { higherIsBetter = true } = {}) {
  if (isMissing(ratio) || Number(ratio) === 0) return 'neutral'
  const up = Number(ratio) > 0
  return up === higherIsBetter ? 'success' : 'danger'
}
