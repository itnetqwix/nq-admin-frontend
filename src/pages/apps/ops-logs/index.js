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
import { useRouter } from 'next/router'
import moment from 'moment'
import toast from 'react-hot-toast'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getOpsEventDetail, getOpsEvents, resolveOpsEvent } from 'src/services/opsApi'
import styles from 'styles/common.module.css'

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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [resolveNote, setResolveNote] = useState('')

  useEffect(() => {
    if (router.isReady) {
      if (router.query.userId) setUserId(String(router.query.userId))
      if (router.query.sessionId) setSessionId(String(router.query.sessionId))
    }
  }, [router.isReady, router.query.userId, router.query.sessionId])

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
  }, [page, pageSize, category, severity, resolution, userId, sessionId, instantOnly, refundRelated])

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
        <Button variant='outlined' onClick={() => void load()}>
          Refresh
        </Button>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField size='small' fullWidth label='User id' value={userId} onChange={e => setUserId(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField size='small' fullWidth label='Session id' value={sessionId} onChange={e => setSessionId(e.target.value)} />
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
            getRowClassName={p =>
              p.indexRelativeToCurrentPage % 2 === 0 ? `${styles['even-row']} ${styles['row-class']}` : `${styles['odd-row']} ${styles['row-class']}`
            }
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
    </AdminPageShell>
  )
}
