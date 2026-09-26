import { tokens } from 'src/theme/tokens'

/**
 * Match Desk palette — applied admin-wide.
 */
const DefaultPalette = (mode, skin) => {
  const whiteColor = '#FFFFFF'
  const isLight = mode === 'light'
  const inkRgb = isLight ? '18, 22, 28' : '242, 242, 242'
  const mainColor = inkRgb

  const defaultBgColor = () => {
    if (skin === 'bordered' && isLight) return whiteColor
    if (skin === 'bordered' && !isLight) return tokens.nightLift
    if (isLight) return tokens.canvasSoft
    return tokens.night
  }

  return {
    customColors: {
      dark: inkRgb,
      main: mainColor,
      light: inkRgb,
      darkBg: tokens.night,
      sidebarBg: tokens.sidebarBg || '#0E131F',
      lightBg: tokens.canvasSoft,
      bodyBg: isLight ? tokens.canvasSoft : tokens.night,
      trackBg: isLight ? tokens.canvasSoft2 : '#1E293B',
      avatarBg: isLight ? tokens.canvasSoft2 : '#1E293B',
      tooltipBg: isLight ? tokens.ink : '#1E293B',
      tableHeaderBg: isLight ? tokens.canvasSoft : '#161F30',
      hairline: isLight ? tokens.hairline : 'rgba(255, 255, 255, 0.08)',
      indigo: tokens.accent,
      lime: tokens.live,
      mute: isLight ? tokens.mute : '#94A3B8'
    },
    mode,
    common: {
      black: '#000000',
      white: whiteColor
    },
    primary: {
      light: isLight ? '#2A3340' : '#818CF8',
      main: isLight ? tokens.ink : '#6366F1',
      dark: isLight ? '#000000' : '#4F46E5',
      contrastText: whiteColor
    },
    secondary: {
      light: '#5B82FF',
      main: tokens.accent,
      dark: tokens.indigoDeep,
      contrastText: whiteColor
    },
    error: {
      light: tokens.errorSoft,
      main: tokens.error,
      dark: '#B31220',
      contrastText: whiteColor
    },
    warning: {
      light: tokens.softAmber,
      main: tokens.clay,
      dark: '#8A3E16',
      contrastText: tokens.ink
    },
    info: {
      light: tokens.softSky,
      main: isLight ? tokens.accent : '#38BDF8',
      dark: tokens.indigoDeep,
      contrastText: whiteColor
    },
    success: {
      light: tokens.softMint,
      main: tokens.live,
      dark: '#008A50',
      contrastText: whiteColor
    },
    grey: {
      50: isLight ? tokens.canvasSoft : '#0B0F19',
      100: isLight ? tokens.canvasSoft2 : '#121826',
      200: isLight ? tokens.hairline : '#1E293B',
      300: isLight ? '#C8CDD6' : '#334155',
      400: isLight ? '#A1A8B4' : '#64748B',
      500: isLight ? tokens.mute : '#94A3B8',
      600: isLight ? '#5C6470' : '#CBD5E1',
      700: isLight ? tokens.body : '#E2E8F0',
      800: isLight ? '#2A3340' : '#F1F5F9',
      900: isLight ? tokens.ink : '#F8FAFC',
      A100: isLight ? tokens.canvasSoft2 : '#121826',
      A200: isLight ? tokens.hairline : '#1E293B',
      A400: isLight ? '#A1A8B4' : '#64748B',
      A700: isLight ? tokens.body : '#E2E8F0'
    },
    text: {
      primary: isLight ? tokens.ink : '#F8FAFC',
      secondary: isLight ? tokens.body : '#94A3B8',
      disabled: isLight ? tokens.mute : '#64748B'
    },
    divider: isLight ? tokens.hairline : 'rgba(255, 255, 255, 0.08)',
    background: {
      paper: isLight ? whiteColor : tokens.nightLift,
      default: defaultBgColor()
    },
    action: {
      active: isLight ? 'rgba(18, 22, 28, 0.54)' : 'rgba(248, 250, 252, 0.7)',
      hover: isLight ? 'rgba(18, 22, 28, 0.04)' : 'rgba(255, 255, 255, 0.05)',
      hoverOpacity: 0.04,
      selected: isLight ? 'rgba(18, 22, 28, 0.06)' : 'rgba(99, 102, 241, 0.15)',
      disabled: isLight ? 'rgba(18, 22, 28, 0.26)' : 'rgba(255, 255, 255, 0.3)',
      disabledBackground: isLight ? 'rgba(18, 22, 28, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      focus: isLight ? 'rgba(18, 22, 28, 0.12)' : 'rgba(99, 102, 241, 0.25)'
    }
  }
}

export default DefaultPalette
