import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import navigation from 'src/navigation/navItems'
import { useEntityDrawer } from 'src/features/entity-drawers/EntityDrawerContext'
import useDebouncedValue from 'src/hooks/useDebouncedValue'
import { searchAdmin } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { ops } from 'src/styles/opsSurface'
import { buildPaletteItems, extraPages, moveIndex, pagesFromNav } from './commandPalette'

const GROUP_ICON = {
  People: 'mdi:account-outline',
  'Lessons & payments': 'mdi:video-account',
  Errors: 'mdi:bug-outline',
  'Go to path': 'mdi:subdirectory-arrow-right'
}

/**
 * ⌘K. Type to search people, lessons, payment ids and pages at once; arrows + Enter to open.
 * People and lessons open in the side drawer so you keep your place on the current page.
 */
export default function AdminCommandPalette({ open, onClose }) {
  const router = useRouter()
  const theme = useTheme()
  const ability = useContext(AbilityContext)
  const drawer = useEntityDrawer()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [value, setValue] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef(null)
  const debounced = useDebouncedValue(value.trim(), 250)

  useEffect(() => {
    if (!open) {
      setValue('')
      setActive(0)
    }
  }, [open])

  const can = (action, subject) => (ability ? ability.can(action, subject) : true)
  const pages = useMemo(
    () => [...pagesFromNav(navigation(), can), ...extraPages(can)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ability]
  )

  const wantsSearch = open && debounced.length >= 2 && !debounced.startsWith('/')
  const search = useQuery({
    queryKey: queryKeys.search(debounced),
    queryFn: ({ signal }) => searchAdmin(debounced, signal),
    enabled: wantsSearch,
    staleTime: 30_000,
    retry: false
  })

  const items = useMemo(
    () => buildPaletteItems({ query: value, pages, search: wantsSearch ? search.data : null }),
    [value, pages, search.data, wantsSearch]
  )

  useEffect(() => setActive(0), [value, search.data])
  useEffect(() => {
    // Optional call: not every embedded webview (or jsdom) implements scrollIntoView.
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [active, items])

  const run = item => {
    if (!item) return
    onClose()
    const { action } = item
    if (action.type === 'path') void router.push(action.path)
    else if (action.type === 'drawer') drawer.open(action.drawerType, action.id)
    else if (action.type === 'external') window.open(action.url, '_blank', 'noopener,noreferrer')
  }

  const onKeyDown = e => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setActive(i => moveIndex(i, 1, items.length)))
    else if (e.key === 'ArrowUp') (e.preventDefault(), setActive(i => moveIndex(i, -1, items.length)))
    else if (e.key === 'Enter') (e.preventDefault(), run(items[active]))
  }

  let lastGroup = null
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm' fullScreen={fullScreen} PaperProps={{ sx: { backgroundImage: 'none', alignSelf: 'flex-start', mt: fullScreen ? 0 : '12vh' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: `1px solid ${ops.hairline}` }}>
        <Icon icon='mdi:magnify' fontSize={20} />
        <InputBase
          autoFocus
          fullWidth
          placeholder='Search people, lessons, payment ids, pages…'
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          inputProps={{ 'aria-label': 'Search', role: 'combobox', 'aria-expanded': true, 'aria-controls': 'palette-results' }}
          sx={{ fontSize: 15 }}
        />
        {search.isFetching ? <CircularProgress size={16} /> : null}
        {fullScreen ? (
          <IconButton aria-label='Close' onClick={onClose} edge='end'>
            <Icon icon='mdi:close' />
          </IconButton>
        ) : null}
      </Box>
      <Box id='palette-results' ref={listRef} role='listbox' sx={{ maxHeight: fullScreen ? 'none' : 420, overflowY: 'auto', py: 0.5 }}>
        {items.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null
          lastGroup = item.group
          return (
            <Box key={item.key}>
              {header ? (
                <Typography sx={{ px: 2, pt: 1.25, pb: 0.5, fontFamily: ops.mono, fontSize: 10.5, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {header}
                </Typography>
              ) : null}
              <Box
                role='option'
                aria-selected={i === active}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  cursor: 'pointer',
                  bgcolor: i === active ? ops.canvasSoft2 : 'transparent'
                }}
              >
                <Icon icon={GROUP_ICON[item.group] || 'mdi:file-outline'} fontSize={18} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }} noWrap>{item.label}</Typography>
                  {item.secondary ? <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>{item.secondary}</Typography> : null}
                </Box>
                {i === active ? <Typography sx={{ fontSize: 11, color: ops.mute }}>↵</Typography> : null}
              </Box>
            </Box>
          )
        })}
        {!items.length ? (
          <Typography sx={{ px: 2, py: 3, fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
            {search.isFetching ? 'Searching…' : search.isError ? 'Search is unavailable right now.' : wantsSearch ? 'Nothing found. Try an email, an id, or part of a name.' : 'Type at least two characters.'}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${ops.hairline}`, display: 'flex', gap: 2, fontSize: 11, color: ops.mute }}>
        <span>↑↓ move</span>
        <span>↵ open</span>
        <span>esc close</span>
        <Box sx={{ flex: 1 }} />
        <span>emails · user / booking ids · pi_… · NETQWIX-API-1A · /path</span>
      </Box>
    </Dialog>
  )
}
