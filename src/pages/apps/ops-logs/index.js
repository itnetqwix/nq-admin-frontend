import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'
import { useRouter } from 'next/router'
import moment from 'moment'
import toast from 'react-hot-toast'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getOpsEventDetail, getOpsEvents, getOpsStats, resolveOpsEvent, runOpsBackfill } from 'src/services/opsApi'

const CATEGORIES = [
  'instant_lesson',
  'call',
  'connection',
  'wallet',
  'payment',
  'support',
  'system',
  'admin'
]

const severityColor = s => {
  if (s === 'critical') return 'error'
  if (s === 'error') return 'error'
  if (s === 'warning') return 'warning'
  return 'default'
}

export default function OpsLogsPage() {
  const router = useRouter()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('')
  const [resolution, setResolution] = useState('')
  const [userId, setUserId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [instantOnly, setInstantOnly] = useState(false)
  const [refundRelated, setRefundRelated] = useState(false)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [stats, setStats] = useState(null)
  const [backfillBusy, setBackfillBusy] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [resolveNote, setResolveNote] = useState('')

  useEffect(() => {
    if (router.isReady) {
      if (router.query.userId) setUserId(String(router.query.userId))
      if (router.query.sessionId) setSessionId(String(router.query.sessionId))
      if (router.query.severity) setSeverity(String(router.query.severity))
      if (router.query.resolution) setResolution(String(router.query.resolution))
      if (router.query.category) setCategory(String(router.query.category))
      if (router.query.instant_only === 'true') setInstantOnly(true)
      if (router.query.search) setSearch(String(router.query.search))
    }
  }, [
    router.isReady,
    router.query.userId,
    router.query.sessionId,
    router.query.severity,
    router.query.resolution,
    router.query.category,
    router.query.instant_only,
    router.query.search
  ])

  useEffect(() => {
    void getOpsStats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [page])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = {
        page: page + 1,
        limit: pageSize
      }
      if (category) q.category = category
      if (severity) q.severity = severity
      if (resolution) q.resolution_status = resolution
      if (userId.trim()) q.userId = userId.trim()
      if (sessionId.trim()) q.sessionId = sessionId.trim()
      if (instantOnly) q.instant_only = 'true'
      if (refundRelated) q.refund_related = 'true'
      if (search.trim()) q.search = search.trim()
      if (fromDate) q.from = new Date(fromDate).toISOString()
      if (toDate) q.to = new Date(`${toDate}T23:59:59`).toISOString()
      const data = await getOpsEvents(q)
      setRows(
        (data?.items || []).map((r, i) => ({
          id: r._id || r.event_id || i,
          ...r,
          userLabel: r.user_id?.fullname || r.user_id?.email || r.user_id || '—',
          at: r.createdAt
        }))
      )
      setTotal(data?.total ?? 0)
    } catch (e) {
      toast.error(e?.message || 'Failed to load ops logs')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, category, severity, resolution, userId, sessionId, instantOnly, refundRelated, search, fromDate, toDate])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async row => {
    try {
      const d = await getOpsEventDetail(row.event_id || row.id)
      setDetail(d)
      setResolveNote('')
      setDrawerOpen(true)
    } catch (e) {
      toast.error(e?.message || 'Failed to load event')
    }
  }

  const handleResolve = async status => {
    if (!detail?.event) return
    const ok = await confirm({
      title: status === 'resolved' ? 'Mark event resolved?' : 'Update resolution status?',
      message: 'This updates the ops event status for the support and engineering trail.',
      detail: detail.event.title || detail.event.event_type,
      confirmLabel: status === 'resolved' ? 'Resolve' : 'Update',
      variant: status === 'wont_fix' ? 'danger' : 'warning'
    })
    if (!ok) return
    try {
      await resolveOpsEvent(detail.event.event_id || detail.event._id, {
        resolution_status: status,
        resolution_note: resolveNote
      })
      toast.success('Updated')
      setDrawerOpen(false)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Resolve failed')
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'at',
        headerName: 'When',
        width: 170,
        valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
      },
      { field: 'severity', headerName: 'Severity', width: 100 },
      { field: 'category', headerName: 'Category', width: 120 },
      { field: 'event_type', headerName: 'Type', width: 180 },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
      {
        field: 'session_id',
        headerName: 'Session',
        width: 100,
        renderCell: params =>
          params.row.session_id ? (
            <Button
              size='small'
              component={Link}
              href={`/apps/booking?bookingId=${params.row.session_id}`}
              onClick={e => e.stopPropagation()}
            >
              Open
            </Button>
          ) : (
            '—'
          )
      },
      { field: 'userLabel', headerName: 'User', width: 160 },
      { field: 'resolution_status', headerName: 'Status', width: 110 }
    ],
    []
  )

  return (
    <AdminPageShell
      title='Operations log'
      subtitle='Unified issues: instant lessons, calls, wallet, support, and admin actions.'
      actions={
        <Stack direction='row' spacing={1}>
          <Button
            size='small'
            variant='outlined'
            component={Link}
            href='/apps/platform-health'
          >
            Platform health
          </Button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        {stats ? (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Chip
                label={`Critical open (24h): ${stats.criticalOpen ?? 0}`}
                color={(stats.criticalOpen ?? 0) > 0 ? 'error' : 'default'}
                variant='outlined'
                onClick={() => {
                  setSeverity('critical')
                  setResolution('open')
                  setPage(0)
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Chip
                label={`Instant failures (24h): ${stats.instantFailures ?? 0}`}
                variant='outlined'
                onClick={() => {
                  setInstantOnly(true)
                  setPage(0)
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Chip
                label={`Call preflight failures (24h): ${stats.callPreflightFailures ?? 0}`}
                variant='outlined'
                onClick={() => {
                  setCategory('call')
                  setPage(0)
                }}
              />
            </Grid>
          </Grid>
        ) : null}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              size='small'
              fullWidth
              label='Search title / summary'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField size='small' fullWidth label='User id' value={userId} onChange={e => setUserId(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField size='small' fullWidth label='Session id' value={sessionId} onChange={e => setSessionId(e.target.value)} />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size='small'
              fullWidth
              type='date'
              label='From'
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size='small'
              fullWidth
              type='date'
              label='To'
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size='small' fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label='Category' value={category} onChange={e => setCategory(e.target.value)}>
                <MenuItem value=''>All</MenuItem>
                {CATEGORIES.map(c => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size='small' fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select label='Severity' value={severity} onChange={e => setSeverity(e.target.value)}>
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='info'>info</MenuItem>
                <MenuItem value='warning'>warning</MenuItem>
                <MenuItem value='error'>error</MenuItem>
                <MenuItem value='critical'>critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size='small' fullWidth>
              <InputLabel>Resolution</InputLabel>
              <Select label='Resolution' value={resolution} onChange={e => setResolution(e.target.value)}>
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='open'>open</MenuItem>
                <MenuItem value='investigating'>investigating</MenuItem>
                <MenuItem value='resolved'>resolved</MenuItem>
                <MenuItem value='wont_fix'>wont_fix</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Stack direction='row' spacing={1} flexWrap='wrap'>
              <Chip
                label='Instant only'
                color={instantOnly ? 'primary' : 'default'}
                onClick={() => setInstantOnly(v => !v)}
                variant={instantOnly ? 'filled' : 'outlined'}
              />
              <Chip
                label='Refund related'
                color={refundRelated ? 'primary' : 'default'}
                onClick={() => setRefundRelated(v => !v)}
                variant={refundRelated ? 'filled' : 'outlined'}
              />
              <Button variant='contained' size='small' onClick={() => { setPage(0); void load() }}>
                Apply
              </Button>
              <Button
                variant='outlined'
                size='small'
                disabled={backfillBusy}
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Run ops backfill?',
                    message: 'Re-scans recent sessions and wallet events into the ops log. Safe to run; may take a minute.',
                    confirmLabel: 'Run backfill',
                    variant: 'warning'
                  })
                  if (!ok) return
                  setBackfillBusy(true)
                  try {
                    const result = await runOpsBackfill({ limit: 500 })
                    const total = Object.values(result?.counts || result || {}).reduce(
                      (a, b) => a + (Number(b) || 0),
                      0
                    )
                    toast.success(`Backfill complete — ${total} events ingested`)
                    void load()
                    const s = await getOpsStats()
                    setStats(s)
                  } catch (e) {
                    toast.error(e?.message || 'Backfill failed')
                  } finally {
                    setBackfillBusy(false)
                  }
                }}
              >
                Backfill
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <AdminGridContainer>
          <AdminDataGrid
            autoHeight={false}
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
            onRowClick={p => void openDetail(p.row)}
            clickableRows
          />
        </AdminGridContainer>
      </AdminPageSection>

      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}>
        {detail?.event ? (
          <Stack spacing={2}>
            <Typography variant='h6'>{detail.event.title}</Typography>
            <Stack direction='row' spacing={1}>
              <Chip size='small' label={detail.event.severity} color={severityColor(detail.event.severity)} />
              <Chip size='small' label={detail.event.category} />
              <Chip size='small' label={detail.event.resolution_status} />
            </Stack>
            <Typography variant='body2' color='text.secondary'>
              {detail.event.summary || detail.event.event_type}
            </Typography>
            {detail.playbook?.steps?.length ? (
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Resolution playbook
                </Typography>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {detail.playbook.steps.map((s, i) => (
                    <li key={i}>
                      <Typography variant='body2'>{s}</Typography>
                    </li>
                  ))}
                </ol>
              </Box>
            ) : null}
            <Typography variant='subtitle2'>Suggested actions</Typography>
            <Stack spacing={1}>
              {(detail.event.suggested_actions || []).map(a => (
                <Button key={a.action} component={Link} href={a.href || '#'} variant='outlined' size='small'>
                  {a.label}
                </Button>
              ))}
            </Stack>
            <Typography variant='subtitle2'>Payload</Typography>
            <Box
              component='pre'
              sx={{ fontSize: 11, overflow: 'auto', maxHeight: 200, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}
            >
              {JSON.stringify(detail.event.payload, null, 2)}
            </Box>
            <TextField
              size='small'
              fullWidth
              multiline
              minRows={2}
              label='Resolution note'
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
            />
            <Stack direction='row' spacing={1}>
              <Button variant='contained' onClick={() => void handleResolve('resolved')}>
                Mark resolved
              </Button>
              <Button variant='outlined' onClick={() => void handleResolve('investigating')}>
                Investigating
              </Button>
            </Stack>
            {detail.related?.length ? (
              <Box>
                <Typography variant='subtitle2' sx={{ mt: 2 }}>
                  Related session events
                </Typography>
                {detail.related.slice(0, 8).map(r => (
                  <Typography key={r._id} variant='caption' display='block'>
                    {moment(r.createdAt).format('HH:mm')} — {r.title}
                  </Typography>
                ))}
              </Box>
            ) : null}
          </Stack>
        ) : null}
      </Drawer>
      {ConfirmDialog}
    </AdminPageShell>
  )
}
