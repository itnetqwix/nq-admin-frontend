import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import KpiTile from 'src/components/admin/KpiTile'
import StatusPill from 'src/components/admin/StatusPill'
import { useEntityDrawer } from 'src/features/entity-drawers/EntityDrawerContext'
import LiveLessonsHistoryLink from './HistoryLink'
import { LESSON_STATE } from 'src/features/command-center/LiveNowCard'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { useInvalidateOnAdminEvent } from 'src/hooks/useAdminLive'
import { getLiveOps } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { ops } from 'src/styles/opsSurface'
import { formatInt, timeAgo } from 'src/utils/format'
import { elapsedLabel, filterLessons, STATE_FILTERS, stateCounts } from './filterLessons'

/** Re-render on an interval so "12m" keeps counting without refetching. */
function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

const LAST_EVENT_LABEL = type => (type ? String(type).replace(/_/g, ' ').toLowerCase() : '—')

export default function LiveOpsPage() {
  const router = useRouter()
  const { socketConnected } = useAdminRealtime()
  const drawer = useEntityDrawer()
  const now = useNow()
  const [q, setQ] = useState('')
  const [issuesOnly, setIssuesOnly] = useState(false)
  const [kind, setKind] = useState('all')

  const state = STATE_FILTERS.some(f => f.value === router.query.state) ? router.query.state : 'all'
  const setState = value =>
    router.replace({ pathname: router.pathname, query: { ...router.query, state: value === 'all' ? undefined : value } }, undefined, { shallow: true })

  const query = useQuery({
    queryKey: queryKeys.liveOps,
    queryFn: () => getLiveOps(100),
    placeholderData: keepPreviousData,
    refetchInterval: socketConnected ? 30_000 : 10_000
  })
  useInvalidateOnAdminEvent('ADMIN_LIVE_LESSON_CHANGED', queryKeys.liveOps, { throttleMs: 1000 })

  const lessons = query.data?.lessons || []
  const summary = query.data?.summary
  const counts = useMemo(() => stateCounts(lessons), [lessons])
  const visible = useMemo(() => filterLessons(lessons, { state, q, issuesOnly, kind }), [lessons, state, q, issuesOnly, kind])

  return (
    <AdminPageShell
      title='Live Ops'
      subtitle='Every lesson in progress or about to start. Problems sort to the top.'
      actions={
        <>
          <StatusPill tone={socketConnected ? 'live' : 'warning'} pulse={socketConnected} size='sm'>
            {socketConnected ? 'Live' : 'Polling every 10s'}
          </StatusPill>
          <LiveLessonsHistoryLink />
          <AdminRefreshButton onClick={() => query.refetch()} loading={query.isFetching} />
        </>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}>
          <KpiTile label='Live now' value={formatInt(summary?.live)} loading={!summary} hint='both joined' />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiTile label='Waiting for the other' value={formatInt(summary?.waiting)} loading={!summary} hint='one person in the room' />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiTile label='Late' value={formatInt(summary?.late)} loading={!summary} tone={summary?.late ? 'danger' : undefined} hint='started 5+ min ago, nobody joined' />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiTile label='Call quality alerts' value={formatInt(summary?.withQualityIssues)} loading={!summary} hint={`${formatInt(summary?.noShows24h)} no-shows in 24h`} />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
        {STATE_FILTERS.map(f => (
          <Chip
            key={f.value}
            clickable
            label={`${f.label} · ${counts[f.value] ?? 0}`}
            color={state === f.value ? 'primary' : 'default'}
            variant={state === f.value ? 'filled' : 'outlined'}
            onClick={() => setState(f.value)}
            sx={{ fontWeight: 500 }}
          />
        ))}
        <Box sx={{ flex: 1 }} />
        <TextField size='small' select label='Type' value={kind} onChange={e => setKind(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value='all'>All lessons</MenuItem>
          <MenuItem value='scheduled'>Scheduled</MenuItem>
          <MenuItem value='instant'>Instant</MenuItem>
        </TextField>
        <TextField size='small' label='Search coach, trainee or id' value={q} onChange={e => setQ(e.target.value)} sx={{ minWidth: 220 }} />
        <FormControlLabel control={<Switch size='small' checked={issuesOnly} onChange={e => setIssuesOnly(e.target.checked)} />} label='Call issues only' />
      </Box>

      {query.isError && !query.data ? (
        <AdminEmptyState title='Couldn’t load lessons' description={query.error?.message} actionLabel='Try again' onAction={() => query.refetch()} />
      ) : !visible.length ? (
        <AdminEmptyState
          title={lessons.length ? 'No lessons match these filters' : 'No lessons right now'}
          description={lessons.length ? 'Clear a filter to see more.' : 'Nothing is in progress or starting in the next 30 minutes.'}
        />
      ) : (
        <TableContainer sx={{ bgcolor: ops.canvas, borderRadius: ops.radiusLg, border: `1px solid ${ops.hairline}` }}>
          <Table size='small' aria-label='Lessons in progress'>
            <TableHead>
              <TableRow>
                {['Status', 'Coach', 'Trainee', 'Time', 'Type', 'Call quality', 'Last event'].map(h => (
                  <TableCell key={h} sx={{ fontFamily: ops.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: ops.mute }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map(l => {
                const st = LESSON_STATE[l.state] || LESSON_STATE.upcoming
                const open = () => drawer.open('lesson', l.sessionId)
                return (
                  <TableRow
                    key={l.sessionId}
                    hover
                    tabIndex={0}
                    role='button'
                    onClick={open}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
                    sx={{ cursor: 'pointer', '&:focus-visible': { outline: `2px solid ${ops.accent}`, outlineOffset: -2 } }}
                  >
                    <TableCell><StatusPill tone={st.tone} pulse={st.pulse} size='sm'>{st.label}</StatusPill></TableCell>
                    <TableCell>{l.trainer?.name || '—'}</TableCell>
                    <TableCell>{l.trainee?.name || '—'}</TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {l.state === 'live' ? `${elapsedLabel(l.startedAt, now)} in` : l.state === 'waiting' ? `waiting ${elapsedLabel(l.firstJoinedAt, now)}` : l.state === 'late' ? `${elapsedLabel(l.startsAt, now)} late` : elapsedLabel(l.startsAt, now)}
                    </TableCell>
                    <TableCell>{l.isInstant ? <StatusPill tone='violet' size='sm'>Instant</StatusPill> : 'Scheduled'}</TableCell>
                    <TableCell>
                      {l.lowQualityEvents30m > 0 ? (
                        <StatusPill tone='warning' size='sm'>{l.lowQualityEvents30m} alerts</StatusPill>
                      ) : l.state === 'live' ? (
                        <Typography sx={{ fontSize: 12, color: ops.successFg }}>No alerts</Typography>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: ops.mute }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                      {LAST_EVENT_LABEL(l.lastEventType)}
                      {l.lastEventAt ? ` · ${timeAgo(l.lastEventAt, now)}` : ''}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography sx={{ mt: 1.5, fontSize: 12, color: ops.mute }}>
        Showing {visible.length} of {lessons.length}. Click a row for the journey, call quality, errors and money.{' '}
        <Box component={NextLink} href='/apps/live-lessons/history' sx={{ color: ops.link }}>Past lessons →</Box>
      </Typography>
    </AdminPageShell>
  )
}
