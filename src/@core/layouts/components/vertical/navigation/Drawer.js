// ** MUI Imports
import { styled } from '@mui/material/styles'
import MuiSwipeableDrawer from '@mui/material/SwipeableDrawer'

const SwipeableDrawer = styled(MuiSwipeableDrawer)(({ theme }) => ({
  overflowX: 'hidden',
  transition: 'width .25s cubic-bezier(0.4, 0, 0.2, 1)',
  '& ul': {
    listStyle: 'none'
  },
  '& .MuiListItem-gutters': {
    paddingLeft: 4,
    paddingRight: 4
  },
  '& .MuiDrawer-paper': {
    left: 0,
    right: 'unset',
    overflowX: 'hidden',
    borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider}`,
    transition: 'width .25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .25s ease, background-color .25s ease',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 19, 31, 0.95)' : '#ffffff',
    backdropFilter: 'blur(16px)',
    backgroundImage: 'none'
  }
}))

const Drawer = props => {
  // ** Props
  const {
    hidden,
    children,
    navHover,
    navWidth,
    settings,
    navVisible,
    setNavHover,
    navMenuProps,
    setNavVisible,
    collapsedNavWidth,
    navigationBorderWidth
  } = props

  // ** Vars
  const { navCollapsed } = settings
  let flag = true

  // Drawer Props for Mobile & Tablet screens
  const MobileDrawerProps = {
    open: navVisible,
    onOpen: () => setNavVisible(true),
    onClose: () => setNavVisible(false),
    ModalProps: {
      keepMounted: true,
      BackdropProps: {
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)'
        }
      }
    }
  }

  // Drawer Props for Laptop & Desktop screens
  const DesktopDrawerProps = {
    open: true,
    onOpen: () => null,
    onClose: () => null,
    onMouseEnter: () => {
      // Declared flag to resolve first time flicker issue while trying to collapse the menu
      if (flag || navCollapsed) {
        setNavHover(true)
        flag = false
      }
    },
    onMouseLeave: () => {
      if (navCollapsed) {
        setNavHover(false)
      }
    }
  }
  let userNavMenuStyle = {}
  let userNavMenuPaperStyle = {}
  if (navMenuProps && navMenuProps.sx) {
    userNavMenuStyle = navMenuProps.sx
  }
  if (navMenuProps && navMenuProps.PaperProps && navMenuProps.PaperProps.sx) {
    userNavMenuPaperStyle = navMenuProps.PaperProps.sx
  }
  const userNavMenuProps = Object.assign({}, navMenuProps)
  delete userNavMenuProps.sx
  delete userNavMenuProps.PaperProps

  const currentNavWidth = navCollapsed && !navHover ? collapsedNavWidth : navWidth

  return (
    <SwipeableDrawer
      className='layout-vertical-nav'
      variant={hidden ? 'temporary' : 'permanent'}
      {...(hidden ? { ...MobileDrawerProps } : { ...DesktopDrawerProps })}
      PaperProps={{
        sx: {
          width: hidden ? 280 : currentNavWidth,
          maxWidth: hidden ? 'calc(100vw - 32px)' : undefined,
          ...(!hidden && navCollapsed && navHover ? { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)' } : {}),
          ...userNavMenuPaperStyle
        },
        ...navMenuProps?.PaperProps
      }}
      sx={{
        ...(hidden ? { width: 'auto' } : { width: currentNavWidth, flexShrink: 0 }),
        ...userNavMenuStyle
      }}
      {...userNavMenuProps}
    >
      {children}
    </SwipeableDrawer>
  )
}

export default Drawer
