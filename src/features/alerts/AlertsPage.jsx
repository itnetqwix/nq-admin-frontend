import { useState } from 'react'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminTabs from 'src/components/admin/AdminTabs'
import EntityLink from 'src/components/admin/EntityLink'
import StatusPill from 'src/components/admin/StatusPill'
import { SEVERITY_TONE } from 'src/features/command-center/RecentAlerts'
import { useInvalidateOnAdminEvent } from 'src/hooks/useAdminLive'
import { ackAlert, listAlerts, snoozeAlert } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { ops } from 'src/styles/opsSurface'
import { timeAgo } from 'src/utils/format'
import { alertView, SEVERITY_FILTERS, SNOOZE_OPTIONS, STATUS_TABS, STREAM_FILTERS } from './alertView'

const PAGE_SIZE = 25
const one = v => (Array.isArray(v) ? v[0] : v)

function AlertCard({ alert, onAck, onSnooze, busy }) {
  const [anchor, setAnchor] = useState(null)
  const showActions = alert.status === 'open' || alert.status === 'snoozed'
  return (
    <Box
      sx={{
        p: 1.75,
        bgcolor: ops.canvas,
        borderRadius: ops.radiusMd,
        border: `1px solid ${ops.hairline}`,
        borderLeft: `3px solid ${alert.severity === 'warning' ? ops.warningFg : ops.error}`,
        opacity: alert.status === 'acked' ? 0.7 : 1
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <StatusPill tone={SEVERITY_TONE[alert.severity] || 'neutral'} size='sm'>{alert.severity}</StatusPill>
        <StatusPill tone={alert.stream === 'business' ? 'violet' : 'info'} size='sm'>{alert.streamLabel}</StatusPill>
        {alert.status !== 'open' ? <StatusPill tone='neutral' size='sm'>{alert.status === 'acked' ? 'Acknowledged' : 'Snoozed'}</StatusPill> : null}
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12, color: ops.mute }}>{timeAgo(alert.at)}</Typography>
      </Box>
      <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 600 }}>{alert.title}</Typography>
      {alert.summary ? <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>{alert.summary}</Typography> : null}
      <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
        {alert.sessionId ? <EntityLink type='lesson' id={alert.sessionId}>Open lesson</EntityLink> : null}
        {alert.user ? <EntityLink type='user' id={alert.user.id}>{alert.user.name}</EntityLink> : null}
        {alert.links.map(l => (
          <Box key={l.href} component={NextLink} href={l.href} sx={{ color: ops.link }}>
            {l.label} →
          </Box>
        ))}
        <Box sx={{ flex: 1 }} />
        {showActions ? (
          <>
            <Button size='small' disabled={busy} onClick={e => setAnchor(e.currentTarget)}>Snooze</Button>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
              {SNOOZE_OPTIONS.map(o => (
                <MenuItem key={o.minutes} onClick={() => { setAnchor(null); onSnooze(alert.id, o.minutes) }}>
                  {o.label}
                </MenuItem>
              ))}
            </Menu>
            <Button size='small' variant='outlined' disabled={busy} onClick={() => onAck(alert.id)}>Acknowledge</Button>
          </>
        ) : null}
      </Box>
    </Box>
  )
}

export default function AlertsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const status = STATUS_TABS.some(t => t.value === one(router.query.status)) ? one(router.query.status) : 'open'
  const severity = SEVERITY_FILTERS.some(f => f.value === one(router.query.severity)) ? one(router.query.severity) || '' : ''
  const stream = STREAM_FILTERS.some(f => f.value === one(router.query.stream)) ? one(router.query.stream) || '' : ''
  const page = Math.max(1, Number(one(router.query.page)) || 1)

  const setParam = patch =>
    router.replace({ pathname: router.pathname, query: { ...router.query, page: undefined, ...patch } }, undefined, { shallow: true })

  const filters = { status, severity: severity || undefined, stream: stream || undefined, page, pageSize: PAGE_SIZE }
  const query = useQuery({ queryKey: queryKeys.alerts(filters), queryFn: () => listAlerts(filters), placeholderData: keepPreviousData })
  useInvalidateOnAdminEvent('ADMIN_OPS_EVENT_CREATED', queryKeys.alertsAll, { throttleMs: 2000 })

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.alertsAll })
  const ack = useMutation({
    // Explicit arrow: newer TanStack Query passes a second (context) argument to mutationFn.
    mutationFn: id => ackAlert(id),
    onSuccess: () => { toast.success('Acknowledged'); refresh() },
    onError: e => toast.error(e?.message || 'Could not acknowledge')
  })
  const snooze = useMutation({
    mutationFn: ({ id, minutes }) => snoozeAlert(id, minutes),
    onSuccess: () => { toast.success('Snoozed'); refresh() },
    onError: e => toast.error(e?.message || 'Could not snooze')
  })

  const items = (query.data?.items || []).map(alertView)
  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / PAGE_SIZE))

  return (
    <AdminPageShell
      title='Alerts'
      subtitle='Incidents that need a person: failed payments, disputes, broken calls and stuck jobs. Acknowledging only clears it from your list.'
      actions={<AdminRefreshButton onClick={() => query.refetch()} loading={query.isFetching} />}
    >
      <AdminTabs value={status} // AdminTabs calls onChange(value), not MUI's (event, value).
        onChange={v => setParam({ status: v === 'open' ? undefined : v })} tabs={STATUS_TABS} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
        {SEVERITY_FILTERS.map(f => (
          <Chip key={`s${f.value}`} clickable label={f.label} color={severity === f.value ? 'primary' : 'default'} variant={severity === f.value ? 'filled' : 'outlined'} onClick={() => setParam({ severity: f.value || undefined })} />
        ))}
        <Box sx={{ width: 12 }} />
        {STREAM_FILTERS.map(f => (
          <Chip key={`t${f.value}`} clickable label={f.label} color={stream === f.value ? 'primary' : 'default'} variant={stream === f.value ? 'filled' : 'outlined'} onClick={() => setParam({ stream: f.value || undefined })} />
        ))}
      </Box>

      {query.isError && !query.data ? (
        <AdminEmptyState title='Couldn’t load alerts' description={query.error?.message} actionLabel='Try again' onAction={() => query.refetch()} />
      ) : !items.length && !query.isLoading ? (
        <AdminEmptyState title={status === 'open' ? 'Inbox zero' : 'Nothing here'} description={status === 'open' ? 'No open alerts match these filters.' : 'No alerts in this view.'} />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          {items.map(a => (
            <AlertCard
              key={a.id}
              alert={a}
              busy={ack.isPending || snooze.isPending}
              onAck={id => ack.mutate(id)}
              onSnooze={(id, minutes) => snooze.mutate({ id, minutes })}
            />
          ))}
        </Box>
      )}
      {totalPages > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setParam({ page: p === 1 ? undefined : p })} />
        </Box>
      ) : null}
    </AdminPageShell>
  )
}
