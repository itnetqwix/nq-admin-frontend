import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import moment from 'moment'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { getAuditLogs } from 'src/services/user360Api'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

function auditActionSx(action) {
  const a = String(action || '').toLowerCase()
  if (/delete|remove|ban|hard_?delete/.test(a)) {
    return { bgcolor: ops.errorSoft, color: ops.error }
  }
  if (/refund|void|revoke/.test(a)) {
    return { bgcolor: ops.softAmber, color: '#ab570a' }
  }
  if (/role|assign|permission/.test(a)) {
    return { bgcolor: ops.softIndigo, color: ops.indigo }
  }
  return { bgcolor: ops.canvasSoft2, color: ops.ink }
}

const ACTION_CHIPS = [
  { key: '', label: 'All' },
  { key: 'delete', label: 'Deletes' },
  { key: 'refund', label: 'Refunds' },
  { key: 'role', label: 'Roles' },
  { key: 'ban', label: 'Bans' },
  { key: 'update', label: 'Updates' }
]

export default function AuditLogsPage() {
  const router = useRouter()
  const filterUserId = router.isReady && router.query.userId ? String(router.query.userId) : undefined
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [actionChip, setActionChip] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!router.isReady) return
    if (router.query.search) setSearch(String(router.query.search))
    if (router.query.action) setActionChip(String(router.query.action))
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveSearch = useMemo(() => {
    const parts = [search.trim(), actionChip].filter(Boolean)
    return parts.join(' ')
  }, [search, actionChip])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs(filterUserId, {
        page: page + 1,
        limit: pageSize,
        search: effectiveSearch,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      const items = data?.items || []
      setRows(
        items.map((r, i) => ({
          id: r._id || i,
          ...r,
          adminLabel: r.admin_id?.fullname || r.admin_id?.email || '—',
          targetLabel: r.target_user_id?.fullname || r.target_user_id?.email || '—',
          at: r.createdAt || r.updatedAt
        }))
      )
      setTotal(data?.pagination?.total ?? items.length)
    } catch (e) {
      toast.error(e?.message || 'Failed to load audit log')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, effectiveSearch, filterUserId])

  useEffect(() => {
    void load()
  }, [load])

  const syncUrl = (nextSearch, nextAction, nextPage = 0) => {
    const q = {}
    if (filterUserId) q.userId = filterUserId
    if (nextSearch.trim()) q.search = nextSearch.trim()
    if (nextAction) q.action = nextAction
    if (nextPage > 0) q.page = String(nextPage + 1)
    void router.replace({ pathname: '/apps/audit-logs', query: q }, undefined, { shallow: true })
  }

  const applyActionChip = key => {
    setActionChip(key)
    setPage(0)
    syncUrl(search, key, 0)
  }

  const exportCsv = () => {
    const cols = ['createdAt', 'action', 'entity_type', 'entity_id', 'admin', 'target', 'reason']
    const lines = [
      cols.join(','),
      ...rows.map(r =>
        [
          r.at,
          r.action,
          r.entity_type,
          r.entity_id,
          r.adminLabel,
          r.targetLabel,
          `"${String(r.reason || '').replace(/"/g, '""')}"`
        ].join(',')
      )
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `admin-audit-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const deletesInView = useMemo(
    () => rows.filter(r => /delete|remove|hard_?delete/i.test(String(r.action || ''))).length,
    [rows]
  )
  const refundsInView = useMemo(
    () => rows.filter(r => /refund/i.test(String(r.action || ''))).length,
    [rows]
  )

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
        field: 'action',
        headerName: 'Action',
        width: 140,
        renderCell: p => (
          <Chip
            size='small'
            label={String(p.value || '—').replace(/_/g, ' ')}
            sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, ...auditActionSx(p.value) }}
          />
        )
      },
      {
        field: 'entity_type',
        headerName: 'Entity',
        width: 120,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }} noWrap>
            {p.value || '—'}
          </Typography>
        )
      },
      {
        field: 'entity_id',
        headerName: 'Entity ID',
        width: 200,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
            {p.value || '—'}
          </Typography>
        )
      },
      {
        field: 'adminLabel',
        headerName: 'Admin',
        width: 160,
        renderCell: p => (
          <Typography sx={{ fontSize: 13 }} noWrap>
            {p.value}
          </Typography>
        )
      },
      {
        field: 'targetLabel',
        headerName: 'Target',
        width: 160,
        renderCell: p => (
          <Typography sx={{ fontSize: 13 }} noWrap>
            {p.value}
          </Typography>
        )
      },
      {
        field: 'reason',
        headerName: 'Reason',
        flex: 1,
        minWidth: 160,
        renderCell: p => (
          <Typography sx={{ fontSize: 13, color: ops.body }} noWrap>
            {p.value || '—'}
          </Typography>
        )
      }
    ],
    []
  )

  return (
    <AdminPageShell
      bare
      eyebrow='Logs · audit'
      icon='mdi:clipboard-text-clock-outline'
      title='Audit trail.'
      subtitle='Admin actions only — deletes, refunds, role changes. For logins and API hits use Platform activity.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip
            component={Link}
            href='/apps/platform-activity'
            label='Platform activity'
            clickable
            variant='outlined'
            size='small'
          />
          <Chip component={Link} href='/apps/ops-logs' label='Ops / errors' clickable variant='outlined' size='small' />
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
          <Button
            size='small'
            onClick={exportCsv}
            disabled={!rows.length}
            sx={{
              textTransform: 'none',
              bgcolor: ops.ink,
              color: '#fff',
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
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:clipboard-text-clock-outline' label='Events' value={fmtInt(total)} hint='Matching filters' tone='accent' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:delete-outline'
            label='Deletes in view'
            value={fmtInt(deletesInView)}
            hint='Current page'
            tone={deletesInView > 0 ? 'warn' : 'default'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:cash-refund'
            label='Refunds in view'
            value={fmtInt(refundsInView)}
            hint='Current page'
            tone={refundsInView > 0 ? 'danger' : 'default'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:account-filter-outline'
            label='User filter'
            value={filterUserId ? 'On' : 'Off'}
            hint={filterUserId ? String(filterUserId).slice(0, 12) : 'All admins'}
            onClick={
              filterUserId
                ? () => void router.replace({ pathname: '/apps/audit-logs', query: {} }, undefined, { shallow: true })
                : undefined
            }
          />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
        <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
          {ACTION_CHIPS.map(c => {
            const active = actionChip === c.key
            return (
              <Button
                key={c.key || 'all'}
                onClick={() => applyActionChip(c.key)}
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
                {c.label}
              </Button>
            )
          })}
        </Stack>

        <AdminFilterBar
          searchPlaceholder='Search reason, action, entity type, or ID'
          searchValue={search}
          onSearchChange={e => setSearch(e.target.value)}
          onSearchSubmit={() => {
            setPage(0)
            syncUrl(search, actionChip, 0)
            void load()
          }}
          onRefresh={() => void load()}
          refreshLoading={loading}
          resultCount={total}
          helperText='Press Enter to search. Deep-link with ?userId= from User 360.'
        />

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
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: ops.canvasSoft,
                borderBottom: `1px solid ${ops.hairline}`
              },
              '& .MuiDataGrid-row': { borderBottom: `1px solid ${ops.hairline}` },
              '& .MuiDataGrid-cell': { border: 'none', py: 1 }
            }}
            emptyMessage='No audit events match'
            emptyDescription='Try a broader keyword or clear the action chip.'
            onEmptyAction={() => {
              setSearch('')
              setActionChip('')
              setPage(0)
              syncUrl('', '', 0)
            }}
            emptyActionLabel='Clear filters'
          />
        </AdminGridContainer>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
