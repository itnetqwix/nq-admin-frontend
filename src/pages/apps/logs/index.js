import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminTabs from 'src/components/admin/AdminTabs'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import LogDetailDrawer from 'src/components/admin/LogDetailDrawer'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { ops, categoryChipSx } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import {
  exportLogs,
  getAdminNavPreferences,
  getApiLogs,
  getDashboardSummary,
  getFileLogs,
  getLoginHistory,
  getNotificationLogs,
  getSecurityLogs,
  putAdminPreferences
} from 'src/services/adminLogsApi'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'api', label: 'API logs' },
  { value: 'security', label: 'Security' },
  { value: 'login', label: 'Login history' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'files', label: 'Files' }
]

const emptyFilters = () => ({
  search: '',
  path: '',
  method: '',
  minStatus: '',
  ip: '',
  action: '',
  from: '',
  to: '',
  userId: ''
})

function StatusChip({ status }) {
  if (status == null || status === '') return <Typography sx={{ color: ops.mute }}>—</Typography>
  const n = Number(status)
  const err = Number.isFinite(n) ? n >= 400 : /fail|error|denied/i.test(String(status))
  return (
    <Chip
      size='small'
      label={status}
      sx={{
        fontFamily: ops.mono,
        fontSize: 11,
        height: 22,
        bgcolor: err ? ops.errorSoft : ops.canvasSoft2,
        color: err ? ops.error : ops.ink
      }}
    />
  )
}

export default function LogsHubPage() {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const canExport = !ability || ability.can('manage', 'all') || ability.can('export', 'admin-action-export-logs')
  const canSecurity =
    !ability || ability.can('manage', 'all') || ability.can('read', 'admin-action-security-logs')
  const tab = String(router.query.tab || 'overview')
  const visibleTabs = useMemo(
    () => TABS.filter(t => (t.value === 'security' ? canSecurity : true)),
    [canSecurity]
  )
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState(emptyFilters)
  const [detail, setDetail] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [presets, setPresets] = useState([])
  const [presetName, setPresetName] = useState('')

  // Hydrate filter presets (synced like nav favorites)
  useEffect(() => {
    let cancelled = false
    void getAdminNavPreferences()
      .then(data => {
        if (cancelled) return
        const list = data?.log_filter_presets || data?.data?.log_filter_presets || []
        if (Array.isArray(list)) setPresets(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const persistPresets = async next => {
    setPresets(next)
    try {
      const saved = await putAdminPreferences({ log_filter_presets: next })
      const list = saved?.log_filter_presets || saved?.data?.log_filter_presets
      if (Array.isArray(list)) setPresets(list)
    } catch (e) {
      toast.error(e?.message || 'Could not sync preset')
    }
  }

  const saveCurrentPreset = () => {
    const name = String(presetName || '').trim()
    if (!name) {
      toast.error('Name this preset first')
      return
    }
    const next = [
      { id: `p-${Date.now()}`, name, tab, filters: { ...filters } },
      ...presets.filter(p => p.name !== name)
    ].slice(0, 12)
    setPresetName('')
    void persistPresets(next)
    toast.success('Preset saved')
  }

  const applyPreset = p => {
    const nextFilters = { ...emptyFilters(), ...(p.filters || {}) }
    setFilters(nextFilters)
    setPage(0)
    syncUrl(p.tab || tab, nextFilters, 0)
  }

  const deletePreset = id => {
    void persistPresets(presets.filter(p => p.id !== id))
  }

  // Hydrate filters from URL once ready
  useEffect(() => {
    if (!router.isReady) return
    setFilters(f => ({
      ...f,
      search: String(router.query.search || ''),
      path: String(router.query.path || ''),
      method: String(router.query.method || ''),
      minStatus: String(router.query.minStatus || ''),
      ip: String(router.query.ip || ''),
      action: String(router.query.action || ''),
      from: String(router.query.from || ''),
      to: String(router.query.to || ''),
      userId: String(router.query.userId || '')
    }))
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady) return
    if (tab === 'security' && !canSecurity) {
      void router.replace({ pathname: '/apps/logs', query: { tab: 'overview' } }, undefined, { shallow: true })
    }
  }, [router.isReady, tab, canSecurity]) // eslint-disable-line react-hooks/exhaustive-deps

  const syncUrl = (nextTab, nextFilters, nextPage = 0) => {
    const q = { tab: nextTab }
    Object.entries(nextFilters || filters).forEach(([k, v]) => {
      if (v) q[k] = v
    })
    if (nextPage > 0) q.page = String(nextPage + 1)
    void router.replace({ pathname: '/apps/logs', query: q }, undefined, { shallow: true })
  }

  const setTab = next => {
    setPage(0)
    syncUrl(next, filters, 0)
  }

  const jumpTo = (nextTab, patch = {}) => {
    const next = { ...emptyFilters(), ...patch }
    setFilters(next)
    setPage(0)
    syncUrl(nextTab, next, 0)
  }

  const applyFilters = () => {
    setPage(0)
    syncUrl(tab, filters, 0)
    void loadTab(true)
  }

  const loadSummary = useCallback(async () => {
    try {
      const data = await getDashboardSummary()
      setSummary(data)
      setLastRefresh(new Date())
    } catch (e) {
      toast.error(e?.message || 'Failed to load dashboard summary')
    }
  }, [])

  const loadTab = useCallback(
    async (force = false) => {
      if (tab === 'overview' && !force) return
      if (tab === 'overview') return
      setLoading(true)
      try {
        const q = {
          page: page + 1,
          limit: pageSize,
          search: filters.search || undefined,
          path: filters.path || undefined,
          method: filters.method || undefined,
          minStatus: filters.minStatus || undefined,
          ip: filters.ip || undefined,
          action: filters.action || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          userId: filters.userId || undefined
        }
        let data
        if (tab === 'api') data = await getApiLogs(q)
        else if (tab === 'security') data = await getSecurityLogs(q)
        else if (tab === 'login') data = await getLoginHistory(q)
        else if (tab === 'notifications') data = await getNotificationLogs(q)
        else if (tab === 'files') data = await getFileLogs(q)
        else data = { items: [], pagination: { total: 0 } }
        const items = data?.items || []
        setRows(items.map((r, i) => ({ id: r.id || `r-${i}`, ...r })))
        setTotal(data?.pagination?.total ?? items.length)
        setSessions(data?.sessions || [])
        setLastRefresh(new Date())
      } catch (e) {
        toast.error(e?.message || 'Failed to load logs')
        setRows([])
        setTotal(0)
        setSessions([])
      } finally {
        setLoading(false)
      }
    },
    [tab, page, pageSize, filters]
  )

  useEffect(() => {
    void loadSummary()
    const t = setInterval(() => void loadSummary(), 45_000)
    return () => clearInterval(t)
  }, [loadSummary])

  useEffect(() => {
    void loadTab()
    if (tab === 'overview') return undefined
    const t = setInterval(() => void loadTab(), 45_000)
    return () => clearInterval(t)
  }, [loadTab, tab])

  const columns = useMemo(() => {
    if (tab === 'api') {
      return [
        {
          field: 'at',
          headerName: 'When',
          width: 168,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
                {formatOpsDateTime(p.row.at, { withSeconds: false })}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                {p.row.at ? moment(p.row.at).fromNow() : ''}
              </Typography>
            </Box>
          )
        },
        { field: 'method', headerName: 'Method', width: 88 },
        { field: 'path', headerName: 'Path', flex: 1, minWidth: 160 },
        {
          field: 'status',
          headerName: 'Status',
          width: 90,
          renderCell: p => <StatusChip status={p.row.status} />
        },
        {
          field: 'duration_ms',
          headerName: 'ms',
          width: 80,
          renderCell: p => (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {p.row.duration_ms ?? '—'}
            </Typography>
          )
        },
        { field: 'ip', headerName: 'IP', width: 120 },
        {
          field: 'location',
          headerName: 'Location',
          width: 130,
          valueGetter: p => [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ') || '—'
        },
        {
          field: 'device',
          headerName: 'Device',
          width: 150,
          renderCell: p => (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.device || p.row.browser || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {[p.row.browser, p.row.os, p.row.platform, p.row.client_type].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          )
        },
        {
          field: 'actor',
          headerName: 'Who',
          width: 200,
          renderCell: p => (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.actor?.fullname || p.row.actor?.label || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {p.row.actor?.email || p.row.actor?.id || ''}
              </Typography>
            </Box>
          )
        }
      ]
    }
    if (tab === 'security' || tab === 'login') {
      return [
        {
          field: 'at',
          headerName: 'When',
          width: 168,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
                {formatOpsDateTime(p.row.at, { withSeconds: false })}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                {p.row.at ? moment(p.row.at).fromNow() : ''}
              </Typography>
            </Box>
          )
        },
        {
          field: 'action',
          headerName: 'Action',
          width: 140,
          renderCell: p => (
            <Chip
              size='small'
              label={String(p.row.action || '').replace(/_/g, ' ')}
              sx={{
                ...categoryChipSx(
                  String(p.row.action || '').includes('fail') || String(p.row.action || '').includes('lock')
                    ? 'admin'
                    : 'logins'
                ),
                ...(String(p.row.action || '').includes('fail') || String(p.row.action || '').includes('lock')
                  ? { bgcolor: ops.errorSoft, color: ops.error }
                  : {})
              }}
            />
          )
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 100 },
        { field: 'ip', headerName: 'IP', width: 120 },
        {
          field: 'location',
          headerName: 'Location',
          width: 130,
          valueGetter: p => [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ') || '—'
        },
        {
          field: 'device',
          headerName: 'Device',
          width: 150,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.device || p.row.browser || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {[p.row.browser, p.row.os, p.row.platform].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          )
        },
        {
          field: 'actor',
          headerName: 'Who',
          width: 200,
          renderCell: p => (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.actor?.fullname || p.row.actor?.label || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {p.row.actor?.email || p.row.actor?.id || ''}
              </Typography>
            </Box>
          )
        }
      ]
    }
    if (tab === 'notifications') {
      return [
        {
          field: 'at',
          headerName: 'When',
          width: 168,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
                {formatOpsDateTime(p.row.at, { withSeconds: false })}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                {p.row.at ? moment(p.row.at).fromNow() : ''}
              </Typography>
            </Box>
          )
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 140 },
        {
          field: 'channel',
          headerName: 'Channel',
          width: 120,
          renderCell: p => (
            <Chip size='small' label={p.row.channel || '—'} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
          )
        },
        {
          field: 'status',
          headerName: 'Status',
          width: 100,
          renderCell: p => <StatusChip status={p.row.status} />
        },
        {
          field: 'user_id',
          headerName: 'User',
          width: 160,
          renderCell: p => (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }} noWrap>
              {p.row.user_id || '—'}
            </Typography>
          )
        }
      ]
    }
    return [
      {
        field: 'at',
        headerName: 'When',
        width: 168,
        renderCell: p => (
          <Box>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
              {formatOpsDateTime(p.row.at, { withSeconds: false })}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
              {p.row.at ? moment(p.row.at).fromNow() : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'action',
        headerName: 'Action',
        width: 150,
        renderCell: p => (
          <Chip size='small' label={String(p.row.action || '').replace(/_/g, ' ')} sx={categoryChipSx('other')} />
        )
      },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 120 },
      {
        field: 'actor',
        headerName: 'Who',
        width: 200,
        renderCell: p => (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12 }} noWrap>
              {p.row.actor?.fullname || p.row.actor?.label || '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
              {p.row.actor?.email || p.row.actor?.id || ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'entity',
        headerName: 'Entity',
        width: 160,
        valueGetter: p => (p.row.entity ? `${p.row.entity.type}:${p.row.entity.id}` : '—')
      },
      { field: 'ip', headerName: 'IP', width: 110 },
      {
        field: 'location',
        headerName: 'Location',
        width: 120,
        valueGetter: p => [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ') || '—'
      }
    ]
  }, [tab])

  const kpis = summary?.kpis || {}
  const showApiFilters = tab === 'api'
  const showSecFilters = tab === 'security' || tab === 'login'
  const showNotifFilters = tab === 'notifications'
  const showFileFilters = tab === 'files'
  const showRichFilters = showApiFilters || showSecFilters || showNotifFilters || showFileFilters

  return (
      <AdminPageShell
        bare
        eyebrow='Logs · hub'
        icon='mdi:text-box-search-outline'
        title='Platform logs.'
        subtitle='Live ops feed — who, when, where, device, and API path. Filters sync to the URL.'
      actions={
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
          {lastRefresh ? (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
              Updated {moment(lastRefresh).fromNow()}
            </Typography>
          ) : null}
          <AdminRefreshButton
            onClick={() => {
              void loadSummary()
              void loadTab(true)
            }}
            loading={loading}
          />
          {canExport ? (
            <Button
              size='small'
              variant='contained'
              onClick={() =>
                void exportLogs(
                  tab === 'overview'
                    ? 'activity'
                    : tab === 'login'
                      ? 'login'
                      : tab === 'files'
                        ? 'activity'
                        : tab === 'notifications'
                          ? 'activity'
                          : tab,
                  500,
                  filters
                ).catch(e => toast.error(e?.message || 'Export failed'))
              }
              sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
            >
              Export CSV
            </Button>
          ) : null}
        </Stack>
      }
    >
      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 2 }}>
        {summary?.retention?.note || 'API 14d · activity 180d · audit append-only'}
        {summary?.generated_at ? ` · server ${formatOpsDateTime(summary.generated_at, { withSeconds: false })}` : ''}
      </Typography>

      <AdminTabs
        value={visibleTabs.some(t => t.value === tab) ? tab : 'overview'}
        onChange={setTab}
        tabs={visibleTabs}
      />

      {tab === 'overview' ? (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {[
              ['Logins (24h)', kpis.logins, () => jumpTo('login', { action: 'login' }), null],
              ['Failed logins', kpis.failed_logins, () => jumpTo('security', { action: 'login_failed' }), 'danger'],
              ['API hits', kpis.api_hits, () => jumpTo('api'), null],
              ['API errors', kpis.api_errors, () => jumpTo('api', { minStatus: '400' }), 'warn'],
              ['Error rate %', kpis.error_rate, () => jumpTo('api', { minStatus: '400' }), null],
              ['Open ops', kpis.open_ops, () => router.push('/apps/ops-logs'), null],
              ['Uploads', kpis.uploads, () => jumpTo('files'), null]
            ].map(([label, value, onClick, tone]) => (
              <Grid item xs={6} sm={4} md={3} lg={true} key={label}>
                <OpsMetricTile label={label} value={value ?? '—'} tone={tone || undefined} onClick={onClick} />
              </Grid>
            ))}
          </Grid>

          <AdminPageSection title='Quick actions' subtitle='Deep explorers and settings.'>
            <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1}>
              {(summary?.quick_actions || []).map(a => (
                <Button
                  key={a.href}
                  component={Link}
                  href={a.href}
                  variant='outlined'
                  size='small'
                  sx={{ textTransform: 'none', borderColor: ops.hairline, color: ops.ink }}
                >
                  {a.label}
                </Button>
              ))}
            </Stack>
          </AdminPageSection>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Failed logins (24h)</Typography>
                <Stack spacing={1.25}>
                  {(summary?.failed_logins || []).length ? (
                    summary.failed_logins.map(row => (
                      <Box
                        key={row.id}
                        onClick={() => setDetail(row)}
                        sx={{
                          borderBottom: `1px solid ${ops.hairline}`,
                          pb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: ops.canvasSoft }
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: ops.error }}>
                          {String(row.action || '').replace(/_/g, ' ')}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {formatOpsDateTime(row.at, { withSeconds: false })} · {row.actor?.label || '—'} ·{' '}
                          {row.ip || 'no ip'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No failed logins in window</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={7}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Top API paths (24h)</Typography>
                <Stack spacing={1}>
                  {(summary?.top_api_paths || []).length ? (
                    summary.top_api_paths.map(p => (
                      <Stack
                        key={p.path}
                        direction='row'
                        justifyContent='space-between'
                        alignItems='center'
                        spacing={1}
                        onClick={() => jumpTo('api', { path: p.path })}
                        sx={{
                          borderBottom: `1px solid ${ops.hairline}`,
                          pb: 0.75,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: ops.canvasSoft }
                        }}
                      >
                        <Typography
                          sx={{ fontFamily: ops.mono, fontSize: 12, flex: 1, minWidth: 0 }}
                          noWrap
                          title={p.path}
                        >
                          {p.path}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {p.hits} hits · {p.errors} err · ~{p.avg_ms}ms
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No API traffic in window</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={7}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Recent activity</Typography>
                <Stack spacing={1.25}>
                  {(summary?.recent_activity || []).length ? (
                    summary.recent_activity.map(row => (
                      <Box
                        key={row.id}
                        onClick={() => setDetail(row)}
                        sx={{
                          borderBottom: `1px solid ${ops.hairline}`,
                          pb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: ops.canvasSoft }
                        }}
                      >
                        <Stack direction='row' spacing={1} alignItems='center'>
                          {row.category ? (
                            <Chip size='small' label={row.category} sx={categoryChipSx(row.category)} />
                          ) : null}
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{row.title}</Typography>
                        </Stack>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {formatOpsDateTime(row.at, { withSeconds: false })} · {row.actor?.label || '—'}
                          {row.ip ? ` · ${row.ip}` : ''}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No recent events</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={5}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Recent errors</Typography>
                <Stack spacing={1.25}>
                  {(summary?.recent_errors || []).length ? (
                    summary.recent_errors.map((row, i) => (
                      <Box key={row._id || i} sx={{ borderBottom: `1px solid ${ops.hairline}`, pb: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                          {row.title || row.event_type || 'Ops event'}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {row.severity || row.category || '—'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No recent errors</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
          </Grid>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <AdminFilterBar
            resultCount={total}
            onRefresh={() => void loadTab(true)}
            refreshLoading={loading}
            helperText='Filters sync into the URL. Save presets to reuse across devices.'
            endAdornment={
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <TextField
                  size='small'
                  placeholder='Preset name'
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  sx={{ width: 140 }}
                />
                <Button size='small' variant='outlined' onClick={saveCurrentPreset} sx={{ textTransform: 'none' }}>
                  Save preset
                </Button>
                <Button size='small' variant='contained' onClick={applyFilters} sx={{ textTransform: 'none', bgcolor: ops.indigo }}>
                  Apply
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => {
                    const cleared = emptyFilters()
                    setFilters(cleared)
                    setPage(0)
                    syncUrl(tab, cleared, 0)
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Clear
                </Button>
              </Stack>
            }
          >
            {showRichFilters ? (
              <>
                {showApiFilters ? (
                  <>
                    <TextField
                      size='small'
                      label='Path'
                      value={filters.path}
                      onChange={e => setFilters(f => ({ ...f, path: e.target.value }))}
                      sx={{ minWidth: 160 }}
                    />
                    <TextField
                      size='small'
                      select
                      label='Method'
                      value={filters.method}
                      onChange={e => setFilters(f => ({ ...f, method: e.target.value }))}
                      sx={{ minWidth: 110 }}
                    >
                      <MenuItem value=''>Any</MenuItem>
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size='small'
                      select
                      label='Min status'
                      value={filters.minStatus}
                      onChange={e => setFilters(f => ({ ...f, minStatus: e.target.value }))}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value=''>Any</MenuItem>
                      <MenuItem value='400'>4xx+</MenuItem>
                      <MenuItem value='500'>5xx+</MenuItem>
                    </TextField>
                  </>
                ) : null}
                {showSecFilters || showNotifFilters ? (
                  <TextField
                    size='small'
                    label='Search'
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    sx={{ minWidth: 160 }}
                  />
                ) : null}
                {showSecFilters ? (
                  <TextField
                    size='small'
                    select
                    label='Action'
                    value={filters.action}
                    onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value=''>All</MenuItem>
                    <MenuItem value='login'>login</MenuItem>
                    <MenuItem value='login_failed'>login_failed</MenuItem>
                    <MenuItem value='login_locked'>login_locked</MenuItem>
                  </TextField>
                ) : null}
                {showFileFilters ? (
                  <TextField
                    size='small'
                    select
                    label='Action'
                    value={filters.action}
                    onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value=''>All uploads</MenuItem>
                    <MenuItem value='clip_created'>clip_created</MenuItem>
                    <MenuItem value='session_uploaded'>session_uploaded</MenuItem>
                  </TextField>
                ) : null}
                {showApiFilters || showSecFilters ? (
                  <TextField
                    size='small'
                    label='IP'
                    value={filters.ip}
                    onChange={e => setFilters(f => ({ ...f, ip: e.target.value }))}
                    sx={{ minWidth: 130 }}
                  />
                ) : null}
                <TextField
                  size='small'
                  label='User id'
                  value={filters.userId}
                  onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  size='small'
                  type='date'
                  label='From'
                  InputLabelProps={{ shrink: true }}
                  value={filters.from}
                  onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                />
                <TextField
                  size='small'
                  type='date'
                  label='To'
                  InputLabelProps={{ shrink: true }}
                  value={filters.to}
                  onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                />
              </>
            ) : (
              <TextField
                size='small'
                label='User id'
                value={filters.userId}
                onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                sx={{ minWidth: 200 }}
              />
            )}
          </AdminFilterBar>

          {presets.length ? (
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
              {presets.map(p => (
                <Chip
                  key={p.id || p.name}
                  size='small'
                  label={`${p.name} · ${p.tab || 'api'}`}
                  onClick={() => applyPreset(p)}
                  onDelete={() => deletePreset(p.id)}
                  sx={{ fontFamily: ops.mono, fontSize: 11 }}
                />
              ))}
            </Stack>
          ) : null}

          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>
            {total.toLocaleString()} rows
            {tab === 'api' ? ' · retention 14d' : ''}
          </Typography>

          <AdminGridContainer>
            <AdminDataGrid
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
              emptyMessage='No log rows'
              emptyDescription='Widen filters or switch tab.'
              sx={{
                '& .MuiDataGrid-row': { cursor: 'pointer' }
              }}
            />
          </AdminGridContainer>

          {tab === 'login' && sessions.length ? (
            <AdminPageSection title='Active / recent sessions' subtitle='From auth_session for filtered user.'>
              <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
                <Stack spacing={0}>
                  {sessions.map(s => (
                    <Box
                      key={s.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: `1px solid ${ops.hairline}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        flexWrap: 'wrap'
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {s.deviceLabel || 'Device'} · {s.platform || '—'}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {s.publicId} · {s.ipAddress || 'no ip'} · {s.loginMethod || '—'}
                          {s.revokedAt ? ' · revoked' : ''}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }}>
                        last {s.lastUsedAt ? formatOpsDateTime(s.lastUsedAt, { withSeconds: false }) : '—'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </OpsSurfaceCard>
            </AdminPageSection>
          ) : null}
        </Stack>
      )}

      <LogDetailDrawer open={Boolean(detail)} row={detail} onClose={() => setDetail(null)} kind={tab} />
    </AdminPageShell>
  )
}

LogsHubPage.acl = {
  action: 'read',
  subject: 'admin-nav-logs'
}
