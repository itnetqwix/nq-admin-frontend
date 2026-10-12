import { useState } from 'react'
import { useRouter } from 'next/router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Pagination from '@mui/material/Pagination'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import ChartCard from 'src/components/admin/charts/ChartCard'
import KpiTile from 'src/components/admin/KpiTile'
import StatusPill from 'src/components/admin/StatusPill'
import useDebouncedValue from 'src/hooks/useDebouncedValue'
import { getDeliveryStats, listDeliveries } from 'src/services/deliveryApi'
import { ops } from 'src/styles/opsSurface'
import { formatInt, timeAgo } from 'src/utils/format'
import { CHANNEL_LABEL, CHANNEL_VALUES, CHANNELS, channelTile, RANGES, recipientLabel, STATUS_FILTERS } from './deliveryView'

const PAGE_SIZE = 30
const one = v => (Array.isArray(v) ? v[0] : v)

export default function DeliveryPage() {
  const router = useRouter()
  const channel = CHANNEL_VALUES.includes(one(router.query.channel)) ? one(router.query.channel) : ''
  const status = ['sent', 'failed'].includes(one(router.query.status)) ? one(router.query.status) : ''
  const hours = RANGES.some(r => String(r.value) === one(router.query.hours)) ? Number(one(router.query.hours)) : 24
  const page = Math.max(1, Number(one(router.query.page)) || 1)
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 300)

  const set = patch => router.replace({ pathname: router.pathname, query: { ...router.query, page: undefined, ...patch } }, undefined, { shallow: true })

  const stats = useQuery({ queryKey: ['delivery', 'stats', hours], queryFn: () => getDeliveryStats(hours), placeholderData: keepPreviousData, refetchInterval: 60_000 })
  const list = useQuery({
    queryKey: ['delivery', 'list', { channel, status, q, page }],
    queryFn: () => listDeliveries({ channel: channel || undefined, status: status || undefined, q: q || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000
  })

  const rows = list.data?.items || []
  const totalPages = Math.max(1, Math.ceil((list.data?.total || 0) / PAGE_SIZE))

  return (
    <AdminPageShell
      title='Delivery log'
      subtitle='Every email, text and WhatsApp message the platform tried to send, and whether it went through. Recipients are masked; message contents are never stored.'
      actions={
        <>
          <ToggleButtonGroup size='small' exclusive value={hours} onChange={(_, v) => v && set({ hours: v })} aria-label='Time range'>
            {RANGES.map(r => (
              <ToggleButton key={r.value} value={r.value} sx={{ px: 1.5, textTransform: 'none' }}>{r.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <AdminRefreshButton onClick={() => { list.refetch(); stats.refetch() }} loading={list.isFetching} />
        </>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {(stats.data?.channels || []).filter(c => c.channel !== 'push' || c.total > 0).map(c => {
          const t = channelTile(c)
          return (
            <Grid item xs={6} md={3} key={t.key}>
              <Box sx={{ position: 'relative', height: '100%' }}>
                <KpiTile label={`${t.label} sent`} value={t.value} hint={t.hint} />
                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                  <StatusPill tone={t.health.tone} size='sm'>{t.health.label}</StatusPill>
                </Box>
              </Box>
            </Grid>
          )
        })}
      </Grid>

      {stats.data?.topErrors?.length ? (
        <Box sx={{ mb: 2.5 }}>
          <ChartCard title='Most common failures' subtitle={`Last ${RANGES.find(r => r.value === hours)?.label}`}>
            <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
              {stats.data.topErrors.map(e => (
                <li key={`${e.channel}:${e.error}`}>
                  <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'baseline' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>{formatInt(e.count)}</Typography>
                    <StatusPill tone='neutral' size='sm'>{CHANNEL_LABEL[e.channel] || e.channel}</StatusPill>
                    <Typography sx={{ fontSize: 13 }}>{e.error}</Typography>
                  </Box>
                </li>
              ))}
            </Box>
          </ChartCard>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        {CHANNELS.map(c => (
          <Chip key={c.value || 'all'} clickable label={c.label} color={channel === c.value ? 'primary' : 'default'} variant={channel === c.value ? 'filled' : 'outlined'} onClick={() => set({ channel: c.value || undefined })} />
        ))}
        <Box sx={{ width: 8 }} />
        {STATUS_FILTERS.map(s => (
          <Chip key={s.value || 'any'} clickable size='small' label={s.label} color={status === s.value ? 'primary' : 'default'} variant={status === s.value ? 'filled' : 'outlined'} onClick={() => set({ status: s.value || undefined })} />
        ))}
        <Box sx={{ flex: 1 }} />
        <TextField size='small' label='Exact email / phone, or subject' value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 280 }} />
      </Box>

      {list.isError && !list.data ? (
        <AdminEmptyState title='Couldn’t load the delivery log' description={list.error?.message} actionLabel='Try again' onAction={() => list.refetch()} />
      ) : !rows.length && !list.isLoading ? (
        <AdminEmptyState
          title='No messages found'
          description={q ? 'To find what one person received, type their exact email address or phone number.' : 'Nothing has been sent that matches these filters.'}
        />
      ) : (
        <TableContainer sx={{ bgcolor: ops.canvas, borderRadius: ops.radiusLg, border: `1px solid ${ops.hairline}` }}>
          <Table size='small' aria-label='Delivery log'>
            <TableHead>
              <TableRow>
                {['Result', 'Channel', 'To', 'Subject', 'Detail', 'When'].map(h => (
                  <TableCell key={h} sx={{ fontFamily: ops.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: ops.mute }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r._id}>
                  <TableCell><StatusPill tone={r.status === 'sent' ? 'success' : 'danger'} size='sm'>{r.status === 'sent' ? 'Sent' : 'Failed'}</StatusPill></TableCell>
                  <TableCell>{CHANNEL_LABEL[r.channel] || r.channel}</TableCell>
                  <TableCell sx={{ fontFamily: ops.mono, fontSize: 12 }}>{recipientLabel(r)}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}><Typography sx={{ fontSize: 13 }} noWrap title={r.subject}>{r.subject || '—'}</Typography></TableCell>
                  <TableCell sx={{ maxWidth: 280, color: r.error ? ops.dangerFg : 'text.secondary', fontSize: 12 }}>
                    <Typography sx={{ fontSize: 12 }} noWrap title={r.error || r.provider_message_id}>{r.error || r.provider_message_id || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: 12 }} title={new Date(r.createdAt).toLocaleString()}>{timeAgo(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {totalPages > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => set({ page: p === 1 ? undefined : p })} />
        </Box>
      ) : null}
    </AdminPageShell>
  )
}
