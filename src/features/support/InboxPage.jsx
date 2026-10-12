import { useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import Icon from 'src/@core/components/icon'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import StatusPill from 'src/components/admin/StatusPill'
import useDebouncedValue from 'src/hooks/useDebouncedValue'
import { useAuth } from 'src/hooks/useAuth'
import { parseDrawerParam } from 'src/lib/drawerParam'
import { getInboxCounts, listInbox } from 'src/services/inboxApi'
import { ops } from 'src/styles/opsSurface'
import { formatInt } from 'src/utils/format'
import InboxDetail from './InboxDetail'
import { ageLabel, QUEUE_VALUES, QUEUES, slaPill, STATUS_TONE, STATUS_LABEL, TYPE_LABEL, TYPES, TYPE_VALUES } from './inboxView'

const PAGE_SIZE = 30
const one = v => (Array.isArray(v) ? v[0] : v)

function Row({ item, selected, onSelect }) {
  const sla = slaPill(item)
  return (
    <Box
      role='button'
      tabIndex={0}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect())}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        borderBottom: `1px solid ${ops.hairline}`,
        bgcolor: selected ? ops.canvasSoft2 : 'transparent',
        borderLeft: `3px solid ${item.priority === 'high' ? ops.error : 'transparent'}`,
        '&:hover': { bgcolor: selected ? ops.canvasSoft2 : ops.canvasSoft },
        '&:focus-visible': { outline: `2px solid ${ops.accent}`, outlineOffset: -2 }
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.25 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>{item.subject}</Typography>
        <Typography sx={{ fontSize: 11, color: ops.mute, whiteSpace: 'nowrap' }}>{ageLabel(item)}</Typography>
      </Box>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }} noWrap>{item.preview || 'No message'}</Typography>
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mt: 0.75, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 11.5, color: ops.mute, mr: 0.5 }}>{item.userName || item.userEmail || 'Unknown'}</Typography>
        <StatusPill tone='neutral' size='sm'>{TYPE_LABEL[item.type]}</StatusPill>
        {item.status !== 'open' ? <StatusPill tone={STATUS_TONE[item.status]} size='sm'>{STATUS_LABEL[item.status]}</StatusPill> : null}
        {sla ? <StatusPill tone={sla.tone} size='sm'>{sla.label}</StatusPill> : null}
        {item.assigneeId ? <Icon icon='mdi:account-check' fontSize={14} /> : null}
      </Box>
    </Box>
  )
}

export default function InboxPage() {
  const router = useRouter()
  const theme = useTheme()
  const wide = useMediaQuery(theme.breakpoints.up('md'))
  const { user } = useAuth()
  const ability = useContext(AbilityContext)
  const canWrite = ability?.can('update', 'admin-nav-support-tickets') ?? true
  const meId = user?._id ?? user?.id

  const queue = QUEUE_VALUES.includes(one(router.query.queue)) ? one(router.query.queue) : 'open'
  const type = TYPE_VALUES.includes(one(router.query.type)) ? one(router.query.type) : ''
  const page = Math.max(1, Number(one(router.query.page)) || 1)
  const selected = parseDrawerParam(one(router.query.item)) // "concern:<id>"
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 300)

  const set = patch => router.replace({ pathname: router.pathname, query: { ...router.query, page: undefined, ...patch } }, undefined, { shallow: true })
  const select = item => router.replace({ pathname: router.pathname, query: { ...router.query, item: `${item.type}:${item.id}` } }, undefined, { shallow: true })
  const clearSelection = () => router.replace({ pathname: router.pathname, query: { ...router.query, item: undefined } }, undefined, { shallow: true })

  const list = useQuery({
    queryKey: ['inbox', 'list', { queue, type, q, page }],
    queryFn: () => listInbox({ queue, type: type || undefined, q: q || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 45_000
  })
  const counts = useQuery({ queryKey: ['inbox', 'counts'], queryFn: getInboxCounts, refetchInterval: 45_000, retry: false })

  const items = list.data?.items || []
  const totalPages = Math.max(1, Math.ceil((list.data?.total || 0) / PAGE_SIZE))
  const countFor = useMemo(() => ({ ...(counts.data || {}) }), [counts.data])

  const listPane = (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <Box sx={{ p: 1.5, display: 'grid', gap: 1, borderBottom: `1px solid ${ops.hairline}` }}>
        <TextField size='small' fullWidth placeholder='Search messages, emails, ids…' value={search} onChange={e => setSearch(e.target.value)} />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <Chip key={t.value || 'all'} size='small' clickable label={t.label} color={type === t.value ? 'primary' : 'default'} variant={type === t.value ? 'filled' : 'outlined'} onClick={() => set({ type: t.value || undefined })} />
          ))}
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {list.isError && !list.data ? (
          <AdminEmptyState title='Couldn’t load the inbox' description={list.error?.message} actionLabel='Try again' onAction={() => list.refetch()} compact />
        ) : !items.length && !list.isLoading ? (
          <AdminEmptyState title={queue === 'open' ? 'Inbox zero' : 'Nothing here'} description={queue === 'open' ? 'No open requests match.' : 'No items in this view.'} compact />
        ) : (
          items.map(i => <Row key={`${i.type}:${i.id}`} item={i} selected={selected?.type === i.type && selected?.id === i.id} onSelect={() => select(i)} />)
        )}
        {list.data?.capped ? <Typography sx={{ p: 1.5, fontSize: 11.5, color: ops.mute }}>Showing the most recent items. Narrow the search to see older ones.</Typography> : null}
      </Box>
      {totalPages > 1 ? (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', borderTop: `1px solid ${ops.hairline}` }}>
          <Pagination size='small' count={totalPages} page={page} onChange={(_, p) => set({ page: p === 1 ? undefined : p })} />
        </Box>
      ) : null}
    </Box>
  )

  const detailPane = selected ? (
    <Box sx={{ p: 2.5 }}>
      {!wide ? (
        <IconButton size='small' onClick={clearSelection} aria-label='Back to the list' sx={{ mb: 1 }}>
          <Icon icon='mdi:arrow-left' fontSize={20} />
        </IconButton>
      ) : null}
      <InboxDetail key={`${selected.type}:${selected.id}`} type={selected.type} id={selected.id} meId={meId} canWrite={canWrite} />
    </Box>
  ) : (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 4 }}>
      <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Pick a request to read it and respond.</Typography>
    </Box>
  )

  return (
    <AdminPageShell
      title='Support inbox'
      subtitle='Support requests, contact forms, product feedback and flagged chat in one place, most urgent first.'
      actions={<AdminRefreshButton onClick={() => { list.refetch(); counts.refetch() }} loading={list.isFetching} />}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: wide ? '210px minmax(300px, 380px) 1fr' : '1fr',
          border: `1px solid ${ops.hairline}`,
          borderRadius: ops.radiusLg,
          bgcolor: ops.canvas,
          overflow: 'hidden',
          height: wide ? 'calc(100vh - 230px)' : 'auto',
          minHeight: 480
        }}
      >
        {wide || !selected ? (
          <Box component='nav' aria-label='Inbox queues' sx={{ p: 1, borderRight: wide ? `1px solid ${ops.hairline}` : 'none', borderBottom: wide ? 'none' : `1px solid ${ops.hairline}`, display: wide ? 'block' : 'flex', gap: 0.5, overflowX: 'auto' }}>
            {QUEUES.map(qu => {
              const n = countFor[qu.value]
              const active = queue === qu.value
              return (
                <Box
                  key={qu.value}
                  component='button'
                  onClick={() => set({ queue: qu.value === 'open' ? undefined : qu.value })}
                  aria-current={active ? 'true' : undefined}
                  sx={{
                    display: 'flex',
                    width: wide ? '100%' : 'auto',
                    flexShrink: 0,
                    alignItems: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 0.9,
                    border: 0,
                    borderRadius: ops.radiusSm,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: 'text.primary',
                    bgcolor: active ? ops.canvasSoft2 : 'transparent',
                    '&:hover': { bgcolor: active ? ops.canvasSoft2 : ops.canvasSoft }
                  }}
                >
                  <Icon icon={qu.icon} fontSize={17} />
                  <Box component='span' sx={{ flex: 1 }}>{qu.label}</Box>
                  {n !== undefined ? (
                    <Box component='span' sx={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: qu.value === 'sla' && n > 0 ? ops.error : ops.mute, fontWeight: qu.value === 'sla' && n > 0 ? 700 : 400 }}>
                      {formatInt(n)}
                    </Box>
                  ) : null}
                </Box>
              )
            })}
          </Box>
        ) : null}
        {wide || !selected ? <Box sx={{ minHeight: 0, borderRight: wide ? `1px solid ${ops.hairline}` : 'none' }}>{listPane}</Box> : null}
        {wide || selected ? <Box sx={{ minHeight: 0, overflowY: 'auto' }}>{detailPane}</Box> : null}
      </Box>
    </AdminPageShell>
  )
}
