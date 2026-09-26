// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import MuiAppBar from '@mui/material/AppBar'
import MuiToolbar from '@mui/material/Toolbar'

/**
 * Ops Surface top bar — flat white, hairline only (Vercel nav height 64).
 * No Material floating shadow / translucent blur.
 */
const AppBar = styled(MuiAppBar)(({ theme }) => ({
  transition: 'background-color .2s ease, border-color .2s ease',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0, 3),
  paddingTop: 'env(safe-area-inset-top, 0px)',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 19, 31, 0.90)' : 'rgba(255, 255, 255, 0.90)',
  backdropFilter: 'blur(16px)',
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider}`,
  boxShadow: 'none',
  backgroundImage: 'none',
  height: 64,
  minHeight: 64,
  zIndex: 1100,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(0, 4)
  },
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    minHeight: 60,
    height: 60
  }
}))

const Toolbar = styled(MuiToolbar)(({ theme }) => ({
  width: '100%',
  padding: '0 !important',
  minHeight: '64px !important',
  [theme.breakpoints.down('sm')]: {
    minHeight: '60px !important'
  },
  transition: 'none'
}))

const LayoutAppBar = props => {
  const { settings, appBarProps, appBarContent: userAppBarContent } = props
  const theme = useTheme()
  const scrollTrigger = useScrollTrigger({ threshold: 0, disableHysteresis: true })
  const { appBar } = settings

  if (appBar === 'hidden') {
    return null
  }

  let userAppBarStyle = {}
  if (appBarProps && appBarProps.sx) {
    userAppBarStyle = appBarProps.sx
  }
  const userAppBarProps = Object.assign({}, appBarProps)
  delete userAppBarProps.sx

  return (
    <AppBar
      elevation={0}
      color='default'
      className='layout-navbar'
      sx={{
        ...userAppBarStyle,
        ...(scrollTrigger
          ? {
              borderBottomColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 19, 31, 0.96)' : 'rgba(255, 255, 255, 0.96)'
            }
          : {})
      }}
      position={appBar === 'fixed' ? 'sticky' : 'static'}
      {...userAppBarProps}
    >
      <Toolbar className='navbar-content-container'>
        {(userAppBarContent && userAppBarContent(props)) || null}
      </Toolbar>
    </AppBar>
  )
}

export default LayoutAppBar
