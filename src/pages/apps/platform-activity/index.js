import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Grid, Stack, TextField, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import Link from 'next/link'
import moment from 'moment'
import toast from 'react-hot-toast'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import LogDetailDrawer from 'src/components/admin/LogDetailDrawer'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { getPlatformActivity } from 'src/services/user360Api'
import { CATEGORY_META, categoryChipSx, actionTone, ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'

const CATEGORIES = Object.keys(CATEGORY_META)
const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export default function PlatformActivityPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({})
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [userId, setUserId] = useState('')
  const [ipFilter, setIpFilter] = useState('')
  const [pathFilter, setPathFilter] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('')
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.category) setCategory(String(router.query.category))
    if (router.query.userId) setUserId(String(router.query.userId))
    if (router.query.search) setSearch(String(router.query.search))
    if (router.query.from) setFromDate(String(router.query.from))
    if (router.query.to) setToDate(String(router.query.to))
    if (router.query.ip) setIpFilter(String(router.query.ip))
    if (router.query.path) setPathFilter(String(router.query.path))
    if (router.query.device) setDeviceFilter(String(router.query.device))
  }, [
    router.isReady,
    router.query.category,
    router.query.userId,
    router.query.search,
    router.query.from,
    router.query.to,
    router.query.ip,
    router.query.path,
    router.query.device
  ])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlatformActivity({
        page: page + 1,
        limit: pageSize,
        category: category === 'all' ? undefined : category,
        search: search.trim() || undefined,
        userId: userId.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        ip: ipFilter.trim() || undefined,
        path: pathFilter.trim() || undefined,
        device: deviceFilter.trim() || undefined
      })
      const items = data?.items || []
      setRows(items.map((r, i) => ({ id: r.id || `row-${i}`, ...r })))
      setTotal(data?.pagination?.total ?? items.length)
      setCounts(data?.counts || {})
    } catch (e) {
      toast.error(e?.message || 'Failed to load platform activity')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, category, search, userId, fromDate, toDate, ipFilter, pathFilter, deviceFilter])

  useEffect(() => {
    void load()
  }, [load])

  const exportCsv = () => {
    const cols = [
      'at',
      'category',
      'action',
      'title',
      'fullname',
      'email',
      'account_type',
      'user_id',
      'target_label',
      'target_email',
      'target_account_type',
      'target_id',
      'entity_type',
      'entity_id',
      'ip',
      'country',
      'region',
      'city',
      'timezone',
      'locale',
      'device',
      'browser',
      'browser_version',
      'os',
      'os_version',
      'platform',
      'client_type',
      'device_id',
      'app_version',
      'screen',
      'network_type',
      'user_agent',
      'session_public_id',
      'session_id',
      'method',
      'path',
      'status',
      'duration_ms',
      'request_id',
      'environment_label',
      'amount',
      'source'
    ]
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [
      cols.join(','),
      ...rows.map(r =>
        [
          r.at,
          r.category,
          r.action,
          esc(r.title),
          esc(r.actor?.fullname),
          esc(r.actor?.email),
          r.actor?.account_type || '',
          r.actor?.id || '',
          esc(r.target?.label || r.target?.fullname),
          esc(r.target?.email),
          r.target?.account_type || '',
          r.target?.id || '',
          r.entity?.type || '',
          r.entity?.id || '',
          r.ip || '',
          r.country || '',
          r.region || '',
          r.city || '',
          r.timezone || '',
          r.locale || '',
          esc(r.device),
          r.browser || '',
          r.browser_version || '',
          r.os || '',
          r.os_version || '',
          r.platform || '',
          r.client_type || '',
          r.device_id || '',
          r.app_version || '',
          r.screen || '',
          r.network_type || '',
          esc(r.user_agent),
          r.session_public_id || '',
          r.session_id || '',
          r.method || '',
          r.path || '',
          r.status_code ?? '',
          r.duration_ms ?? '',
          r.request_id || '',
          esc(r.environment_label),
          r.meta?.amount || '',
          r.source || ''
        ].join(',')
      )
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `platform-activity-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const applyCategory = next => {
    setCategory(next)
    setPage(0)
    const q = { ...router.query }
    if (next === 'all') delete q.category
    else q.category = next
    void router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true })
  }

  const monoHeader = label => (
    <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase' }}>
      {label}
    </Typography>
  )

  const muteLine = (text, opts = {}) =>
    text ? (
      <Typography
        sx={{
          fontFamily: ops.mono,
          fontSize: 10,
          color: ops.mute,
          lineHeight: 1.35,
          whiteSpace: opts.wrap ? 'normal' : 'nowrap',
          wordBreak: opts.wrap ? 'break-all' : 'normal'
        }}
        title={typeof text === 'string' ? text : undefined}
      >
        {text}
      </Typography>
    ) : null

  const columns = useMemo(
    () => [
      {
        field: 'at',
        headerName: 'When',
        width: 178,
        renderHeader: () => monoHeader('When'),
        renderCell: p => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.body, fontVariantNumeric: 'tabular-nums' }}>
              {p.value ? formatOpsDateTime(p.value, { withSeconds: true }) : '—'}
            </Typography>
            {muteLine(p.value ? moment(p.value).fromNow() : '')}
            {muteLine(p.row.timezone || '')}
          </Box>
        )
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 132,
        renderHeader: () => monoHeader('Category'),
        renderCell: p => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Chip size='small' label={CATEGORY_META[p.value]?.label || p.value} sx={categoryChipSx(p.value)} />
            {muteLine(p.row.source || '')}
          </Box>
        )
      },
      {
        field: 'title',
        headerName: 'Action',
        flex: 1.4,
        minWidth: 240,
        renderHeader: () => monoHeader('Action'),
        renderCell: p => {
          const r = p.row
          const apiLine =
            r.method || r.path
              ? [r.method, r.path, r.status_code != null ? `HTTP ${r.status_code}` : null, r.duration_ms != null ? `${r.duration_ms}ms` : null]
                  .filter(Boolean)
                  .join(' ')
              : ''
          const entityLine = r.entity?.type || r.entity?.id ? `${r.entity.type || 'entity'}:${r.entity.id || '—'}` : ''
          const amountLine = r.meta?.amount ? `Amount · ${r.meta.amount}` : r.meta?.reason ? `Reason · ${r.meta.reason}` : ''
          return (
            <Box sx={{ minWidth: 0, py: 0.5 }}>
              <Typography
                sx={{ fontSize: 14, fontWeight: 500, color: actionTone(r.action), letterSpacing: '-0.28px', whiteSpace: 'normal' }}
              >
                {r.title || '—'}
              </Typography>
              {muteLine(r.action)}
              {muteLine(apiLine, { wrap: true })}
              {muteLine(entityLine)}
              {muteLine(amountLine)}
              {muteLine(r.request_id ? `req · ${r.request_id}` : '')}
            </Box>
          )
        }
      },
      {
        field: 'actorLabel',
        headerName: 'Who',
        width: 210,
        valueGetter: params =>
          params.row.actor?.fullname || params.row.actor?.label || params.row.actor?.email || '—',
        renderHeader: () => monoHeader('Who'),
        renderCell: p => {
          const a = p.row.actor || {}
          const name = a.fullname || a.label || '—'
          const body = (
            <Box sx={{ minWidth: 0, py: 0.5 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: a.id ? ops.indigo : ops.body,
                  display: 'block',
                  ...(a.id
                    ? { textDecoration: 'none', '&:hover': { color: ops.indigoDeep } }
                    : {})
                }}
                noWrap
              >
                {name}
              </Typography>
              {muteLine(a.email || '')}
              {muteLine([a.account_type, a.id].filter(Boolean).join(' · '))}
            </Box>
          )
          return a.id ? (
            <Box
              component={Link}
              href={`/apps/users/${a.id}`}
              sx={{ textDecoration: 'none', color: 'inherit', display: 'block', minWidth: 0 }}
            >
              {body}
            </Box>
          ) : (
            body
          )
        }
      },
      {
        field: 'targetLabel',
        headerName: 'Target',
        width: 200,
        valueGetter: params =>
          params.row.target?.label || params.row.target?.fullname || params.row.target?.email || '—',
        renderHeader: () => monoHeader('Target'),
        renderCell: p => {
          const t = p.row.target || {}
          const label = t.label || t.fullname || t.email || '—'
          const body = (
            <Box sx={{ minWidth: 0, py: 0.5 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  color: t.id ? ops.link : ops.body,
                  fontFamily: String(label).includes('@') ? ops.mono : 'inherit'
                }}
                noWrap
              >
                {label}
              </Typography>
              {muteLine(t.email && t.email !== label ? t.email : '')}
              {muteLine([t.account_type, t.id].filter(Boolean).join(' · '))}
              {muteLine(
                p.row.entity?.type || p.row.entity?.id
                  ? `${p.row.entity.type || 'entity'}:${p.row.entity.id || '—'}`
                  : ''
              )}
            </Box>
          )
          return t.id ? (
            <Box
              component={Link}
              href={`/apps/users/${t.id}`}
              sx={{ textDecoration: 'none', color: 'inherit', display: 'block', minWidth: 0 }}
            >
              {body}
            </Box>
          ) : (
            body
          )
        }
      },
      {
        field: 'ip',
        headerName: 'IP',
        width: 148,
        renderHeader: () => monoHeader('IP'),
        renderCell: p => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.body }} noWrap>
              {p.row.ip || '—'}
            </Typography>
            {muteLine(p.row.session_public_id ? `session · ${p.row.session_public_id}` : '')}
            {muteLine(p.row.network_type || '')}
          </Box>
        )
      },
      {
        field: 'location',
        headerName: 'Location',
        width: 180,
        valueGetter: params =>
          [params.row.city, params.row.region, params.row.country].filter(Boolean).join(', ') || '—',
        renderHeader: () => monoHeader('Location'),
        renderCell: p => {
          const r = p.row
          const primary = [r.city, r.region, r.country].filter(Boolean).join(', ') || '—'
          return (
            <Box sx={{ minWidth: 0, py: 0.5 }}>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body, whiteSpace: 'normal' }}>
                {primary}
              </Typography>
              {muteLine([r.timezone, r.locale].filter(Boolean).join(' · '))}
              {muteLine(r.entry_path ? `entry · ${r.entry_path}` : '')}
              {muteLine(r.referrer ? `ref · ${r.referrer}` : '', { wrap: true })}
            </Box>
          )
        }
      },
      {
        field: 'device',
        headerName: 'Device',
        width: 220,
        renderHeader: () => monoHeader('Device'),
        renderCell: p => {
          const r = p.row
          const browser = [r.browser, r.browser_version].filter(Boolean).join(' ')
          const os = [r.os, r.os_version].filter(Boolean).join(' ')
          const primary = r.device || browser || os || r.platform || '—'
          return (
            <Box sx={{ minWidth: 0, py: 0.5 }}>
              <Typography sx={{ fontSize: 12, color: ops.ink, fontWeight: 500, whiteSpace: 'normal' }}>
                {primary}
              </Typography>
              {muteLine([browser && primary !== browser ? browser : null, os].filter(Boolean).join(' · '))}
              {muteLine(
                [r.platform, r.client_type, r.app_version ? `v${r.app_version}` : null, r.screen]
                  .filter(Boolean)
                  .join(' · ')
              )}
              {muteLine(r.device_id ? `device_id · ${r.device_id}` : '')}
              {muteLine(r.environment_label || '', { wrap: true })}
              {muteLine(r.user_agent || '', { wrap: true })}
            </Box>
          )
        }
      }
    ],
    []
  )

  return (
    <AdminPageShell
      bare
      eyebrow='Logs · platform'
      icon='mdi:timeline-text-outline'
      title={
        <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          Platform activity.
          <Box
            component='span'
            sx={{
              px: 1,
              py: 0.15,
              bgcolor: ops.lime,
              color: ops.night,
              borderRadius: '4px',
              fontFamily: ops.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em'
            }}
          >
            LIVE
          </Box>
        </Box>
      }
      subtitle='Who did what, when — logins, uploads, bookings, invites, referrals, transactions, admin actions, and authenticated API hits (IP · device · path). Filters sync to the URL.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
          <Button
            onClick={exportCsv}
            disabled={!rows.length}
            sx={{
              bgcolor: ops.ink,
              color: '#fff',
              borderRadius: ops.radiusSm,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: 14,
              px: 1.5,
              height: 32,
              '&:hover': { bgcolor: '#000' },
              '&.Mui-disabled': { bgcolor: ops.hairline, color: ops.mute }
            }}
          >
            Export CSV
          </Button>
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3} md={2}>
          <OpsMetricTile
            icon='mdi:timeline-text-outline'
            label='Events'
            value={fmtInt(total)}
            hint={category === 'all' ? 'All categories' : CATEGORY_META[category]?.label || category}
            tone='accent'
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <OpsMetricTile
            icon='mdi:login'
            label='Logins'
            value={fmtInt(counts.logins)}
            hint='Facet'
            onClick={() => applyCategory('logins')}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <OpsMetricTile
            icon='mdi:api'
            label='API hits'
            value={fmtInt(counts.api)}
            hint='Facet'
            onClick={() => applyCategory('api')}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <OpsMetricTile
            icon='mdi:calendar-check'
            label='Bookings'
            value={fmtInt(counts.booking)}
            hint='Facet'
            onClick={() => applyCategory('booking')}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <OpsMetricTile
            icon='mdi:cash'
            label='Transactions'
            value={fmtInt(counts.transactions)}
            hint='Facet'
            onClick={() => applyCategory('transactions')}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <OpsMetricTile
            icon='mdi:shield-account'
            label='Admin'
            value={fmtInt(counts.admin)}
            hint='Facet'
            onClick={() => applyCategory('admin')}
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          bgcolor: ops.canvas,
          borderRadius: ops.radiusLg,
          boxShadow: ops.shadowCard,
          overflow: 'hidden'
        }}
      >
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${ops.hairline}` }}>
            <Stack
              direction='row'
              spacing={0.75}
              flexWrap='wrap'
              useFlexGap
              sx={{ mb: 2.5, pb: 0.5, overflowX: 'auto', '&::-webkit-scrollbar': { height: 4 } }}
            >
              {CATEGORIES.map(key => {
                const active = category === key
                const count = key === 'all' ? total : counts[key]
                return (
                  <Button
                    key={key}
                    onClick={() => applyCategory(key)}
                    sx={{
                      borderRadius: ops.radiusPill,
                      textTransform: 'none',
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      px: 2,
                      py: 0.75,
                      minHeight: 36,
                      color: active ? ops.onNight : ops.body,
                      bgcolor: active ? ops.ink : ops.canvas,
                      border: `1px solid ${active ? ops.ink : ops.hairline}`,
                      '&:hover': {
                        bgcolor: active ? ops.ink : ops.canvasSoft2,
                        borderColor: active ? ops.ink : ops.mute
                      }
                    }}
                  >
                    {CATEGORY_META[key].label}
                    {typeof count === 'number' ? (
                      <Box
                        component='span'
                        sx={{
                          ml: 0.75,
                          fontFamily: ops.mono,
                          fontSize: 11,
                          color: active ? ops.lime : ops.mute,
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {count}
                      </Box>
                    ) : null}
                  </Button>
                )
              })}
            </Stack>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ md: 'center' }}
              flexWrap='wrap'
              useFlexGap
            >
              <TextField
                size='small'
                placeholder='Search actor, action, email, id…'
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setPage(0)
                    void load()
                  }
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 280 },
                  maxWidth: 360,
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: ops.radiusSm,
                    fontSize: 14,
                    '& fieldset': { borderColor: ops.hairline }
                  }
                }}
              />
              <TextField
                size='small'
                placeholder='User id'
                value={userId}
                onChange={e => setUserId(e.target.value)}
                sx={{
                  width: { xs: '100%', sm: 200 },
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: ops.radiusSm,
                    fontFamily: ops.mono,
                    fontSize: 12,
                    '& fieldset': { borderColor: ops.hairline }
                  }
                }}
              />
              <TextField
                size='small'
                placeholder='IP address'
                value={ipFilter}
                onChange={e => setIpFilter(e.target.value)}
                sx={{
                  width: { xs: '100%', sm: 140 },
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: ops.radiusSm,
                    fontFamily: ops.mono,
                    fontSize: 12,
                    '& fieldset': { borderColor: ops.hairline }
                  }
                }}
              />
              <TextField
                size='small'
                placeholder='API path'
                value={pathFilter}
                onChange={e => setPathFilter(e.target.value)}
                sx={{
                  width: { xs: '100%', sm: 160 },
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: ops.radiusSm,
                    fontFamily: ops.mono,
                    fontSize: 12,
                    '& fieldset': { borderColor: ops.hairline }
                  }
                }}
              />
              <TextField
                size='small'
                placeholder='Device'
                value={deviceFilter}
                onChange={e => setDeviceFilter(e.target.value)}
                sx={{
                  width: { xs: '100%', sm: 140 },
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: ops.radiusSm,
                    fontFamily: ops.mono,
                    fontSize: 12,
                    '& fieldset': { borderColor: ops.hairline }
                  }
                }}
              />
              <TextField
                size='small'
                type='date'
                label='From'
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                sx={{
                  width: 160,
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: ops.radiusSm,
                    fontFamily: ops.mono,
                    fontSize: 12,
                    '& fieldset': { borderColor: ops.hairline }
                  }
                }}
              />
              <TextField
                size='small'
                type='date'
                label='To'
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                sx={{
                  width: 160,
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: ops.radiusSm,
                    fontFamily: ops.mono,
                    fontSize: 12,
                    '& fieldset': { borderColor: ops.hairline }
                  }
                }}
              />
              <Button
                onClick={() => {
                  setPage(0)
                  const q = { ...router.query }
                  if (search.trim()) q.search = search.trim()
                  else delete q.search
                  if (userId.trim()) q.userId = userId.trim()
                  else delete q.userId
                  if (ipFilter.trim()) q.ip = ipFilter.trim()
                  else delete q.ip
                  if (pathFilter.trim()) q.path = pathFilter.trim()
                  else delete q.path
                  if (deviceFilter.trim()) q.device = deviceFilter.trim()
                  else delete q.device
                  if (fromDate) q.from = fromDate
                  else delete q.from
                  if (toDate) q.to = toDate
                  else delete q.to
                  if (category && category !== 'all') q.category = category
                  else delete q.category
                  void router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true })
                  void load()
                }}
                sx={{
                  height: 40,
                  px: 2,
                  borderRadius: '9999px',
                  textTransform: 'none',
                  fontWeight: 500,
                  bgcolor: ops.indigo,
                  color: '#fff',
                  '&:hover': { bgcolor: ops.indigoDeep }
                }}
              >
                Apply filters
              </Button>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute, ml: { md: 'auto' } }}>
                {total.toLocaleString()} events
              </Typography>
            </Stack>
          </Box>

          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              getRowHeight={() => 'auto'}
              rows={rows}
              columns={columns}
              loading={loading}
              paginationMode='server'
              rowCount={total}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={m => {
                setPage(m.page)
                setPageSize(m.pageSize)
              }}
              onRowClick={params => setDetail(params.row)}
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
                '& .MuiDataGrid-cell': {
                  border: 'none',
                  py: 1.25,
                  alignItems: 'flex-start',
                  whiteSpace: 'normal',
                  lineHeight: 1.35
                }
              }}
              emptyMessage='No activity in this view'
              emptyDescription='Widen the date range, clear filters, or switch category.'
              onEmptyAction={() => {
                setSearch('')
                setUserId('')
                setIpFilter('')
                setPathFilter('')
                setDeviceFilter('')
                setFromDate('')
                setToDate('')
                setCategory('all')
                setPage(0)
              }}
              emptyActionLabel='Clear filters'
            />
          </AdminGridContainer>
        </Box>

      <LogDetailDrawer
        open={Boolean(detail)}
        row={detail}
        onClose={() => setDetail(null)}
        kind='activity'
      />
    </AdminPageShell>
  )
}
