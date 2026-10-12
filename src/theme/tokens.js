/**
 * Match Desk — single visual source for NetQwix admin.
 * Scoreboard numerals + live green; everything else stays quiet.
 *
 * Three views of the same tokens:
 *  - `tokens` / `ops`      CSS variable references (`var(--nq-ink, #12161C)`). Use in `sx`,
 *                          styled() and inline styles — they follow light/dark automatically.
 *  - `lightTokens` / `darkTokens`  literal values per mode. Use where a real color is required:
 *                          the MUI palette (alpha/darken throw on var()), ApexCharts, recharts.
 *  - `rawTokens`           alias of `lightTokens`, kept for the palette's existing call sites.
 *
 * The variables themselves are written once by ThemeComponent via `tokenCssVars(mode)`.
 */

// Values that do not change with the mode (fonts, radii, sidebar chrome, gradients).
const shared = {
  night: '#0B0F19',
  nightLift: '#121826',
  sidebarBg: '#0E131F',
  topbarBg: 'rgba(14, 19, 31, 0.90)',
  borderDark: 'rgba(255, 255, 255, 0.08)',
  borderDarkHover: 'rgba(255, 255, 255, 0.16)',
  indigoSoft: 'rgba(99, 102, 241, 0.15)',
  indigoText: '#818CF8',
  onNight: '#F8FAFC',
  onNightMuted: '#94A3B8'
}

const fixed = {
  meshAuth:
    'radial-gradient(ellipse 70% 50% at 18% 28%, rgba(0,184,107,0.22), transparent 55%), radial-gradient(ellipse 60% 45% at 82% 18%, rgba(99,102,241,0.28), transparent 50%), radial-gradient(ellipse 50% 40% at 70% 85%, rgba(196,92,38,0.18), transparent 50%)',
  // next/font would be cleaner, but _document.js owns font loading today (Inter is loaded there).
  sans: '"Inter", "Source Sans 3", system-ui, -apple-system, sans-serif',
  scoreboard: '"Barlow Condensed", "Arial Narrow", sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  radiusSm: '6px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusPill: '64px'
}

export const lightTokens = {
  ...shared,
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
  lime: '#00B86B',
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
  // Semantic status pairs: background / foreground / border.
  successBg: '#DDF7EC',
  successFg: '#007A47',
  successBorder: '#9BE3C3',
  warningBg: '#FDECDC',
  warningFg: '#9A4719',
  warningBorder: '#F5C79F',
  dangerBg: '#FBE3E5',
  dangerFg: '#B31220',
  dangerBorder: '#F2A9AF',
  infoBg: '#E8F1FF',
  infoFg: '#1E4AD9',
  infoBorder: '#B7CFFF',
  neutralBg: '#EEF0F3',
  neutralFg: '#3D4450',
  neutralBorder: '#D8DCE3',
  violetBg: '#ECE6FA',
  violetFg: '#4C2889',
  shadowCard: '0 1px 3px 0 rgba(16, 24, 40, 0.08), 0 1px 2px -1px rgba(16, 24, 40, 0.06)',
  shadowDrawer: '0 10px 25px -5px rgba(16, 24, 40, 0.18), 0 8px 10px -6px rgba(16, 24, 40, 0.12)'
}

export const darkTokens = {
  ...shared,
  ink: '#F8FAFC',
  body: '#CBD5E1',
  mute: '#94A3B8',
  hairline: 'rgba(255, 255, 255, 0.08)',
  canvas: '#121826',
  canvasSoft: '#161F30',
  canvasSoft2: '#1E293B',
  indigo: '#6B8CFF',
  indigoDeep: '#4F7BFF',
  accent: '#6B8CFF',
  live: '#10C97A',
  lime: '#10C97A',
  clay: '#E8814A',
  softIndigo: 'rgba(99, 102, 241, 0.15)',
  softSky: 'rgba(56, 189, 248, 0.14)',
  softMint: 'rgba(0, 184, 107, 0.16)',
  softAmber: 'rgba(232, 129, 74, 0.16)',
  pageTint: '#0B0F19',
  link: '#8FA9FF',
  error: '#F2555F',
  errorSoft: 'rgba(242, 85, 95, 0.18)',
  warning: '#E8814A',
  successBg: 'rgba(0, 184, 107, 0.16)',
  successFg: '#4ADE9F',
  successBorder: 'rgba(0, 184, 107, 0.35)',
  warningBg: 'rgba(232, 129, 74, 0.16)',
  warningFg: '#F0A173',
  warningBorder: 'rgba(232, 129, 74, 0.35)',
  dangerBg: 'rgba(242, 85, 95, 0.16)',
  dangerFg: '#FF8B93',
  dangerBorder: 'rgba(242, 85, 95, 0.35)',
  infoBg: 'rgba(107, 140, 255, 0.16)',
  infoFg: '#9DB4FF',
  infoBorder: 'rgba(107, 140, 255, 0.35)',
  neutralBg: 'rgba(148, 163, 184, 0.12)',
  neutralFg: '#CBD5E1',
  neutralBorder: 'rgba(148, 163, 184, 0.25)',
  violetBg: 'rgba(167, 139, 250, 0.16)',
  violetFg: '#C4B5FD',
  shadowCard: '0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.25)',
  shadowDrawer: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
}

/** Literal light values for the MUI palette, which cannot take var() colors. */
export const rawTokens = { ...lightTokens, ...fixed }

const kebab = key => key.replace(/[A-Z0-9]/g, ch => `-${ch.toLowerCase()}`)
export const tokenVarName = key => `--nq-${kebab(key)}`

/** CSS custom properties for one mode, e.g. { '--nq-ink': '#12161C', ... }. */
export function tokenCssVars(mode) {
  const source = mode === 'dark' ? darkTokens : lightTokens
  const vars = {}
  Object.keys(source).forEach(key => {
    vars[tokenVarName(key)] = source[key]
  })
  return vars
}

/** Literal token values for the given MUI palette mode — for charts and other non-CSS consumers. */
export function tokensForMode(mode) {
  return { ...(mode === 'dark' ? darkTokens : lightTokens), ...fixed }
}

// Every theme-dependent key becomes a var() reference with the light value as fallback,
// so a surface rendered outside ThemeComponent (error pages, SSR) still looks right.
const varRefs = {}
Object.keys(lightTokens).forEach(key => {
  varRefs[key] = `var(${tokenVarName(key)}, ${lightTokens[key]})`
})

export const tokens = { ...varRefs, ...fixed }

/** @deprecated use tokens — kept so existing `ops.*` imports pick up Match Desk. */
export const ops = tokens

export default tokens
