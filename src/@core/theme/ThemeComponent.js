// ** MUI Imports
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles'

// ** Theme Config
import themeConfig from 'src/configs/themeConfig'

// ** Direction component for LTR or RTL
import Direction from 'src/layouts/components/Direction'

// ** Theme
import themeOptions from './ThemeOptions'

// ** Global Styles
import GlobalStyling from './globalStyles'

// ** Design tokens exposed to components as CSS variables
import { tokenCssVars } from 'src/theme/tokens'

const ThemeComponent = props => {
  // ** Props
  const { settings, children } = props

  // ** Pass merged ThemeOptions (of core and user) to createTheme function
  let theme = createTheme(themeOptions(settings, 'light'))

  // ** Set responsive font sizes to true
  if (themeConfig.responsiveFontSizes) {
    theme = responsiveFontSizes(theme)
  }

  return (
    <ThemeProvider theme={theme}>
      <Direction direction={settings.direction}>
        <CssBaseline />
        {/* theme.palette.mode is the effective mode ('semi-dark' resolves to light content). */}
        <GlobalStyles
          styles={{ ':root': { ...tokenCssVars(theme.palette.mode), colorScheme: theme.palette.mode } }}
        />
        <GlobalStyles styles={() => GlobalStyling(theme)} />
        {children}
      </Direction>
    </ThemeProvider>
  )
}

export default ThemeComponent
