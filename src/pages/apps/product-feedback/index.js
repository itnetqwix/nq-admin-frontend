import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  Link as MuiLink,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  OpsMetricTile,
  OpsSurfaceCard
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import { fetchAdminList } from 'src/services/adminListApi'
import { patchFeedbackStatus } from 'src/services/supportApi'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

const STATUS_OPTIONS = [
  { v: 'open', l: 'Open', color: 'green' },
  { v: 'reviewed', l: 'Reviewed', color: '#5c6bc0' },
  { v: 'closed', l: 'Closed', color: '#9e9e9e' }
]
const TYPE_OPTIONS = [
  { v: 'issue', l: 'Issue', color: '#e53935' },
  { v: 'idea', l: 'Idea', color: '#f9a825' },
  { v: 'praise', l: 'Praise', color: '#43a047' },
  { v: 'other', l: 'Other', color: '#757575' }
]
const PLATFORM_OPTIONS = [
  { v: 'web', l: 'Web' },
  { v: 'ios', l: 'iOS' },
  { v: 'android', l: 'Android' }
]

function FilterChips({ options, value, onChange, anyLabel }) {
  return [{ v: '', l: anyLabel }, ...options].map(o => (
    <Chip
      key={o.v || 'any'}
      size='small'
      clickable
      label={o.l}
      onClick={() => onChange(o.v)}
      sx={{
        height: 28,
        fontFamily: ops.mono,
        fontSize: 11,
        bgcolor: value === o.v ? ops.softIndigo : ops.canvas,
        color: value === o.v ? ops.indigoDeep : ops.body,
        border: `1px solid ${value === o.v ? ops.indigo : ops.hairline}`
      }}
    />
  ))
}

function StatusSelect({ row, onUpdated }) {
  const [status, setStatus] = useState(row.ticket_status || 'open')
  const [busy, setBusy] = useState(false)
  const color = STATUS_OPTIONS.find(o => o.v === status)?.color || 'green'

  const change = async next => {
    const prev = status
    setStatus(next)
    setBusy(true)
    try {
      await patchFeedbackStatus(row._id, next)
      onUpdated?.()
    } catch (e) {
      setStatus(prev)
      toast.error(e?.message || 'Could not update feedback')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Select
      size='small'
      value={status}
      disabled={busy}
      onChange={e => void change(e.target.value)}
      sx={{ minWidth: 120, height: 34, color: 'white', bgcolor: color, fontSize: 13 }}
    >
      {STATUS_OPTIONS.map(o => (
        <MenuItem key={o.v} value={o.v} sx={{ color: o.color }}>
          {o.l}
        </MenuItem>
      ))}
    </Select>
  )
}

export default function ProductFeedback() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({ status: '', type: '', platform: '' })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const searchTimer = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminList('/admin/feedback', { page, limit, search, ...filters })
      setItems(data.items)
      setTotal(data.total)
      setCounts(data.counts)
    } catch (e) {
      toast.error(e?.message || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, filters])

  useEffect(() => {
    void load()
  }, [load])

  const scheduleSearch = value => {
    setSearchInput(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(value.trim())
      setPage(1)
    }, 400)
  }

  const setFilter = key => value => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  const byStatus = counts?.by_status || {}
  const byType = counts?.by_type || {}
  const allTotal = Object.values(byStatus).reduce((a, b) => a + b, 0)

  const columns = [
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: p => {
        const t = TYPE_OPTIONS.find(o => o.v === p.row.type)
        return (
          <Chip
            size='small'
            label={t?.l || p.row.type}
            sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, color: 'white', bgcolor: t?.color || '#757575' }}
          />
        )
      }
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 2,
      minWidth: 240,
      sortable: false,
      renderCell: p => (
        <Tooltip title={<span style={{ whiteSpace: 'pre-wrap' }}>{p.row.message}</span>} placement='bottom-start'>
          <Typography sx={{ fontSize: 12, color: ops.body, whiteSpace: 'normal', lineHeight: 1.35 }}>
            {p.row.message?.length > 180 ? `${p.row.message.slice(0, 180)}…` : p.row.message}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'from',
      headerName: 'From',
      flex: 1,
      minWidth: 170,
      sortable: false,
      renderCell: p => {
        if (!p.row.user_id) {
          return <Typography sx={{ fontSize: 12, color: ops.mute, fontStyle: 'italic' }}>Anonymous</Typography>
        }
        return (
          <Stack sx={{ minWidth: 0 }}>
            <MuiLink component={Link} href={`/apps/users/${p.row.user_id}`} sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
              {p.row.user_info?.fullname || 'User'}
            </MuiLink>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
              {p.row.user_info?.email || '—'}
            </Typography>
          </Stack>
        )
      }
    },
    {
      field: 'platform',
      headerName: 'Platform',
      width: 110,
      renderCell: p => (
        <Stack sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12 }}>
            {PLATFORM_OPTIONS.find(o => o.v === p.row.platform)?.l || p.row.platform}
          </Typography>
          {p.row.app_version ? (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>v{p.row.app_version}</Typography>
          ) : null}
        </Stack>
      )
    },
    {
      field: 'page_url',
      headerName: 'Page',
      flex: 0.9,
      minWidth: 140,
      sortable: false,
      renderCell: p => {
        const url = p.row.page_url
        if (!url) return '—'
        let label = url
        try {
          const u = new URL(url)
          label = u.protocol.startsWith('http') ? u.pathname + u.search : url
        } catch {}
        return (
          <Tooltip title={url}>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }} noWrap>
              {label}
            </Typography>
          </Tooltip>
        )
      }
    },
    {
      field: 'screenshot',
      headerName: 'Screenshot',
      width: 110,
      sortable: false,
      renderCell: p =>
        p.row.screenshot_url ? (
          <Box
            component='img'
            src={p.row.screenshot_url}
            alt='Feedback screenshot'
            onClick={() => setPreview(p.row.screenshot_url)}
            sx={{
              width: 72,
              height: 48,
              objectFit: 'cover',
              borderRadius: 1,
              border: `1px solid ${ops.hairline}`,
              cursor: 'zoom-in'
            }}
          />
        ) : (
          '—'
        )
    },
    {
      field: 'createdAt',
      headerName: 'Received',
      width: 150,
      renderCell: p => (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }}>
          {p.row.createdAt ? new Date(p.row.createdAt).toLocaleString() : '—'}
        </Typography>
      )
    },
    {
      field: 'ticket_status',
      headerName: 'Status',
      width: 150,
      renderCell: p => <StatusSelect key={`${p.row._id}:${p.row.ticket_status}`} row={p.row} onUpdated={load} />
    }
  ]

  return (
    <AdminPageShell
      bare
      icon='mdi:message-draw'
      eyebrow='Operations'
      title='Product feedback'
      subtitle='Issues, ideas, and praise from the website feedback tab and the app Settings sheet.'
      actions={
        <Chip component={Link} href='/apps/write-by-user' label='Contact-us tickets' clickable variant='outlined' size='small' />
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:inbox-outline' label='Total' value={fmtInt(allTotal)} hint='All feedback' tone='accent' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:alert-circle-outline'
            label='Open'
            value={fmtInt(byStatus.open)}
            hint='Waiting for review'
            tone={(byStatus.open || 0) > 0 ? 'warn' : 'success'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:bug-outline' label='Issues' value={fmtInt(byType.issue)} hint='All time' tone='danger' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:lightbulb-on-outline'
            label='Ideas / praise'
            value={`${fmtInt(byType.idea)} / ${fmtInt(byType.praise)}`}
            hint='All time'
          />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Message, page, user name or email…'
            searchValue={searchInput}
            onSearchChange={e => scheduleSearch(e.target.value)}
            onRefresh={() => void load()}
            resultCount={total}
            helperText='Newest first. Click a screenshot to enlarge; update status inline.'
          >
            <FilterChips options={STATUS_OPTIONS} value={filters.status} onChange={setFilter('status')} anyLabel='Any status' />
            <FilterChips options={TYPE_OPTIONS} value={filters.type} onChange={setFilter('type')} anyLabel='Any type' />
            <FilterChips
              options={PLATFORM_OPTIONS}
              value={filters.platform}
              onChange={setFilter('platform')}
              anyLabel='Any platform'
            />
          </AdminFilterBar>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={items}
              columns={columns}
              loading={loading}
              getRowHeight={() => 72}
              emptyMessage='No feedback yet'
              paginationMode='server'
              rowCount={total}
              paginationModel={{ page: page - 1, pageSize: limit }}
              onPaginationModelChange={m => {
                setPage(m.page + 1)
                setLimit(m.pageSize)
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </AdminGridContainer>
        </AdminPageSection>
      </OpsSurfaceCard>

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth='lg'>
        <DialogContent sx={{ p: 1 }}>
          {preview ? (
            <Box component='img' src={preview} alt='Feedback screenshot' sx={{ maxWidth: '100%', maxHeight: '85vh', display: 'block' }} />
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
