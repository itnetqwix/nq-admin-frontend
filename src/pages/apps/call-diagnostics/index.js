import { Box, Button, Collapse, Grid, TextField, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import styles from 'styles/common.module.css'
import { getCallDiagnostics } from 'src/services/user360Api'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'

export default function CallDiagnosticsPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [userId, setUserId] = useState('')
  const [eventType, setEventType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (router.isReady) {
      if (router.query.sessionId) setSessionId(String(router.query.sessionId))
      if (router.query.userId) setUserId(String(router.query.userId))
    }
  }, [router.isReady, router.query.sessionId, router.query.userId])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = { limit: 100, skip: 0 }
      if (sessionId.trim()) q.sessionId = sessionId.trim()
      if (userId.trim()) q.userId = userId.trim()
      if (eventType.trim()) q.eventType = eventType.trim()
      if (from) q.from = new Date(from).toISOString()
      if (to) q.to = new Date(to).toISOString()
      const data = await getCallDiagnostics(q)
      const list = data?.diagnostics || []
      setRows(
        list.map((r, i) => ({
          id: r._id || i,
          ...r,
          userLabel: r.userId?.fullname || r.userId?.email || r.userId || '—',
          preflight: r.preflightCheck?.passed === false ? r.preflightCheck?.reason : '',
          at: r.createdAt
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load diagnostics')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [sessionId, userId, eventType, from, to])

  useEffect(() => {
    void load()
  }, [])

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
    { field: 'preflight', headerName: 'Preflight fail', width: 140, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] }
  ]

  return (
    <AdminPageShell
      title='Call diagnostics'
      subtitle='Video and session quality events. Filter by session, user, event type, or date range.'
      actions={
        <Button variant='contained' onClick={() => void load()}>
          Apply filters
        </Button>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField size='small' fullWidth label='Session id' value={sessionId} onChange={e => setSessionId(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField size='small' fullWidth label='User id' value={userId} onChange={e => setUserId(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              size='small'
              fullWidth
              label='Event type'
              placeholder='CLIENT_PRECALL_CHECK'
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField size='small' fullWidth type='date' label='From' InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField size='small' fullWidth type='date' label='To' InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
          </Grid>
        </Grid>
        <Box className='admin-data-grid' sx={{ height: 480, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            onRowClick={p => setExpandedId(expandedId === p.id ? null : p.id)}
            disableRowSelectionOnClick
          />
        </Box>
        <Collapse in={!!expandedId}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Payload
            </Typography>
            <Box component='pre' sx={{ fontSize: 11, overflow: 'auto', maxHeight: 240, m: 0 }}>
              {JSON.stringify(rows.find(r => r.id === expandedId) || {}, null, 2)}
            </Box>
          </Box>
        </Collapse>
      </AdminPageSection>
    </AdminPageShell>
  )
}
