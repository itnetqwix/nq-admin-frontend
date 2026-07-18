import { Box, Button, Chip, Collapse, Grid, Stack, TextField, Typography } from '@mui/material'
import { AdminDataGrid, AdminFilterBar, AdminGridContainer } from 'src/components/admin'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getCallDiagnostics } from 'src/services/user360Api'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

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
  const [draft, setDraft] = useState({
    sessionId: '',
    userId: '',
    eventType: '',
    from: '',
    to: ''
  })

  useEffect(() => {
    if (!router.isReady) return
    const next = {
      sessionId: router.query.sessionId ? String(router.query.sessionId) : '',
      userId: router.query.userId ? String(router.query.userId) : '',
      eventType: router.query.eventType ? String(router.query.eventType) : '',
      from: router.query.from ? String(router.query.from) : '',
      to: router.query.to ? String(router.query.to) : ''
    }
    setDraft(next)
    setSessionId(next.sessionId)
    setUserId(next.userId)
    setEventType(next.eventType)
    setFrom(next.from)
    setTo(next.to)
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [load])

  const applyFilters = () => {
    setSessionId(draft.sessionId)
    setUserId(draft.userId)
    setEventType(draft.eventType)
    setFrom(draft.from)
    setTo(draft.to)
    void router.replace(
      {
        pathname: '/apps/call-diagnostics',
        query: {
          ...(draft.sessionId ? { sessionId: draft.sessionId } : {}),
          ...(draft.userId ? { userId: draft.userId } : {}),
          ...(draft.eventType ? { eventType: draft.eventType } : {}),
          ...(draft.from ? { from: draft.from } : {}),
          ...(draft.to ? { to: draft.to } : {})
        }
      },
      undefined,
      { shallow: true }
    )
  }

  const clearFilters = () => {
    const empty = { sessionId: '', userId: '', eventType: '', from: '', to: '' }
    setDraft(empty)
    setSessionId('')
    setUserId('')
    setEventType('')
    setFrom('')
    setTo('')
    void router.replace({ pathname: '/apps/call-diagnostics' }, undefined, { shallow: true })
  }

  const preflightFails = useMemo(
    () => rows.filter(r => r.preflightCheck?.passed === false || r.preflight).length,
    [rows]
  )

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 160,
      renderCell: p => (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }}>
          {p.value ? formatOpsDateTime(p.value, { withSeconds: false }) : '—'}
        </Typography>
      )
    },
    {
      field: 'eventType',
      headerName: 'Event',
      width: 180,
      renderCell: p => (
        <Chip
          size='small'
          label={p.value || '—'}
          sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: ops.canvasSoft2 }}
        />
      )
    },
    {
      field: 'sessionId',
      headerName: 'Session',
      width: 200,
      renderCell: p => (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }} noWrap>
          {p.value || '—'}
        </Typography>
      )
    },
    { field: 'userLabel', headerName: 'User', width: 160 },
    { field: 'role', headerName: 'Role', width: 90 },
    {
      field: 'preflight',
      headerName: 'Preflight',
      width: 140,
      renderCell: p =>
        p.value ? (
          <Chip
            size='small'
            label={String(p.value).slice(0, 24)}
            sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: ops.errorSoft, color: ops.error }}
          />
        ) : (
          <Typography sx={{ fontSize: 12, color: ops.mute }}>—</Typography>
        )
    }
  ]

  return (
    <AdminPageShell
      bare
      icon='mdi:phone-in-talk-outline'
      eyebrow='Operations'
      title='Call diagnostics'
      subtitle='Video and session quality events — filter by session, user, event, or dates.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip component={Link} href='/apps/platform-health' label='Platform health' clickable variant='outlined' size='small' />
          <Chip component={Link} href='/apps/ops-logs' label='Ops log' clickable variant='outlined' size='small' />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:phone-in-talk-outline' label='Events' value={fmtInt(rows.length)} hint='In view' tone='accent' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:alert-circle-outline'
            label='Preflight fails'
            value={fmtInt(preflightFails)}
            hint='In current result'
            tone={preflightFails > 0 ? 'warn' : 'success'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:identifier'
            label='Session filter'
            value={sessionId ? 'On' : 'Off'}
            hint={sessionId ? sessionId.slice(0, 8) + '…' : 'Any'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:calendar-range'
            label='Date window'
            value={from || to ? 'Set' : 'All'}
            hint={from && to ? `${from} → ${to}` : from || to || 'No bounds'}
          />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <AdminFilterBar
            onRefresh={() => void load()}
            refreshLoading={loading}
            resultCount={rows.length}
            helperText='Apply commits filters. Click a row to expand the raw payload.'
          >
            <TextField
              size='small'
              label='Session id'
              value={draft.sessionId}
              onChange={e => setDraft(d => ({ ...d, sessionId: e.target.value }))}
              sx={{ minWidth: 160 }}
            />
            <TextField
              size='small'
              label='User id'
              value={draft.userId}
              onChange={e => setDraft(d => ({ ...d, userId: e.target.value }))}
              sx={{ minWidth: 160 }}
            />
            <TextField
              size='small'
              label='Event type'
              placeholder='CLIENT_PRECALL_CHECK'
              value={draft.eventType}
              onChange={e => setDraft(d => ({ ...d, eventType: e.target.value }))}
              sx={{ minWidth: 180 }}
            />
            <TextField
              size='small'
              type='date'
              label='From'
              InputLabelProps={{ shrink: true }}
              value={draft.from}
              onChange={e => setDraft(d => ({ ...d, from: e.target.value }))}
            />
            <TextField
              size='small'
              type='date'
              label='To'
              InputLabelProps={{ shrink: true }}
              value={draft.to}
              onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
            />
            <Button
              size='small'
              variant='contained'
              onClick={applyFilters}
              sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none', height: 40 }}
            >
              Apply
            </Button>
            <Button size='small' variant='outlined' onClick={clearFilters} sx={{ textTransform: 'none', height: 40 }}>
              Clear
            </Button>
          </AdminFilterBar>
          <AdminGridContainer height={{ xs: 420, md: 520 }}>
            <AdminDataGrid
              autoHeight={false}
              rows={rows}
              columns={columns}
              loading={loading}
              clickableRows
              onRowClick={p => setExpandedId(expandedId === p.id ? null : p.id)}
              emptyMessage='No diagnostics match'
              emptyDescription='Widen the date range or clear session / user filters.'
            />
          </AdminGridContainer>
          <Collapse in={!!expandedId}>
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: ops.canvas,
                borderRadius: ops.radiusSm,
                border: `1px solid ${ops.hairline}`
              }}
            >
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1 }}>PAYLOAD</Typography>
              <Box
                component='pre'
                sx={{ fontSize: 11, overflow: 'auto', maxHeight: 240, m: 0, fontFamily: ops.mono }}
              >
                {JSON.stringify(rows.find(r => r.id === expandedId) || {}, null, 2)}
              </Box>
            </Box>
          </Collapse>
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
