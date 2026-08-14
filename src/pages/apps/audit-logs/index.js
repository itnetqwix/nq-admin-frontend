import { Box, Button, Grid, Stack, TextField } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAuditLogs } from 'src/services/user360Api'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataTable from 'src/layouts/components/AdminDataTable'

export default function AuditLogsPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [actorId, setActorId] = useState('')
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [exporting, setExporting] = useState(false)

  // Deep-link: /apps/audit-logs?userId=&action=&from=&to=&actorId=
  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    if (q.userId) setUserId(String(Array.isArray(q.userId) ? q.userId[0] : q.userId))
    if (q.action) setAction(String(Array.isArray(q.action) ? q.action[0] : q.action))
    if (q.actorId) setActorId(String(Array.isArray(q.actorId) ? q.actorId[0] : q.actorId))
    if (q.from) setFrom(String(Array.isArray(q.from) ? q.from[0] : q.from))
    if (q.to) setTo(String(Array.isArray(q.to) ? q.to[0] : q.to))
    if (q.search) setSearch(String(Array.isArray(q.search) ? q.search[0] : q.search))
  }, [router.isReady, router.query])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAuditLogs(userId || undefined, {
        page: page + 1,
        limit: pageSize,
        search: search.trim(),
        action: action.trim(),
        actorId: actorId.trim(),
        from: from || undefined,
        to: to || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      const items = data?.items || []
      setRows(
        items.map((r, i) => ({
          id: r._id || i,
          ...r,
          adminLabel: r.admin_id?.fullname || r.admin_id?.email || '—',
          targetId: r.target_user_id?._id || r.target_user_id || null,
          targetLabel: r.target_user_id?.fullname || r.target_user_id?.email || '—',
          ip: r.meta?.ip || '—',
          device: r.meta?.device_label || r.meta?.browser || '—',
          where: [r.meta?.city, r.meta?.region, r.meta?.country].filter(Boolean).join(', ') || '—',
          at: r.createdAt || r.updatedAt
        }))
      )
      setTotal(data?.pagination?.total ?? items.length)
    } catch (e) {
      setError(e?.message || 'Failed to load audit log')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, action, actorId, userId, from, to])

  useEffect(() => {
    void load()
  }, [load])

  const exportCsv = async () => {
    setExporting(true)
    try {
      // Cap export at 1000 rows for the current filter set
      const data = await getAuditLogs(userId || undefined, {
        page: 1,
        limit: 1000,
        search: search.trim(),
        action: action.trim(),
        actorId: actorId.trim(),
        from: from || undefined,
        to: to || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      const items = data?.items || []
      const cols = ['createdAt', 'action', 'entity_type', 'entity_id', 'admin', 'admin_id', 'target', 'target_user_id', 'reason']
      const lines = [
        cols.join(','),
        ...items.map(r =>
          [
            r.createdAt || r.updatedAt,
            r.action,
            r.entity_type,
            r.entity_id,
            `"${String(r.admin_id?.fullname || r.admin_id?.email || '').replace(/"/g, '""')}"`,
            r.admin_id?._id || r.admin_id || '',
            `"${String(r.target_user_id?.fullname || r.target_user_id?.email || '').replace(/"/g, '""')}"`,
            r.target_user_id?._id || r.target_user_id || '',
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
      toast.success(`Exported ${items.length} row(s)`)
    } catch (e) {
      toast.error(e?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 160,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'action', headerName: 'Action', width: 120 },
    { field: 'entity_type', headerName: 'Entity', width: 120 },
    { field: 'entity_id', headerName: 'Entity ID', width: 200 },
    { field: 'adminLabel', headerName: 'Admin', width: 150 },
    {
      field: 'targetLabel',
      headerName: 'Target user',
      width: 160,
      renderCell: params =>
        params.row.targetId ? (
          <Link href={`/apps/users/${params.row.targetId}`} style={{ color: 'inherit' }}>
            {params.value}
          </Link>
        ) : (
          params.value
        )
    },
    { field: 'ip', headerName: 'IP', width: 120 },
    { field: 'device', headerName: 'Device', width: 140 },
    { field: 'where', headerName: 'Where', width: 140 },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 140 }
  ]

  return (
    <AdminPageShell
      title='Audit log'
      subtitle='Admin actions. Filter by actor, action, date, or target user (deep-link from User 360).'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Button variant='outlined' onClick={() => void load()}>
            Refresh
          </Button>
          <Button variant='contained' onClick={() => void exportCsv()} disabled={exporting || !total}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size='small'
              fullWidth
              label='Action'
              value={action}
              onChange={e => {
                setPage(0)
                setAction(e.target.value)
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size='small'
              fullWidth
              label='Actor admin id'
              value={actorId}
              onChange={e => {
                setPage(0)
                setActorId(e.target.value)
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size='small'
              fullWidth
              label='Target user id'
              value={userId}
              onChange={e => {
                setPage(0)
                setUserId(e.target.value)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField
              size='small'
              fullWidth
              type='date'
              label='From'
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={e => {
                setPage(0)
                setFrom(e.target.value)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={1.5}>
            <TextField
              size='small'
              fullWidth
              type='date'
              label='To'
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={e => {
                setPage(0)
                setTo(e.target.value)
              }}
            />
          </Grid>
        </Grid>
        <AdminDataTable
          rows={rows}
          columns={columns}
          loading={loading}
          error={error}
          total={total}
          page={page}
          pageSize={pageSize}
          onPaginationModelChange={m => {
            setPage(m.page)
            setPageSize(m.pageSize)
          }}
          search={search}
          onSearchChange={v => {
            setPage(0)
            setSearch(v)
          }}
          searchLabel='Search reason / action / entity'
          onRetry={() => void load()}
          emptyMessage='No audit rows'
        />
        <Box sx={{ mt: 1 }} />
      </AdminPageSection>
    </AdminPageShell>
  )
}
