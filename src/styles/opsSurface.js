/**
 * Ops Surface — NetQwix admin chrome.
 * Vercel shell (canvas/hairline/mono) + Stripe data (indigo, tnum) + Sentry night drawer.
 * Mesh is auth-hero only — never on dense /apps/* pages.
 */
export const ops = {
  ink: '#171717',
  body: '#4d4d4d',
  mute: '#888888',
  hairline: '#ebebeb',
  canvas: '#ffffff',
  canvasSoft: '#fafafa',
  canvasSoft2: '#f5f5f5',
  indigo: '#533afd',
  indigoDeep: '#4434d4',
  link: '#0070f3',
  error: '#ee0000',
  errorSoft: '#f7d4d6',
  warning: '#f5a623',
  night: '#150f23',
  nightLift: '#1f1633',
  lime: '#c2ef4e',
  onNight: '#ffffff',
  onNightMuted: 'rgba(255,255,255,0.72)',
  shadowCard:
    '0px 1px 1px #00000005, 0px 2px 2px #0000000a, inset 0 0 0 1px #00000014',
  shadowDrawer:
    '0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f',
  /** Vercel cyan/blue/magenta/amber mesh — auth rail only */
  meshAuth:
    'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(0,212,255,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 80% 20%, rgba(83,58,253,0.45), transparent 50%), radial-gradient(ellipse 60% 50% at 70% 80%, rgba(255,0,200,0.28), transparent 55%), radial-gradient(ellipse 50% 40% at 15% 85%, rgba(245,166,35,0.3), transparent 50%)',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  sans: 'Inter, Geist, system-ui, -apple-system, sans-serif',
  radiusSm: '6px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusPill: '64px'
}

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
    inviting: { bg: '#ffefcf', color: '#ab570a' },
    referring: { bg: '#f0e6ff', color: '#533afd' },
    transactions: { bg: '#e8f0fe', color: '#4434d4' },
    api: { bg: '#e8e8e8', color: '#171717' },
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

/** Soft-tint failed/locked login actions in the table title row. */
export function actionTone(action) {
  const a = String(action || '').toLowerCase()
  if (a === 'login_failed' || a === 'login_locked') return ops.error
  if (a === 'group_invite_declined') return ops.warning
  return ops.ink
}
