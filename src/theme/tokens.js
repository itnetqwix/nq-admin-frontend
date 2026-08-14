/**
 * Match Desk — single visual source for NetQwix admin.
 * Scoreboard numerals + live green; everything else stays quiet.
 */
export const tokens = {
  ink: '#12161C',
  body: '#3D4450',
  mute: '#7A8190',
  hairline: '#D8DCE3',
  canvas: '#FFFFFF',
  canvasSoft: '#F3F4F6',
  canvasSoft2: '#E8EAEE',
  indigo: '#2B5FFF',
  indigoDeep: '#1E4AD9',
  accent: '#2B5FFF',
  live: '#00B86B',
  clay: '#C45C26',
  softIndigo: '#E8EEFF',
  softSky: '#E8F1FF',
  softMint: '#DDF7EC',
  softAmber: '#FDECDC',
  pageTint: '#F3F4F6',
  link: '#2B5FFF',
  error: '#E11D2E',
  errorSoft: '#F8D4D7',
  warning: '#C45C26',
  night: '#0E1218',
  nightLift: '#161C26',
  lime: '#00B86B',
  onNight: '#FFFFFF',
  onNightMuted: 'rgba(255,255,255,0.72)',
  shadowCard: '0px 1px 1px #12161C08, 0px 2px 2px #12161C0A, inset 0 0 0 1px #D8DCE3',
  shadowDrawer:
    '0px 1px 1px #12161C08, 0px 8px 16px -4px #12161C0A, 0px 24px 32px -8px #12161C12',
  meshAuth:
    'radial-gradient(ellipse 70% 50% at 18% 28%, rgba(0,184,107,0.22), transparent 55%), radial-gradient(ellipse 60% 45% at 82% 18%, rgba(43,95,255,0.28), transparent 50%), radial-gradient(ellipse 50% 40% at 70% 85%, rgba(196,92,38,0.18), transparent 50%)',
  sans: '"Source Sans 3", system-ui, -apple-system, sans-serif',
  scoreboard: '"Barlow Condensed", "Arial Narrow", sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  radiusSm: '6px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusPill: '64px'
}

/** @deprecated use tokens — kept so existing `ops.*` imports pick up Match Desk. */
export const ops = tokens

export default tokens
