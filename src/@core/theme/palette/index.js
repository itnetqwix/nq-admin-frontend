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
      lightBg: tokens.canvasSoft,
      bodyBg: isLight ? tokens.canvasSoft : tokens.night,
      trackBg: isLight ? tokens.canvasSoft2 : '#2a3140',
      avatarBg: isLight ? tokens.canvasSoft2 : '#2a3140',
      tooltipBg: isLight ? tokens.ink : tokens.nightLift,
      tableHeaderBg: isLight ? tokens.canvasSoft : tokens.nightLift,
      hairline: isLight ? tokens.hairline : '#2E3644',
      indigo: tokens.accent,
      lime: tokens.live,
      mute: isLight ? tokens.mute : '#b8bec8'
    },
    mode,
    common: {
      black: '#000000',
      white: whiteColor
    },
    primary: {
      light: '#2A3340',
      main: tokens.ink,
      dark: '#000000',
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
      main: tokens.accent,
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
      50: tokens.canvasSoft,
      100: tokens.canvasSoft2,
      200: tokens.hairline,
      300: '#C8CDD6',
      400: '#A1A8B4',
      500: tokens.mute,
      600: '#5C6470',
      700: tokens.body,
      800: '#2A3340',
      900: tokens.ink,
      A100: tokens.canvasSoft2,
      A200: tokens.hairline,
      A400: '#A1A8B4',
      A700: tokens.body
    },
    text: {
      primary: isLight ? tokens.ink : '#F2F2F2',
      secondary: isLight ? tokens.body : 'rgba(255,255,255,0.72)',
      disabled: isLight ? tokens.mute : 'rgba(255,255,255,0.38)'
    },
    divider: isLight ? tokens.hairline : '#2E3644',
    background: {
      paper: isLight ? whiteColor : tokens.nightLift,
      default: defaultBgColor()
    },
    action: {
      active: isLight ? 'rgba(18, 22, 28, 0.54)' : 'rgba(242, 242, 242, 0.54)',
      hover: isLight ? 'rgba(18, 22, 28, 0.04)' : 'rgba(255, 255, 255, 0.06)',
      hoverOpacity: 0.04,
      selected: isLight ? 'rgba(18, 22, 28, 0.06)' : 'rgba(43, 95, 255, 0.2)',
      disabled: isLight ? 'rgba(18, 22, 28, 0.26)' : 'rgba(255, 255, 255, 0.3)',
      disabledBackground: isLight ? 'rgba(18, 22, 28, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      focus: isLight ? 'rgba(18, 22, 28, 0.12)' : 'rgba(43, 95, 255, 0.28)'
    }
  }
}

export default DefaultPalette
