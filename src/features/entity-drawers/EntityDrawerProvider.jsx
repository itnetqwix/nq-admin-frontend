import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import { ops } from 'src/styles/opsSurface'
import { DRAWER_QUERY_KEY, parseDrawerParam, withDrawerQuery } from 'src/lib/drawerParam'
import { EntityDrawerContext } from './EntityDrawerContext'
import { ENTITY_DRAWERS, isKnownDrawerType } from './registry'

/**
 * Mounts once in the layout. The drawer is driven entirely by the `drawer` query param, so it is
 * deep-linkable, survives refresh, and opening one keeps the page's filters in the URL.
 */
export default function EntityDrawerProvider({ children }) {
  const router = useRouter()
  const current = useMemo(() => parseDrawerParam(router.query[DRAWER_QUERY_KEY]), [router.query])

  const go = useCallback(
    (drawer, method) => {
      const query = withDrawerQuery(router.query, drawer)
      return router[method]({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false })
    },
    [router]
  )

  const value = useMemo(
    () => ({
      current,
      open: (type, id) => go({ type, id }, 'push'),
      // Replace, not push: closing should not add a history entry that Back reopens.
      close: () => go(null, 'replace'),
      hrefFor: (type, id) => ({ pathname: router.pathname, query: withDrawerQuery(router.query, { type, id }) })
    }),
    [current, go, router.pathname, router.query]
  )

  const entry = current && isKnownDrawerType(current.type) ? ENTITY_DRAWERS[current.type] : null
  const Body = entry?.Component

  const copyLink = () => {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => toast.success('Link copied'))
      .catch(() => toast.error('Could not copy the link'))
  }

  return (
    <EntityDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor='right'
        open={Boolean(current)}
        onClose={value.close}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, maxWidth: '100%', bgcolor: ops.canvas, backgroundImage: 'none' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1.75, borderBottom: `1px solid ${ops.hairline}` }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
            {entry ? entry.title : 'Details'}
            {current ? (
              <Box component='span' sx={{ ml: 1, fontFamily: ops.mono, fontSize: 12, color: ops.mute, fontWeight: 400 }}>
                {current.id}
              </Box>
            ) : null}
          </Typography>
          <Tooltip title='Copy link'>
            <IconButton size='small' onClick={copyLink} aria-label='Copy link to this view'>
              <Icon icon='mdi:link-variant' fontSize={18} />
            </IconButton>
          </Tooltip>
          <IconButton size='small' onClick={value.close} aria-label='Close'>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          {Body ? (
            <Body id={current.id} />
          ) : current ? (
            <Typography sx={{ color: 'text.secondary' }}>This kind of item can’t be opened here yet.</Typography>
          ) : null}
        </Box>
      </Drawer>
    </EntityDrawerContext.Provider>
  )
}
