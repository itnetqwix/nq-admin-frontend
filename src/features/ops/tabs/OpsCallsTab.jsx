import { Box, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import styles from 'styles/common.module.css'
import { getCallDiagnostics } from 'src/services/user360Api'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ObservabilityLinks from 'src/layouts/components/ObservabilityLinks'

const EVENT_TYPES = [
  { value: '', label: 'All events' },
  { value: 'CLIENT_PRECALL_CHECK', label: 'Preflight check' },
  { value: 'CLIENT_CALL_DIAGNOSTICS', label: 'Client env' },
  { value: 'CALL_QUALITY_STATS', label: 'In-call quality' },
  { value: 'CLIENT_CLIP_PLAYBACK', label: 'Clip play/pause' },
  { value: 'CLIENT_LESSON_ACTION', label: 'Mute / stream / draw / plan' }
]

export default function OpsCallsTab({ hub = false, refreshTick = 0 }) {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [sessionId, setSessionId] = useState('')
  const [userId, setUserId] = useState('')
  const [eventType, setEventType] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    if (q.sessionId) setSessionId(String(Array.isArray(q.sessionId) ? q.sessionId[0] : q.sessionId))
    if (q.userId) setUserId(String(Array.isArray(q.userId) ? q.userId[0] : q.userId))
    if (q.eventType) setEventType(String(Array.isArray(q.eventType) ? q.eventType[0] : q.eventType))
  }, [router.isReady, router.query])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = { limit: pageSize, skip: page * pageSize }
      if (sessionId.trim()) q.sessionId = sessionId.trim()
      if (userId.trim()) q.userId = userId.trim()
      if (eventType.trim()) q.eventType = eventType.trim()
      const data = await getCallDiagnostics(q)
      const list = data?.diagnostics || []
      setTotal(data?.total ?? list.length)
      setRows(
        list.map((r, i) => ({
          id: r._id || i,
          at: r.createdAt,
          eventType: r.eventType || '—',
          sessionId: r.sessionId?._id || r.sessionId || '—',
          userLabel: r.userId?.fullname || r.userId?.email || r.userId || '—',
          role: r.role || r.accountType || '—',
          score: r.qualityStats?.overallScore ?? '—',
          rtt: r.qualityStats?.rtt ?? r.env?.rtt ?? '—',
          preflight: r.preflightCheck?.passed == null
            ? '—'
            : r.preflightCheck.passed
              ? 'pass'
              : r.preflightCheck.reason || 'fail',
          clipAction: r.clipPlayback?.action || r.lessonAction?.action || '—'
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load diagnostics')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [sessionId, userId, eventType, page, pageSize])

  useEffect(() => {
    if (!router.isReady) return
    void load()
  }, [load, router.isReady, refreshTick])

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 160,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'eventType', headerName: 'Event', width: 180 },
    { field: 'userLabel', headerName: 'User', width: 160 },
    { field: 'role', headerName: 'Role', width: 90 },
    { field: 'score', headerName: 'Score', width: 70 },
    { field: 'rtt', headerName: 'RTT', width: 70 },
    { field: 'preflight', headerName: 'Preflight', width: 100 },
    { field: 'clipAction', headerName: 'Action', width: 120 },
    {
      field: 'sessionId',
      headerName: 'Session',
      width: 120,
      renderCell: params =>
        params.value && params.value !== '—' ? (
          <Button size='small' component={Link} href={`/apps/booking?bookingId=${params.value}`} sx={{ textTransform: 'none' }}>
            Open
          </Button>
        ) : (
          '—'
        )
    }
  ]

  const body = (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField size='small' fullWidth label='Session id' value={sessionId} onChange={e => { setSessionId(e.target.value); setPage(0) }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField size='small' fullWidth label='User id' value={userId} onChange={e => { setUserId(e.target.value); setPage(0) }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select size='small' fullWidth label='Event type' value={eventType} onChange={e => { setEventType(e.target.value); setPage(0) }}>
            {EVENT_TYPES.map(o => (
              <MenuItem key={o.value || 'all'} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <Stack direction='row' spacing={1} sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <Button variant='contained' size='small' onClick={() => void load()} disabled={loading}>
          Apply filters
        </Button>
        <Button size='small' component={Link} href='/apps/live-lessons'>
          Live lessons →
        </Button>
        {!hub ? <ObservabilityLinks userId={userId} sessionId={sessionId} /> : null}
      </Stack>
      <div className={styles.tableWrap}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode='server'
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={m => {
            setPage(m.page)
            setPageSize(m.pageSize)
          }}
          pageSizeOptions={[25, 50]}
          disableRowSelectionOnClick
        />
      </div>
    </>
  )

  if (hub) return body

  return (
    <AdminPageShell title='Call diagnostics' subtitle='Preflight, quality stats, and in-lesson client events.'>
      <AdminPageSection>{body}</AdminPageSection>
    </AdminPageShell>
  )
}
