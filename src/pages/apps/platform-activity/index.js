import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useRouter } from 'next/router'
import Link from 'next/link'
import moment from 'moment'
import toast from 'react-hot-toast'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { getPlatformActivity } from 'src/services/user360Api'
import { CATEGORY_META, categoryChipSx, actionTone, ops } from 'src/styles/opsSurface'

const CATEGORIES = Object.keys(CATEGORY_META)

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
  const [metaOpen, setMetaOpen] = useState(true)

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
      'actor',
      'target',
      'entity',
      'ip',
      'device',
      'method',
      'path',
      'status',
      'source'
    ]
    const lines = [
      cols.join(','),
      ...rows.map(r =>
        [
          r.at,
          r.category,
          r.action,
          `"${String(r.title || '').replace(/"/g, '""')}"`,
          `"${String(r.actor?.label || '').replace(/"/g, '""')}"`,
          `"${String(r.target?.label || '').replace(/"/g, '""')}"`,
          r.entity ? `${r.entity.type}:${r.entity.id}` : '',
          r.ip || '',
          r.device || '',
          r.method || '',
          r.path || '',
          r.status_code ?? '',
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

  const columns = useMemo(
    () => [
      {
        field: 'at',
        headerName: 'When',
        width: 168,
        renderHeader: () => monoHeader('When'),
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.body, fontVariantNumeric: 'tabular-nums' }}>
            {p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '—'}
          </Typography>
        )
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 128,
        renderHeader: () => monoHeader('Category'),
        renderCell: p => (
          <Chip size='small' label={CATEGORY_META[p.value]?.label || p.value} sx={categoryChipSx(p.value)} />
        )
      },
      {
        field: 'title',
        headerName: 'Action',
        flex: 1,
        minWidth: 180,
        renderHeader: () => monoHeader('Action'),
        renderCell: p => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 14, fontWeight: 500, color: actionTone(p.row.action), letterSpacing: '-0.28px' }}
              noWrap
            >
              {p.row.title}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
              {p.row.action}
            </Typography>
          </Box>
        )
      },
      {
        field: 'actorLabel',
        headerName: 'Who',
        width: 160,
        valueGetter: params => params.row.actor?.label || '—',
        renderHeader: () => monoHeader('Who'),
        renderCell: p =>
          p.row.actor?.id ? (
            <Typography
              component={Link}
              href={`/apps/users/${p.row.actor.id}`}
              sx={{
                fontSize: 13,
                color: ops.indigo,
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': { color: ops.indigoDeep }
              }}
            >
              {p.value}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 13, color: ops.body }}>{p.value}</Typography>
          )
      },
      {
        field: 'targetLabel',
        headerName: 'Target',
        width: 160,
        valueGetter: params => params.row.target?.label || '—',
        renderHeader: () => monoHeader('Target'),
        renderCell: p =>
          p.row.target?.id ? (
            <Typography
              component={Link}
              href={`/apps/users/${p.row.target.id}`}
              sx={{ fontSize: 13, color: ops.link, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {p.value}
            </Typography>
          ) : (
            <Typography
              sx={{ fontSize: 13, color: ops.body, fontFamily: p.value?.includes('@') ? ops.mono : 'inherit' }}
            >
              {p.value}
            </Typography>
          )
      },
      {
        field: 'ip',
        headerName: 'IP',
        width: 120,
        renderHeader: () => monoHeader('IP'),
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }} noWrap>
            {p.row.ip || '—'}
          </Typography>
        )
      },
      {
        field: 'device',
        headerName: 'Device',
        width: 140,
        renderHeader: () => monoHeader('Device'),
        renderCell: p => (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, color: ops.ink }} noWrap>
              {p.row.device || '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
              {[p.row.platform, p.row.client_type].filter(Boolean).join(' · ') || ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'api',
        headerName: 'API',
        width: 160,
        renderHeader: () => monoHeader('API'),
        renderCell: p =>
          p.row.method || p.row.path ? (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }} noWrap>
              {p.row.method || ''} {p.row.path || ''}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 12, color: ops.mute }}>—</Typography>
          )
      },
      {
        field: 'amount',
        headerName: 'Amount',
        width: 110,
        valueGetter: params => params.row.meta?.amount || '',
        renderHeader: () => monoHeader('Amount'),
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontVariantNumeric: 'tabular-nums', color: ops.ink }}>
            {p.value || '—'}
          </Typography>
        )
      }
    ],
    []
  )

  return (
    <Box
      sx={{
        fontFamily: ops.sans,
        bgcolor: ops.canvasSoft,
        mx: { xs: -2, sm: -3 },
        px: { xs: 2, sm: 3 },
        pt: 1,
        pb: 2,
        minHeight: '100%'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1680, mx: 'auto', pb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'flex-start' }}
          justifyContent='space-between'
          sx={{ mb: 3 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.75 }}>
              <Typography
                sx={{
                  fontFamily: ops.mono,
                  fontSize: 11,
                  color: ops.mute,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                Logs · platform
              </Typography>
              <Box
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
            </Stack>
            <Typography
              sx={{
                fontSize: { xs: 24, md: 32 },
                fontWeight: 600,
                letterSpacing: '-1.28px',
                lineHeight: 1.2,
                color: ops.ink
              }}
            >
              Platform activity.
            </Typography>
            <Typography sx={{ mt: 0.75, maxWidth: 720, fontSize: 14, color: ops.body, lineHeight: 1.65 }}>
              Who did what, when — logins, uploads, bookings, invites, referrals, transactions, admin
              actions, and authenticated API hits (IP · device · path). Filters sync to the URL.
            </Typography>
          </Box>
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
        </Stack>

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
                '& .MuiDataGrid-cell': { border: 'none', py: 1 }
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
      </Box>

      <Drawer
        anchor='right'
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480 },
            bgcolor: ops.night,
            color: ops.onNight,
            boxShadow: ops.shadowDrawer,
            p: 0
          }
        }}
      >
        {detail ? (
          <Stack sx={{ height: '100%' }}>
            <Stack
              direction='row'
              alignItems='flex-start'
              justifyContent='space-between'
              sx={{ p: 2.5, borderBottom: `1px solid ${ops.nightLift}` }}
            >
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography
                  sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted, textTransform: 'uppercase' }}
                >
                  Event detail
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.4px', mt: 0.5 }}>
                  {detail.title}
                </Typography>
                <Stack direction='row' spacing={1} sx={{ mt: 1 }} alignItems='center'>
                  <Chip
                    size='small'
                    label={CATEGORY_META[detail.category]?.label || detail.category}
                    sx={categoryChipSx(detail.category)}
                  />
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted }}>
                    {detail.at ? moment(detail.at).format('YYYY-MM-DD HH:mm:ss') : '—'}
                  </Typography>
                </Stack>
              </Box>
              <IconButton onClick={() => setDetail(null)} sx={{ color: ops.onNightMuted }}>
                <CloseIcon fontSize='small' />
              </IconButton>
            </Stack>

            <Stack spacing={2} sx={{ p: 2.5, flex: 1, overflow: 'auto' }}>
              {[
                ['When', detail.at ? moment(detail.at).format('YYYY-MM-DD HH:mm:ss') : '—', null],
                ['Who', detail.actor?.label, detail.actor?.id ? `/apps/users/${detail.actor.id}` : null],
                ['Target', detail.target?.label, detail.target?.id ? `/apps/users/${detail.target.id}` : null],
                ['Action', detail.action, null],
                ['Source', detail.source, null],
                ['IP address', detail.ip || '—', null],
                ['Device', detail.device || '—', null],
                [
                  'Client',
                  [detail.platform, detail.client_type, detail.device_id].filter(Boolean).join(' · ') || '—',
                  null
                ],
                [
                  'API',
                  detail.method || detail.path
                    ? `${detail.method || ''} ${detail.path || ''}`.trim()
                    : '—',
                  null
                ],
                [
                  'Status / duration',
                  detail.status_code != null || detail.duration_ms != null
                    ? `${detail.status_code ?? '—'} · ${detail.duration_ms != null ? `${detail.duration_ms}ms` : '—'}`
                    : '—',
                  null
                ],
                ['Request id', detail.request_id || '—', null],
                ['User-Agent', detail.user_agent || '—', null],
                ['Entity', detail.entity ? `${detail.entity.type} · ${detail.entity.id}` : '—', null]
              ].map(([label, value, href]) => (
                <Box key={label}>
                  <Typography
                    sx={{
                      fontFamily: ops.mono,
                      fontSize: 10,
                      color: ops.onNightMuted,
                      textTransform: 'uppercase',
                      mb: 0.5
                    }}
                  >
                    {label}
                  </Typography>
                  {href ? (
                    <Typography
                      component={Link}
                      href={href}
                      sx={{
                        color: ops.lime,
                        textDecoration: 'none',
                        fontSize: 14,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {value} <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </Typography>
                  ) : (
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: ops.onNight,
                        fontFamily: ops.mono,
                        fontVariantNumeric: 'tabular-nums',
                        wordBreak: 'break-all',
                        lineHeight: 1.45
                      }}
                    >
                      {value}
                    </Typography>
                  )}
                </Box>
              ))}

              {detail.meta?.amount ? (
                <Box>
                  <Typography
                    sx={{
                      fontFamily: ops.mono,
                      fontSize: 10,
                      color: ops.onNightMuted,
                      textTransform: 'uppercase',
                      mb: 0.5
                    }}
                  >
                    Amount
                  </Typography>
                  <Typography
                    sx={{ fontFamily: ops.mono, fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {detail.meta.amount}
                  </Typography>
                </Box>
              ) : null}

              <Box>
                <Button
                  size='small'
                  onClick={() => setMetaOpen(v => !v)}
                  sx={{ color: ops.lime, textTransform: 'none', fontFamily: ops.mono, fontSize: 12, px: 0 }}
                >
                  {metaOpen ? 'Hide payload' : 'Show payload'}
                </Button>
                <Collapse in={metaOpen}>
                  <Box
                    component='pre'
                    sx={{
                      mt: 1,
                      p: 1.5,
                      borderRadius: ops.radiusMd,
                      bgcolor: ops.nightLift,
                      fontFamily: ops.mono,
                      fontSize: 12,
                      lineHeight: 1.5,
                      overflow: 'auto',
                      maxHeight: 320,
                      color: ops.onNightMuted,
                      m: 0
                    }}
                  >
                    {JSON.stringify(detail.meta || {}, null, 2)}
                  </Box>
                </Collapse>
              </Box>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>
    </Box>
  )
}
