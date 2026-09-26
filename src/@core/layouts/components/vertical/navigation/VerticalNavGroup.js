// ** React Imports
import { useEffect, Fragment } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import ListItem from '@mui/material/ListItem'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'

// ** Third Party Imports
import clsx from 'clsx'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Configs Import
import themeConfig from 'src/configs/themeConfig'

// ** Utils
import { hasActiveChild, removeChildren } from 'src/@core/layouts/utils'

// ** Custom Components Imports
import VerticalNavItems from './VerticalNavItems'
import UserIcon from 'src/layouts/components/UserIcon'
import Translations from 'src/layouts/components/Translations'
import CanViewNavGroup from 'src/layouts/components/acl/CanViewNavGroup'

const MenuItemTextWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  transition: 'opacity .2s ease-in-out',
  ...(themeConfig.menuTextTruncate && { overflow: 'hidden' })
}))

const VerticalNavGroup = props => {
  // ** Props
  const {
    item,
    parent,
    settings,
    navHover,
    navVisible,
    isSubToSub,
    groupActive,
    setGroupActive,
    collapsedNavWidth,
    currentActiveGroup,
    setCurrentActiveGroup,
    navigationBorderWidth
  } = props

  // ** Hooks & Vars
  const router = useRouter()
  const currentURL = router.asPath
  const { direction, navCollapsed, verticalNavToggleType } = settings
  const isCollapsed = navCollapsed && !navHover

  // ** Accordion menu group open toggle
  const toggleActiveGroup = (item, parent) => {
    let openGroup = groupActive

    // ** If Group is already open and clicked, close the group
    if (openGroup.includes(item.title)) {
      openGroup.splice(openGroup.indexOf(item.title), 1)

      // If clicked Group has open group children, Also remove those children to close those groups
      if (item.children) {
        removeChildren(item.children, openGroup, currentActiveGroup)
      }
    } else if (parent) {
      // ** If Group clicked is the child of an open group, first remove all the open groups under that parent
      if (parent.children) {
        removeChildren(parent.children, openGroup, currentActiveGroup)
      }

      // ** After removing all the open groups under that parent, add the clicked group to open group array
      if (!openGroup.includes(item.title)) {
        openGroup.push(item.title)
      }
    } else {
      // ** If clicked on another group that is not active or open, create openGroup array from scratch
      openGroup = []

      // ** push Current Active Group To Open Group array
      if (currentActiveGroup.every(elem => groupActive.includes(elem))) {
        openGroup.push(...currentActiveGroup)
      }

      // ** Push current clicked group item to Open Group array
      if (!openGroup.includes(item.title)) {
        openGroup.push(item.title)
      }
    }
    setGroupActive([...openGroup])
  }

  // ** Menu Group Click
  const handleGroupClick = () => {
    const openGroup = groupActive
    if (verticalNavToggleType === 'collapse') {
      if (openGroup.includes(item.title)) {
        openGroup.splice(openGroup.indexOf(item.title), 1)
      } else {
        openGroup.push(item.title)
      }
      setGroupActive([...openGroup])
    } else {
      toggleActiveGroup(item, parent)
    }
  }

  useEffect(() => {
    if (hasActiveChild(item, currentURL)) {
      if (!groupActive.includes(item.title)) groupActive.push(item.title)
    } else {
      const index = groupActive.indexOf(item.title)
      if (index > -1) groupActive.splice(index, 1)
    }
    setGroupActive([...groupActive])
    setCurrentActiveGroup([...groupActive])

    // Empty Active Group When Menu is collapsed and not hovered, to fix issue route change
    if (navCollapsed && !navHover) {
      setGroupActive([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath])

  useEffect(() => {
    if (navCollapsed && !navHover) {
      setGroupActive([])
    }
    if ((navCollapsed && navHover) || (groupActive.length === 0 && !navCollapsed)) {
      setGroupActive([...currentActiveGroup])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navCollapsed, navHover])

  useEffect(() => {
    if (groupActive.length === 0 && !navCollapsed) {
      setGroupActive([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navHover])

  const icon = parent && !item.icon ? themeConfig.navSubItemIcon : item.icon

  const groupButtonContent = (
    <ListItemButton
      className={clsx({
        'Mui-selected': groupActive.includes(item.title) || currentActiveGroup.includes(item.title)
      })}
      sx={{
        py: 1.25,
        width: '100%',
        borderRadius: '8px',
        transition: 'all .15s ease-in-out',
        color: theme => theme.palette.mode === 'dark' ? '#94A3B8' : '#475569',
        px: isCollapsed ? 2 : 3,
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        '&:hover': {
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          color: theme => theme.palette.mode === 'dark' ? '#F8FAFC' : '#0F172A'
        },
        '&.Mui-selected': {
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
          color: theme => theme.palette.mode === 'dark' ? '#818CF8' : '#4F46E5',
          '&:hover': {
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.12)'
          },
          '& .MuiTypography-root': {
            fontWeight: 600,
            color: theme => theme.palette.mode === 'dark' ? '#F8FAFC !important' : '#1E1B4B !important'
          },
          '& .MuiListItemIcon-root': {
            color: theme => theme.palette.mode === 'dark' ? '#818CF8 !important' : '#4F46E5 !important'
          }
        }
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
              ...(parent && item.children ? { fontSize: '0.875rem' } : {})
            }
          }}
        >
          <UserIcon icon={icon} {...(parent && { fontSize: '0.5rem' })} />
        </ListItemIcon>
      )}
      <MenuItemTextWrapper sx={{ ...(isCollapsed ? { opacity: 0, width: 0, display: 'none' } : { opacity: 1 }), ...(isSubToSub ? { ml: 8 } : {}) }}>
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
        <Box
          className='menu-item-meta'
          sx={{
            display: 'flex',
            alignItems: 'center',
            '& svg': {
              transition: 'transform .25s ease-in-out',
              ...(groupActive.includes(item.title) && {
                transform: direction === 'ltr' ? 'rotate(90deg)' : 'rotate(-90deg)'
              })
            }
          }}
        >
          {item.badgeContent ? (
            <Chip
              size='small'
              label={item.badgeContent}
              color={item.badgeColor || 'primary'}
              sx={{ mr: 1.5, '& .MuiChip-label': { px: 2, lineHeight: 1.385, textTransform: 'capitalize' } }}
            />
          ) : null}
          <Icon icon={direction === 'ltr' ? 'mdi:chevron-right' : 'mdi:chevron-left'} fontSize={18} />
        </Box>
      </MenuItemTextWrapper>
    </ListItemButton>
  )

  return (
    <CanViewNavGroup navGroup={item}>
      <Fragment>
        <ListItem
          disablePadding
          className='nav-group'
          onClick={handleGroupClick}
          sx={{
            mt: 0.5,
            flexDirection: 'column',
            transition: 'padding .25s ease-in-out',
            px: isCollapsed ? 1.5 : 2.5
          }}
        >
          {isCollapsed ? (
            <Tooltip title={item.title} placement='right' arrow enterDelay={100}>
              {groupButtonContent}
            </Tooltip>
          ) : (
            groupButtonContent
          )}
          <Collapse
            component='ul'
            onClick={e => e.stopPropagation()}
            in={groupActive.includes(item.title) && !isCollapsed}
            sx={{
              pl: 0,
              width: '100%',
              transition: 'all 0.25s ease-in-out'
            }}
          >
            <VerticalNavItems
              {...props}
              parent={item}
              navVisible={navVisible}
              verticalNavItems={item.children}
              isSubToSub={parent && item.children ? item : undefined}
            />
          </Collapse>
        </ListItem>
      </Fragment>
    </CanViewNavGroup>
  )
}

export default VerticalNavGroup
