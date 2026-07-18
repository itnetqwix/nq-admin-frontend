import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'
import { useRouter } from 'next/router'
import moment from 'moment'
import toast from 'react-hot-toast'
import Link from 'next/link'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { getOpsEventDetail, getOpsEvents, getOpsStats, resolveOpsEvent, runOpsBackfill } from 'src/services/opsApi'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'

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

const SEVERITIES = ['', 'info', 'warning', 'error', 'critical']
const RESOLUTIONS = ['', 'open', 'investigating', 'resolved', 'wont_fix']

const EVENT_TYPE_PRESETS = [
  {
    key: 'extension_reconcile',
    label: 'Extension reconcile',
    eventType: 'EXTENSION_RECONCILE_ALERT',
    category: 'payment'
  }
]

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

function severitySx(s) {
  if (s === 'critical' || s === 'error') return { bgcolor: ops.errorSoft, color: ops.error }
  if (s === 'warning') return { bgcolor: ops.softAmber, color: '#ab570a' }
  return { bgcolor: ops.canvasSoft2, color: ops.ink }
}

const chipBtnSx = active => ({
  borderRadius: ops.radiusPill,
  textTransform: 'none',
  fontSize: 13,
  fontWeight: active ? 500 : 400,
  px: 1.75,
  py: 0.6,
  minHeight: 32,
  color: active ? ops.onNight : ops.body,
  bgcolor: active ? ops.ink : ops.canvas,
  border: `1px solid ${active ? ops.ink : ops.hairline}`,
  '&:hover': {
    bgcolor: active ? ops.ink : ops.canvasSoft2,
    borderColor: active ? ops.ink : ops.mute
  }
})

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
  const [eventType, setEventType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [stats, setStats] = useState(null)
  const [backfillBusy, setBackfillBusy] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [resolveNote, setResolveNote] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.userId) setUserId(String(router.query.userId))
    if (router.query.sessionId) setSessionId(String(router.query.sessionId))
    if (router.query.severity) setSeverity(String(router.query.severity))
    if (router.query.resolution) setResolution(String(router.query.resolution))
    if (router.query.category) setCategory(String(router.query.category))
    if (router.query.instant_only === 'true') setInstantOnly(true)
    if (router.query.search) setSearch(String(router.query.search))
    if (router.query.event_type) {
      setEventType(String(router.query.event_type))
    } else if (router.query.search === 'EXTENSION_RECONCILE_ALERT') {
      setEventType('EXTENSION_RECONCILE_ALERT')
      setCategory('payment')
      setSearch('')
    }
  }, [
    router.isReady,
    router.query.userId,
    router.query.sessionId,
    router.query.severity,
    router.query.resolution,
    router.query.category,
    router.query.instant_only,
    router.query.search,
    router.query.event_type
  ])

  useEffect(() => {
    void getOpsStats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [page])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = { page: page + 1, limit: pageSize }
      if (category) q.category = category
      if (severity) q.severity = severity
      if (resolution) q.resolution_status = resolution
      if (userId.trim()) q.userId = userId.trim()
      if (sessionId.trim()) q.sessionId = sessionId.trim()
      if (instantOnly) q.instant_only = 'true'
      if (refundRelated) q.refund_related = 'true'
      if (eventType.trim()) q.event_type = eventType.trim()
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
  }, [
    page,
    pageSize,
    category,
    severity,
    resolution,
    userId,
    sessionId,
    instantOnly,
    refundRelated,
    eventType,
    search,
    fromDate,
    toDate
  ])

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

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      height: 40,
      borderRadius: ops.radiusSm,
      fontSize: 13,
      '& fieldset': { borderColor: ops.hairline }
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'at',
        headerName: 'When',
        width: 168,
        renderCell: p => (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {p.value ? formatOpsDateTime(p.value, { withSeconds: false }) : '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
              {p.value ? moment(p.value).fromNow() : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 100,
        renderCell: p => (
          <Chip size='small' label={p.value || '—'} sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, ...severitySx(p.value) }} />
        )
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 120,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }} noWrap>
            {p.value || '—'}
          </Typography>
        )
      },
      {
        field: 'event_type',
        headerName: 'Type',
        width: 180,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
            {p.value || '—'}
          </Typography>
        )
      },
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
              sx={{ textTransform: 'none', minWidth: 0, px: 1 }}
            >
              Open
            </Button>
          ) : (
            <Typography sx={{ color: ops.mute }}>—</Typography>
          )
      },
      { field: 'userLabel', headerName: 'User', width: 160 },
      {
        field: 'resolution_status',
        headerName: 'Status',
        width: 120,
        renderCell: p => (
          <Chip
            size='small'
            label={String(p.value || '—').replace(/_/g, ' ')}
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: p.value === 'open' ? ops.errorSoft : ops.canvasSoft2,
              color: p.value === 'open' ? ops.error : ops.ink
            }}
          />
        )
      }
    ],
    []
  )

  return (
    <AdminPageShell
      bare
      eyebrow='Logs · ops'
      icon='mdi:alert-circle-outline'
      title='Ops / errors.'
      subtitle='Unified issues — instant lessons, calls, wallet, support, admin. Resolve from the drawer.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip component={Link} href='/apps/platform-health' label='Platform health' clickable variant='outlined' size='small' />
          <Chip component={Link} href='/apps/audit-logs' label='Audit trail' clickable variant='outlined' size='small' />
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:alert-octagon-outline'
            label='Critical open (24h)'
            value={fmtInt(stats?.criticalOpen)}
            hint='Filter critical + open'
            tone={(stats?.criticalOpen ?? 0) > 0 ? 'danger' : 'default'}
            onClick={() => {
              setSeverity('critical')
              setResolution('open')
              setPage(0)
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:lightning-bolt-outline'
            label='Instant failures'
            value={fmtInt(stats?.instantFailures)}
            hint='Last 24h'
            tone={(stats?.instantFailures ?? 0) > 0 ? 'warn' : 'default'}
            onClick={() => {
              setInstantOnly(true)
              setPage(0)
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:phone-alert-outline'
            label='Call preflight'
            value={fmtInt(stats?.callPreflightFailures)}
            hint='Last 24h'
            onClick={() => {
              setCategory('call')
              setPage(0)
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:format-list-bulleted' label='In view' value={fmtInt(total)} hint='Matching filters' tone='accent' />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
        <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mb: 1.5 }}>
          {SEVERITIES.map(s => {
            const active = severity === s
            return (
              <Button
                key={s || 'all-sev'}
                onClick={() => {
                  setSeverity(s)
                  setPage(0)
                }}
                sx={chipBtnSx(active)}
              >
                {s || 'All severity'}
              </Button>
            )
          })}
        </Stack>
        <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mb: 1.5 }}>
          {['', ...CATEGORIES].map(c => {
            const active = category === c
            return (
              <Button
                key={c || 'all-cat'}
                onClick={() => {
                  setCategory(c)
                  setPage(0)
                }}
                sx={chipBtnSx(active)}
              >
                {c || 'All categories'}
              </Button>
            )
          })}
        </Stack>
        <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
          {RESOLUTIONS.map(r => {
            const active = resolution === r
            return (
              <Button
                key={r || 'all-res'}
                onClick={() => {
                  setResolution(r)
                  setPage(0)
                }}
                sx={chipBtnSx(active)}
              >
                {r ? r.replace(/_/g, ' ') : 'All status'}
              </Button>
            )
          })}
          <Button
            onClick={() => {
              setInstantOnly(v => !v)
              setPage(0)
            }}
            sx={chipBtnSx(instantOnly)}
          >
            Instant only
          </Button>
          <Button
            onClick={() => {
              setRefundRelated(v => !v)
              setPage(0)
            }}
            sx={chipBtnSx(refundRelated)}
          >
            Refund related
          </Button>
          {EVENT_TYPE_PRESETS.map(preset => {
            const active = eventType === preset.eventType && (!preset.category || category === preset.category)
            return (
              <Button
                key={preset.key}
                onClick={() => {
                  if (active) {
                    setEventType('')
                    if (preset.category) setCategory('')
                  } else {
                    setEventType(preset.eventType)
                    if (preset.category) setCategory(preset.category)
                  }
                  setPage(0)
                }}
                sx={chipBtnSx(active)}
              >
                {preset.label}
              </Button>
            )
          })}
        </Stack>

        <AdminFilterBar
          searchPlaceholder='Search title / summary'
          searchValue={search}
          onSearchChange={e => setSearch(e.target.value)}
          onSearchSubmit={() => {
            setPage(0)
            void load()
          }}
          onRefresh={() => void load()}
          refreshLoading={loading}
          resultCount={total}
          helperText='Chips apply on click. Date / ids need Apply.'
        >
          <TextField
            size='small'
            placeholder='Event type'
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            sx={{ width: { xs: '100%', sm: 200 }, ...fieldSx }}
          />
          <TextField
            size='small'
            placeholder='User id'
            value={userId}
            onChange={e => setUserId(e.target.value)}
            sx={{ width: { xs: '100%', sm: 160 }, ...fieldSx, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], fontFamily: ops.mono, fontSize: 12 } }}
          />
          <TextField
            size='small'
            placeholder='Session id'
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            sx={{ width: { xs: '100%', sm: 160 }, ...fieldSx, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], fontFamily: ops.mono, fontSize: 12 } }}
          />
          <TextField
            size='small'
            type='date'
            label='From'
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            sx={{ width: 150, ...fieldSx }}
          />
          <TextField
            size='small'
            type='date'
            label='To'
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            sx={{ width: 150, ...fieldSx }}
          />
          <Button
            size='small'
            onClick={() => {
              setPage(0)
              void load()
            }}
            sx={{
              height: 40,
              px: 2,
              borderRadius: ops.radiusPill,
              textTransform: 'none',
              bgcolor: ops.indigo,
              color: '#fff',
              '&:hover': { bgcolor: ops.indigoDeep }
            }}
          >
            Apply
          </Button>
          <Button
            size='small'
            variant='outlined'
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
                const n = Object.values(result?.counts || result || {}).reduce((a, b) => a + (Number(b) || 0), 0)
                toast.success(`Backfill complete — ${n} events ingested`)
                void load()
                setStats(await getOpsStats())
              } catch (e) {
                toast.error(e?.message || 'Backfill failed')
              } finally {
                setBackfillBusy(false)
              }
            }}
            sx={{ textTransform: 'none', borderColor: ops.hairline, color: ops.ink }}
          >
            Backfill
          </Button>
        </AdminFilterBar>

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
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: ops.canvasSoft,
                borderBottom: `1px solid ${ops.hairline}`
              },
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                borderBottom: `1px solid ${ops.hairline}`,
                '&:hover': { bgcolor: ops.canvasSoft }
              },
              '& .MuiDataGrid-cell': { border: 'none', py: 1 }
            }}
            emptyMessage='No ops events match'
            emptyDescription='Widen filters or run backfill if the log looks empty.'
          />
        </AdminGridContainer>
      </OpsSurfaceCard>

      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480 },
            p: 3,
            bgcolor: ops.night,
            color: ops.onNight,
            boxShadow: ops.shadowDrawer
          }
        }}
      >
        {detail?.event ? (
          <Stack spacing={2}>
            <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{detail.event.title}</Typography>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Chip size='small' label={detail.event.severity} sx={{ ...severitySx(detail.event.severity), height: 22 }} />
              <Chip
                size='small'
                label={detail.event.category}
                sx={{ height: 22, bgcolor: ops.nightLift, color: ops.onNightMuted, fontFamily: ops.mono, fontSize: 10 }}
              />
              <Chip
                size='small'
                label={detail.event.resolution_status}
                sx={{ height: 22, bgcolor: ops.nightLift, color: ops.lime, fontFamily: ops.mono, fontSize: 10 }}
              />
            </Stack>
            <Typography sx={{ fontSize: 13, color: ops.onNightMuted }}>
              {detail.event.summary || detail.event.event_type}
            </Typography>
            {detail.playbook?.steps?.length ? (
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1, color: ops.lime }}>Resolution playbook</Typography>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {detail.playbook.steps.map((s, i) => (
                    <li key={i}>
                      <Typography sx={{ fontSize: 13, color: ops.onNightMuted }}>{s}</Typography>
                    </li>
                  ))}
                </ol>
              </Box>
            ) : null}
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: ops.lime }}>Suggested actions</Typography>
            <Stack spacing={1}>
              {(detail.event.suggested_actions || []).map(a => (
                <Button
                  key={a.action}
                  component={Link}
                  href={a.href || '#'}
                  size='small'
                  sx={{
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    border: `1px solid ${ops.nightLift}`,
                    color: ops.onNight
                  }}
                >
                  {a.label}
                </Button>
              ))}
            </Stack>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: ops.lime }}>Payload</Typography>
            <Box
              component='pre'
              sx={{
                fontSize: 11,
                fontFamily: ops.mono,
                overflow: 'auto',
                maxHeight: 200,
                bgcolor: ops.nightLift,
                p: 1.5,
                borderRadius: ops.radiusSm,
                color: ops.onNightMuted
              }}
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
              InputLabelProps={{ sx: { color: ops.onNightMuted } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: ops.onNight,
                  '& fieldset': { borderColor: ops.nightLift },
                  '&:hover fieldset': { borderColor: ops.mute }
                },
                '& .MuiInputLabel-root': { color: ops.onNightMuted }
              }}
            />
            <Stack direction='row' spacing={1}>
              <Button
                variant='contained'
                onClick={() => void handleResolve('resolved')}
                sx={{ textTransform: 'none', bgcolor: ops.lime, color: ops.night, '&:hover': { bgcolor: '#b5e03a' } }}
              >
                Mark resolved
              </Button>
              <Button
                onClick={() => void handleResolve('investigating')}
                sx={{ textTransform: 'none', color: ops.onNight, border: `1px solid ${ops.nightLift}` }}
              >
                Investigating
              </Button>
            </Stack>
            {detail.related?.length ? (
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mt: 1, color: ops.lime }}>Related session events</Typography>
                {detail.related.slice(0, 8).map(r => (
                  <Typography key={r._id} sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted, display: 'block' }}>
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
