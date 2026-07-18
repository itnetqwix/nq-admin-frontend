// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import ListItem from '@mui/material/ListItem'
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

// ** Styled Components — Ops Surface: ink rail + soft hover (no blue wash)
const MenuNavLink = styled(ListItemButton)(({ theme }) => ({
  width: '100%',
  borderRadius: 6,
  position: 'relative',
  transition: 'background-color 0.12s ease, color 0.12s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  '&.active': {
    '&, &:hover': {
      backgroundColor: theme.palette.mode === 'light' ? '#F5F5F5' : 'rgba(255,255,255,0.06)',
      '&.Mui-focusVisible': {
        backgroundColor: theme.palette.mode === 'light' ? '#F0F0F0' : 'rgba(255,255,255,0.08)'
      }
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 2,
      borderRadius: 1,
      backgroundColor: theme.palette.mode === 'light' ? '#171717' : theme.palette.customColors.lime
    },
    '& .MuiTypography-root': {
      fontWeight: 500,
      color: `${theme.palette.text.primary} !important`
    },
    '& .MuiListItemIcon-root': {
      color: `${theme.palette.text.primary} !important`
    }
  }
}))

const MenuItemTextMetaWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  transition: 'opacity .25s ease-in-out',
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
  const icon = parent && !item.icon ? themeConfig.navSubItemIcon : item.icon
  const isFavorite = item.path && favoritePaths?.has?.(item.path)

  const isNavLinkActive = () => {
    if (router.pathname === item.path || handleURLQueries(router, item.path)) {
      return true
    } else {
      return false
    }
  }

  return (
    <CanViewNavLink navLink={item}>
      <ListItem
        disablePadding
        className='nav-link'
        disabled={item.disabled || false}
        sx={{
          mt: 0.5,
          transition: 'padding .25s ease-in-out',
          px: theme => (parent ? '0 !important' : `${theme.spacing(navCollapsed && !navHover ? 2 : 3)} !important`)
        }}
      >
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
            py: 1.5,
            ...(item.disabled ? { pointerEvents: 'none' } : { cursor: 'pointer' }),
            pr: navCollapsed && !navHover ? (collapsedNavWidth - navigationBorderWidth - 24 - 16) / 8 : 3,
            pl: navCollapsed && !navHover ? (collapsedNavWidth - navigationBorderWidth - 24 - 16) / 8 : 4
          }}
        >
          {isSubToSub ? null : (
            <ListItemIcon
              sx={{
                transition: 'margin .25s ease-in-out',
                color: parent ? 'text.secondary' : 'text.primary',
                ...(navCollapsed && !navHover ? { mr: 0 } : { mr: 2 }),
                ...(parent ? { ml: 2, mr: 4 } : {}),
                '& svg': {
                  ...(!parent ? { fontSize: '1.5rem' } : { fontSize: '0.5rem' }),
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
              ...(navCollapsed && !navHover ? { opacity: 0 } : { opacity: 1 })
            }}
          >
            <Typography
              {...((themeConfig.menuTextTruncate || (!themeConfig.menuTextTruncate && navCollapsed && !navHover)) && {
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
                  sx={{ '& .MuiChip-label': { px: 2.5, lineHeight: 1.385, textTransform: 'capitalize' } }}
                />
              ) : null}
              {item.path && onToggleFavorite && !(navCollapsed && !navHover) ? (
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
                    color: isFavorite ? 'warning.main' : 'text.disabled',
                    '&:hover': { color: 'warning.main', bgcolor: 'action.hover' }
                  }}
                >
                  <UserIcon icon={isFavorite ? 'mdi:star' : 'mdi:star-outline'} fontSize='1rem' />
                </Box>
              ) : null}
            </Box>
          </MenuItemTextMetaWrapper>
        </MenuNavLink>
      </ListItem>
    </CanViewNavLink>
  )
}

export default VerticalNavLink
