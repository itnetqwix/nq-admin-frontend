/**
 * Match Desk tokens + category chips.
 * Import `ops` or `tokens` — same object.
 */
export { tokens, ops } from 'src/theme/tokens'
export { ops as default } from 'src/theme/tokens'

import { ops } from 'src/theme/tokens'

export const CATEGORY_META = {
  all: { label: 'All', tone: 'default' },
  logins: { label: 'Logins', tone: 'login' },
  uploading: { label: 'Uploading', tone: 'upload' },
  booking: { label: 'Booking', tone: 'booking' },
  inviting: { label: 'Inviting', tone: 'invite' },
  referring: { label: 'Referring', tone: 'refer' },
  transactions: { label: 'Transactions', tone: 'txn' },
  api: { label: 'API hits', tone: 'api' },
  admin: { label: 'Admin', tone: 'admin' },
  profile: { label: 'Profile', tone: 'profile' }
}

export function categoryChipSx(category) {
  const map = {
    logins: { bg: '#d3e5ff', color: '#0761d1' },
    uploading: { bg: '#aaffec', color: '#29bc9b' },
    booking: { bg: '#d8ccf1', color: '#4c2889' },
    inviting: { bg: ops.softAmber, color: ops.clay },
    referring: { bg: ops.softIndigo, color: ops.indigo },
    transactions: { bg: '#e8f0fe', color: ops.indigoDeep },
    api: { bg: ops.canvasSoft2, color: ops.ink },
    admin: { bg: ops.canvasSoft2, color: ops.ink },
    profile: { bg: ops.canvasSoft2, color: ops.body },
    other: { bg: ops.canvasSoft2, color: ops.mute }
  }
  const t = map[category] || map.other
  return {
    bgcolor: t.bg,
    color: t.color,
    fontFamily: ops.mono,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.02em',
    height: 22,
    borderRadius: '4px',
    border: 'none'
  }
}

export function actionTone(action) {
  const a = String(action || '').toLowerCase()
  if (a === 'login_failed' || a === 'login_locked') return ops.error
  if (a === 'group_invite_declined') return ops.warning
  return ops.ink
}
