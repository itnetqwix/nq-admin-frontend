/**
 * Ops Surface palette — Vercel canvas/ink + Stripe indigo primary + Sentry error.
 * Applied admin-wide so every screen inherits the same system.
 */
const DefaultPalette = (mode, skin) => {
  const whiteColor = '#FFFFFF'
  const isLight = mode === 'light'

  // Light: near-black ink. Dark: soft off-white on night canvas.
  const ink = isLight ? '23, 23, 23' : '242, 242, 242' // #171717 / #f2f2f2
  const mainColor = ink

  const defaultBgColor = () => {
    if (skin === 'bordered' && isLight) return whiteColor
    if (skin === 'bordered' && !isLight) return '#1f1633'
    if (isLight) return '#FAFAFA'
    return '#150f23'
  }

  return {
    customColors: {
      dark: ink,
      main: mainColor,
      light: ink,
      darkBg: '#150f23',
      lightBg: '#FAFAFA',
      bodyBg: isLight ? '#FAFAFA' : '#150f23',
      trackBg: isLight ? '#F5F5F5' : '#2a2340',
      avatarBg: isLight ? '#F5F5F5' : '#2a2340',
      tooltipBg: isLight ? '#171717' : '#1f1633',
      tableHeaderBg: isLight ? '#FAFAFA' : '#1f1633',
      hairline: isLight ? '#EBEBEB' : '#362d59',
      indigo: '#533AFD',
      lime: '#C2EF4E',
      mute: isLight ? '#888888' : '#bdb8c0'
    },
    mode,
    common: {
      black: '#000000',
      white: whiteColor
    },
    primary: {
      light: '#333333',
      main: '#171717',
      dark: '#000000',
      contrastText: whiteColor
    },
    secondary: {
      light: '#665EFD',
      main: '#533AFD',
      dark: '#4434D4',
      contrastText: whiteColor
    },
    error: {
      light: '#F7D4D6',
      main: '#EE0000',
      dark: '#C50000',
      contrastText: whiteColor
    },
    warning: {
      light: '#FFEFCF',
      main: '#F5A623',
      dark: '#AB570A',
      contrastText: '#171717'
    },
    info: {
      light: '#D3E5FF',
      main: '#0070F3',
      dark: '#0761D1',
      contrastText: whiteColor
    },
    success: {
      light: '#AAFFEC',
      main: '#29BC9B',
      dark: '#1A8F76',
      contrastText: whiteColor
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EBEBEB',
      300: '#E0E0E0',
      400: '#A1A1A1',
      500: '#888888',
      600: '#666666',
      700: '#4D4D4D',
      800: '#333333',
      900: '#171717',
      A100: '#F5F5F5',
      A200: '#EBEBEB',
      A400: '#A1A1A1',
      A700: '#4D4D4D'
    },
    text: {
      primary: isLight ? '#171717' : '#F2F2F2',
      secondary: isLight ? '#4D4D4D' : 'rgba(255,255,255,0.72)',
      disabled: isLight ? '#888888' : 'rgba(255,255,255,0.38)'
    },
    divider: isLight ? '#EBEBEB' : '#362d59',
    background: {
      paper: isLight ? whiteColor : '#1f1633',
      default: defaultBgColor()
    },
    action: {
      active: isLight ? 'rgba(23, 23, 23, 0.54)' : 'rgba(242, 242, 242, 0.54)',
      hover: isLight ? 'rgba(23, 23, 23, 0.04)' : 'rgba(255, 255, 255, 0.06)',
      hoverOpacity: 0.04,
      selected: isLight ? 'rgba(23, 23, 23, 0.06)' : 'rgba(83, 58, 253, 0.2)',
      disabled: isLight ? 'rgba(23, 23, 23, 0.26)' : 'rgba(255, 255, 255, 0.3)',
      disabledBackground: isLight ? 'rgba(23, 23, 23, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      focus: isLight ? 'rgba(23, 23, 23, 0.12)' : 'rgba(83, 58, 253, 0.28)'
    }
  }
}

export default DefaultPalette
