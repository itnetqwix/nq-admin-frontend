import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import moment from 'moment'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import AdminTabs from 'src/components/admin/AdminTabs'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import LogDetailDrawer from 'src/components/admin/LogDetailDrawer'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { useAdminRealtime } from 'src/realtime'
import OverviewTab from './OverviewTab'
import LogsTable from './LogsTable'
import { buildLogColumns } from './columns'
import {
  exportLogs,
  getAdminNavPreferences,
  getApiLogs,
  getDashboardSummary,
  getFileLogs,
  getLoginHistory,
  getAdminAccessLogs,
  getNotificationLogs,
  getSecurityLogs,
  putAdminPreferences
} from 'src/services/adminLogsApi'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'admin', label: 'Admin access' },
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
  userId: '',
  surface: ''
})

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
  const { lastEvent } = useAdminRealtime()

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
          userId: String(router.query.userId || ''),
          surface: String(router.query.surface || '')
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
          userId: filters.userId || undefined,
          surface: filters.surface || undefined
        }
        let data
        if (tab === 'api') data = await getApiLogs(q)
        else if (tab === 'security') data = await getSecurityLogs(q)
        else if (tab === 'login') data = await getLoginHistory(q)
        else if (tab === 'admin') data = await getAdminAccessLogs(q)
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
  }, [loadSummary])

  useEffect(() => {
    void loadTab()
  }, [loadTab, tab])

  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.event === 'ADMIN_LOG_INGESTED' || lastEvent.event === 'ADMIN_OPS_EVENT_CREATED') {
      void loadSummary()
      void loadTab(true)
    }
  }, [lastEvent, loadSummary, loadTab])

  const columns = useMemo(() => buildLogColumns(tab), [tab])

  const showApiFilters = tab === 'api'
  const showSecFilters = tab === 'security' || tab === 'login' || tab === 'admin'
  const showNotifFilters = tab === 'notifications'
  const showFileFilters = tab === 'files'
  const showRichFilters = showApiFilters || showSecFilters || showNotifFilters || showFileFilters

  return (
      <AdminPageShell
        bare
        eyebrow='Logs · hub'
        icon='mdi:text-box-search-outline'
        title='Platform logs.'
        subtitle='Who, when, IP, device, location. Admin access = invites + admin/sub-admin logins. Logins 7 days · invites 1 year.'
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
        <OverviewTab summary={summary} jumpTo={jumpTo} router={router} setDetail={setDetail} />
      ) : (
        <LogsTable
          tab={tab}
          total={total}
          loadTab={loadTab}
          loading={loading}
          presetName={presetName}
          setPresetName={setPresetName}
          saveCurrentPreset={saveCurrentPreset}
          applyFilters={applyFilters}
          emptyFilters={emptyFilters}
          setFilters={setFilters}
          setPage={setPage}
          syncUrl={syncUrl}
          filters={filters}
          showRichFilters={showRichFilters}
          showApiFilters={showApiFilters}
          showSecFilters={showSecFilters}
          showNotifFilters={showNotifFilters}
          showFileFilters={showFileFilters}
          presets={presets}
          applyPreset={applyPreset}
          deletePreset={deletePreset}
          rows={rows}
          columns={columns}
          page={page}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setDetail={setDetail}
          sessions={sessions}
        />
      )}

      <LogDetailDrawer open={Boolean(detail)} row={detail} onClose={() => setDetail(null)} kind={tab} />
    </AdminPageShell>
  )
}

LogsHubPage.acl = {
  action: 'read',
  subject: 'admin-nav-logs'
}
