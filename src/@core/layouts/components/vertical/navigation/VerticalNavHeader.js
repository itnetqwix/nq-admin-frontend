// ** Next Import
import Link from 'next/link'
import Image from 'next/image'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Custom Icon Import
import Icon from 'src/@core/components/icon'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Styled Components
const MenuHeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(3),
  justifyContent: 'space-between',
  transition: 'padding .25s ease-in-out',
  height: 64,
  minHeight: 64,
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider}`
}))

const LinkStyled = styled(Link)({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  minWidth: 0,
  overflow: 'hidden'
})

const VerticalNavHeader = props => {
  // ** Props
  const {
    hidden,
    navHover,
    settings,
    saveSettings,
    collapsedNavWidth,
    toggleNavVisibility,
    navMenuBranding: userNavMenuBranding
  } = props

  // ** Hooks & Vars
  const theme = useTheme()
  const { navCollapsed } = settings
  const isExpanded = !navCollapsed || navHover

  return (
    <MenuHeaderWrapper
      className='nav-header'
      sx={{
        px: isExpanded ? 4 : 2.5,
        justifyContent: isExpanded ? 'space-between' : 'center'
      }}
    >
      {userNavMenuBranding ? (
        userNavMenuBranding(props)
      ) : (
        <LinkStyled href='/home'>
          {isExpanded ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  flexShrink: 0
                }}
              >
                <Image width={24} height={24} src='/images/apple-touch-icon.png' alt='NetQwix' style={{ objectFit: 'contain' }} />
              </Box>
              <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    letterSpacing: '-0.3px',
                    color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#0F172A',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2
                  }}
                >
                  {themeConfig.templateName}
                </Typography>
                <Typography
                  variant='caption'
                  sx={{
                    fontFamily: 'inherit',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#818CF8',
                    display: 'block'
                  }}
                >
                  Enterprise Admin
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <Image width={24} height={24} src='/images/apple-touch-icon.png' alt='NetQwix' style={{ objectFit: 'contain' }} />
            </Box>
          )}
        </LinkStyled>
      )}

      {hidden ? (
        <IconButton
          disableRipple
          disableFocusRipple
          onClick={toggleNavVisibility}
          aria-label='Close sidebar'
          sx={{
            p: 1,
            color: 'text.secondary',
            borderRadius: '8px',
            '&:hover': {
              color: 'text.primary',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
            }
          }}
        >
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      ) : isExpanded ? (
        <Tooltip title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement='right' arrow>
          <IconButton
            disableRipple
            disableFocusRipple
            onClick={() => saveSettings({ ...settings, navCollapsed: !navCollapsed })}
            aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            sx={{
              p: 0.75,
              borderRadius: '8px',
              color: 'text.secondary',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                color: '#818CF8',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                bgcolor: 'rgba(99, 102, 241, 0.12)'
              }
            }}
          >
            <Icon icon={navCollapsed ? 'mdi:chevron-double-right' : 'mdi:chevron-double-left'} fontSize={18} />
          </IconButton>
        </Tooltip>
      ) : null}
    </MenuHeaderWrapper>
  )
}

export default VerticalNavHeader
