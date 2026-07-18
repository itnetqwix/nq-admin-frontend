/**
 * Ops Surface type — Inter geometric sans (Vercel/Geist substitute).
 * Display ceiling weight 600; aggressive negative tracking on headings.
 */
const typography = {
  fontFamily: [
    'Inter',
    'Geist',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ].join(','),
  fontWeightLight: 400,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  h1: {
    fontWeight: 600,
    letterSpacing: '-2.4px',
    lineHeight: 1.05
  },
  h2: {
    fontWeight: 600,
    letterSpacing: '-1.28px',
    lineHeight: 1.15
  },
  h3: {
    fontWeight: 600,
    letterSpacing: '-0.96px',
    lineHeight: 1.2
  },
  h4: {
    fontWeight: 600,
    letterSpacing: '-0.6px',
    lineHeight: 1.25
  },
  h5: {
    fontWeight: 600,
    letterSpacing: '-0.48px',
    lineHeight: 1.3
  },
  h6: {
    fontWeight: 600,
    letterSpacing: '-0.28px',
    lineHeight: 1.35
  },
  subtitle1: {
    fontWeight: 500,
    letterSpacing: '-0.28px',
    lineHeight: 1.5
  },
  subtitle2: {
    fontWeight: 500,
    letterSpacing: '-0.2px',
    lineHeight: 1.45
  },
  body1: {
    fontWeight: 400,
    letterSpacing: '-0.16px',
    lineHeight: 1.5
  },
  body2: {
    fontWeight: 400,
    letterSpacing: '-0.28px',
    lineHeight: 1.45
  },
  button: {
    fontWeight: 500,
    letterSpacing: '-0.16px',
    textTransform: 'none'
  },
  caption: {
    fontWeight: 400,
    letterSpacing: '0',
    lineHeight: 1.35
  },
  overline: {
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontSize: '0.6875rem'
  }
}

export default typography
