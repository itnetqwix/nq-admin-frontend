// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import ListItem from '@mui/material/ListItem'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'

// ** Configs Import
import themeConfig from 'src/configs/themeConfig'

// ** Custom Components Imports
import UserIcon from 'src/layouts/components/UserIcon'
import Translations from 'src/layouts/components/Translations'
import CanViewNavLink from 'src/layouts/components/acl/CanViewNavLink'

// ** Util Import
import { handleURLQueries } from 'src/@core/layouts/utils'

// ** Styled Components — Modern Enterprise Sidebar Item
const MenuNavLink = styled(ListItemButton)(({ theme }) => ({
  width: '100%',
  borderRadius: 8,
  position: 'relative',
  transition: 'all 0.15s ease-in-out',
  color: theme.palette.mode === 'dark' ? '#94A3B8' : '#475569',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0F172A',
    '& .MuiListItemIcon-root': {
      color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0F172A'
    }
  },
  '&.active': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
    color: theme.palette.mode === 'dark' ? '#818CF8' : '#4F46E5',
    borderLeft: '3px solid #6366F1',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)'
    },
    '& .MuiTypography-root': {
      fontWeight: 600,
      color: theme.palette.mode === 'dark' ? '#F8FAFC !important' : '#1E1B4B !important'
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.mode === 'dark' ? '#818CF8 !important' : '#4F46E5 !important'
    }
  }
}))

const MenuItemTextMetaWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  transition: 'opacity .2s ease-in-out',
  ...(themeConfig.menuTextTruncate && { overflow: 'hidden' })
}))

const VerticalNavLink = ({
  item,
  parent,
  navHover,
  settings,
  navVisible,
  isSubToSub,
  collapsedNavWidth,
  toggleNavVisibility,
  navigationBorderWidth,
  favoritePaths,
  onToggleFavorite
}) => {
  // ** Hooks
  const router = useRouter()

  // ** Vars
  const { navCollapsed } = settings
  const isCollapsed = navCollapsed && !navHover
  const icon = parent && !item.icon ? themeConfig.navSubItemIcon : item.icon
  const isFavorite = item.path && favoritePaths?.has?.(item.path)

  const isNavLinkActive = () => {
    if (router.pathname === item.path || handleURLQueries(router, item.path)) {
      return true
    } else {
      return false
    }
  }

  const navLinkContent = (
    <MenuNavLink
      component={Link}
      {...(item.disabled && { tabIndex: -1 })}
      className={isNavLinkActive() ? 'active' : ''}
      href={item.path === undefined ? '/' : `${item.path}`}
      {...(item.openInNewTab ? { target: '_blank' } : null)}
      onClick={e => {
        if (item.path === undefined) {
          e.preventDefault()
          e.stopPropagation()
        }
        if (navVisible) {
          toggleNavVisibility()
        }
      }}
      sx={{
        py: 1.25,
        ...(item.disabled ? { pointerEvents: 'none', opacity: 0.5 } : { cursor: 'pointer' }),
        px: isCollapsed ? 2 : 3,
        justifyContent: isCollapsed ? 'center' : 'flex-start'
      }}
    >
      {isSubToSub ? null : (
        <ListItemIcon
          sx={{
            transition: 'margin .2s ease-in-out, color .15s ease',
            color: 'inherit',
            minWidth: isCollapsed ? 'unset' : 36,
            mr: isCollapsed ? 0 : 1.5,
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            '& svg': {
              fontSize: !parent ? '1.35rem' : '0.5rem',
              ...(parent && item.icon ? { fontSize: '0.875rem' } : {})
            }
          }}
        >
          <UserIcon icon={icon} />
        </ListItemIcon>
      )}

      <MenuItemTextMetaWrapper
        sx={{
          ...(isSubToSub ? { ml: 8 } : {}),
          ...(isCollapsed ? { opacity: 0, width: 0, display: 'none' } : { opacity: 1 })
        }}
      >
        <Typography
          sx={{
            fontSize: '0.875rem',
            lineHeight: 1.4,
            letterSpacing: '-0.15px'
          }}
          {...((themeConfig.menuTextTruncate || (!themeConfig.menuTextTruncate && isCollapsed)) && {
            noWrap: true
          })}
        >
          <Translations text={item.title} />
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {item.badgeContent ? (
            <Chip
              size='small'
              label={item.badgeContent}
              color={item.badgeColor || 'primary'}
              sx={{ '& .MuiChip-label': { px: 2, lineHeight: 1.385, textTransform: 'capitalize' } }}
            />
          ) : null}
          {item.path && onToggleFavorite && !isCollapsed ? (
            <Box
              component='span'
              role='button'
              aria-label={isFavorite ? 'Unpin' : 'Pin'}
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite(item)
              }}
              sx={{
                display: 'inline-flex',
                p: 0.25,
                borderRadius: 1,
                color: isFavorite ? '#EAB308' : 'text.disabled',
                '&:hover': { color: '#EAB308', bgcolor: 'action.hover' }
              }}
            >
              <UserIcon icon={isFavorite ? 'mdi:star' : 'mdi:star-outline'} fontSize='1rem' />
            </Box>
          ) : null}
        </Box>
      </MenuItemTextMetaWrapper>
    </MenuNavLink>
  )

  return (
    <CanViewNavLink navLink={item}>
      <ListItem
        disablePadding
        className='nav-link'
        disabled={item.disabled || false}
        sx={{
          mt: 0.5,
          transition: 'padding .25s ease-in-out',
          px: isCollapsed ? 1.5 : 2.5
        }}
      >
        {isCollapsed ? (
          <Tooltip title={item.title} placement='right' arrow enterDelay={100}>
            {navLinkContent}
          </Tooltip>
        ) : (
          navLinkContent
        )}
      </ListItem>
    </CanViewNavLink>
  )
}

export default VerticalNavLink
