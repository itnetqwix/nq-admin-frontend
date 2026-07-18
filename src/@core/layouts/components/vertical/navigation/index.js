// ** React Import
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { createTheme, responsiveFontSizes, styled, ThemeProvider } from '@mui/material/styles'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Theme Config
import themeConfig from 'src/configs/themeConfig'

// ** Component Imports
import Drawer from './Drawer'
import VerticalNavItems from './VerticalNavItems'
import VerticalNavHeader from './VerticalNavHeader'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { hydrateNavFavorites, toggleNavFavorite } from 'src/utils/navFavorites'

// ** Theme Options
import themeOptions from 'src/@core/theme/ThemeOptions'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

function filterNavItems(items, q) {
  if (!q) return items
  const needle = q.trim().toLowerCase()
  if (!needle) return items

  const match = item => {
    const title = String(item.title || item.sectionTitle || '').toLowerCase()
    const path = String(item.path || '').toLowerCase()
    return title.includes(needle) || path.includes(needle)
  }

  const out = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.sectionTitle) {
      continue
    }
    if (item.children) {
      const kids = item.children.filter(match)
      if (kids.length || match(item)) {
        out.push(kids.length ? { ...item, children: kids } : item)
      }
    } else if (match(item)) {
      out.push(item)
    }
  }
  return out
}

function withFavorites(items, favorites) {
  if (!favorites?.length) return items || []
  return [
    { sectionTitle: 'Favorites', auth: false },
    {
      title: 'Pinned',
      icon: 'mdi:star',
      // no action/subject → group visible if any child is
      children: favorites.map(f => ({
        title: f.title,
        path: f.path,
        icon: f.icon || 'mdi:star-outline',
        action: f.action || 'read',
        subject: f.subject,
        favoriteSource: true
      }))
    },
    ...(items || [])
  ]
}

const StyledBoxForShadow = styled(Box)(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out',
  background: `linear-gradient(${theme.palette.background.default} ${
    theme.direction === 'rtl' ? '95%' : '5%'
  },${hexToRGBA(theme.palette.background.default, 0.85)} 30%,${hexToRGBA(
    theme.palette.background.default,
    0.5
  )} 65%,${hexToRGBA(theme.palette.background.default, 0.3)} 75%,transparent)`,
  '&.scrolled': {
    opacity: 1
  }
}))

const Navigation = props => {
  // ** Props
  const { hidden, settings, afterNavMenuContent, beforeNavMenuContent, navMenuContent: userNavMenuContent, verticalNavItems } = props

  const { user } = useAuth()
  const userId = user?._id || user?.id || user?.userId || null

  // ** States
  const [navHover, setNavHover] = useState(false)
  const [groupActive, setGroupActive] = useState([])
  const [currentActiveGroup, setCurrentActiveGroup] = useState([])
  const [navSearch, setNavSearch] = useState('')
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    let cancelled = false
    void hydrateNavFavorites(userId).then(list => {
      if (!cancelled) setFavorites(list)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const onToggleFavorite = useCallback(
    item => {
      setFavorites(toggleNavFavorite(userId, item))
    },
    [userId]
  )

  const navWithFavorites = useMemo(
    () => withFavorites(verticalNavItems || [], favorites),
    [verticalNavItems, favorites]
  )

  const filteredNavItems = useMemo(
    () => filterNavItems(navWithFavorites, navSearch),
    [navWithFavorites, navSearch]
  )

  const favoritePaths = useMemo(() => new Set(favorites.map(f => f.path)), [favorites])

  // ** Ref
  const shadowRef = useRef(null)

  // ** Var
  const { afterVerticalNavMenuContentPosition, beforeVerticalNavMenuContentPosition } = themeConfig
  const { navCollapsed } = settings
  const showSearch = !(navCollapsed && !navHover)

  const navMenuContentProps = {
    ...props,
    verticalNavItems: filteredNavItems,
    navHover,
    groupActive,
    setGroupActive,
    currentActiveGroup,
    setCurrentActiveGroup,
    favoritePaths,
    onToggleFavorite
  }

  // ** Create new theme for the navigation menu when mode is `semi-dark`
  let darkTheme = createTheme(themeOptions(settings, 'dark'))

  // ** Set responsive font sizes to true
  if (themeConfig.responsiveFontSizes) {
    darkTheme = responsiveFontSizes(darkTheme)
  }

  // ** Fixes Navigation InfiniteScroll
  const handleInfiniteScroll = ref => {
    if (ref) {
      // @ts-ignore
      ref._getBoundingClientRect = ref.getBoundingClientRect
      ref.getBoundingClientRect = () => {
        // @ts-ignore
        const original = ref._getBoundingClientRect()

        return { ...original, height: Math.floor(original.height) }
      }
    }
  }

  // ** Scroll Menu
  const scrollMenu = container => {
    if (beforeVerticalNavMenuContentPosition === 'static' || !beforeNavMenuContent) {
      container = hidden ? container.target : container
      if (shadowRef && container.scrollTop > 0) {
        // @ts-ignore
        if (!shadowRef.current.classList.contains('scrolled')) {
          // @ts-ignore
          shadowRef.current.classList.add('scrolled')
        }
      } else {
        // @ts-ignore
        shadowRef.current.classList.remove('scrolled')
      }
    }
  }
  const ScrollWrapper = hidden ? Box : PerfectScrollbar

  return (
    <ThemeProvider theme={darkTheme}>
      <Drawer {...props} navHover={navHover} setNavHover={setNavHover}>
        <VerticalNavHeader {...props} navHover={navHover} />
        {showSearch ? (
          <Box sx={{ px: 3.5, pb: 2, pt: 0.5 }}>
            <TextField
              size='small'
              fullWidth
              placeholder='Search menu…'
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='mdi:magnify' fontSize={18} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 36,
                  borderRadius: '8px',
                  fontSize: 13
                }
              }}
            />
          </Box>
        ) : null}
        {beforeNavMenuContent && beforeVerticalNavMenuContentPosition === 'fixed'
          ? beforeNavMenuContent(navMenuContentProps)
          : null}
        {(beforeVerticalNavMenuContentPosition === 'static' || !beforeNavMenuContent) && (
          <StyledBoxForShadow ref={shadowRef} />
        )}
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {/* @ts-ignore */}
          <ScrollWrapper
            {...(hidden
              ? {
                  onScroll: container => scrollMenu(container),
                  sx: { height: '100%', overflowY: 'auto', overflowX: 'hidden' }
                }
              : {
                  options: { wheelPropagation: false },
                  onScrollY: container => scrollMenu(container),
                  containerRef: ref => handleInfiniteScroll(ref)
                })}
          >
            {beforeNavMenuContent && beforeVerticalNavMenuContentPosition === 'static'
              ? beforeNavMenuContent(navMenuContentProps)
              : null}
            {userNavMenuContent ? (
              userNavMenuContent(navMenuContentProps)
            ) : (
              <List className='nav-items' sx={{ pt: 0, '& > :first-child': { mt: '0' } }}>
                <VerticalNavItems
                  navHover={navHover}
                  groupActive={groupActive}
                  setGroupActive={setGroupActive}
                  currentActiveGroup={currentActiveGroup}
                  setCurrentActiveGroup={setCurrentActiveGroup}
                  {...props}
                  verticalNavItems={filteredNavItems}
                  favoritePaths={favoritePaths}
                  onToggleFavorite={onToggleFavorite}
                />
              </List>
            )}
            {afterNavMenuContent && afterVerticalNavMenuContentPosition === 'static'
              ? afterNavMenuContent(navMenuContentProps)
              : null}
          </ScrollWrapper>
        </Box>
        {afterNavMenuContent && afterVerticalNavMenuContentPosition === 'fixed'
          ? afterNavMenuContent(navMenuContentProps)
          : null}
      </Drawer>
    </ThemeProvider>
  )
}

export default Navigation
