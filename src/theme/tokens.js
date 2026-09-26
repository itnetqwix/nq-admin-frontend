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
  night: '#0B0F19',
  nightLift: '#121826',
  sidebarBg: '#0E131F',
  topbarBg: 'rgba(14, 19, 31, 0.90)',
  borderDark: 'rgba(255, 255, 255, 0.08)',
  borderDarkHover: 'rgba(255, 255, 255, 0.16)',
  indigoSoft: 'rgba(99, 102, 241, 0.15)',
  indigoText: '#818CF8',
  lime: '#00B86B',
  onNight: '#F8FAFC',
  onNightMuted: '#94A3B8',
  shadowCard: '0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.25)',
  shadowDrawer:
    '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  meshAuth:
    'radial-gradient(ellipse 70% 50% at 18% 28%, rgba(0,184,107,0.22), transparent 55%), radial-gradient(ellipse 60% 45% at 82% 18%, rgba(99,102,241,0.28), transparent 50%), radial-gradient(ellipse 50% 40% at 70% 85%, rgba(196,92,38,0.18), transparent 50%)',
  sans: '"Inter", "Source Sans 3", system-ui, -apple-system, sans-serif',
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
