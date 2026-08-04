import { Box, Button, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
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
  { value: 'CLIENT_CLIP_PLAYBACK', label: 'Clip play/pause' }
]

export default function CallDiagnosticsPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [userId, setUserId] = useState('')
  const [eventType, setEventType] = useState('')
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
      const q = { limit: pageSize, skip: 0 }
      if (sessionId.trim()) q.sessionId = sessionId.trim()
      if (userId.trim()) q.userId = userId.trim()
      if (eventType.trim()) q.eventType = eventType.trim()
      const data = await getCallDiagnostics(q)
      const list = data?.diagnostics || []
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
          clipAction: r.clipPlayback?.action || '—'
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load diagnostics')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [sessionId, userId, eventType, pageSize])

  useEffect(() => {
    if (!router.isReady) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, router.isReady])

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 170,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm:ss') : '')
    },
    { field: 'eventType', headerName: 'Event', width: 180, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'sessionId', headerName: 'Session', width: 220, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'userLabel', headerName: 'User', width: 180, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'role', headerName: 'Role', width: 90, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'score', headerName: 'Score', width: 90, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'rtt', headerName: 'RTT', width: 90, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'preflight', headerName: 'Preflight', width: 120, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'clipAction', headerName: 'Clip action', width: 120, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] }
  ]

  return (
    <AdminPageShell
      title='Call diagnostics'
      subtitle='Preflight → env → in-call quality. Playbook: docs/REALTIME_CALL_DIAGNOSTICS.md (backend + admin).'
      actions={
        <Button variant='contained' onClick={() => void load()}>
          Apply filters
        </Button>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          Bad call: filter by session id → check preflight fail reasons first, then quality score / RTT / relay. If admin
          realtime chip is disconnected under multi-PM2, Redis adapter may be off — see playbook.
        </Typography>
        <ObservabilityLinks sessionId={sessionId.trim() || undefined} userId={userId.trim() || undefined} />
        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
          <Grid item xs={12} md={4}>
            <TextField size='small' fullWidth label='Session id' value={sessionId} onChange={e => setSessionId(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField size='small' fullWidth label='User id' value={userId} onChange={e => setUserId(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              size='small'
              fullWidth
              label='Event type'
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            >
              {EVENT_TYPES.map(o => (
                <MenuItem key={o.value || 'all'} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Box className='admin-data-grid' sx={{ height: 560, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[25, 50]}
            paginationModel={{ page: 0, pageSize }}
            onPaginationModelChange={m => {
              setPageSize(m.pageSize)
            }}
            disableRowSelectionOnClick
          />
        </Box>
      </AdminPageSection>
    </AdminPageShell>
  )
}
