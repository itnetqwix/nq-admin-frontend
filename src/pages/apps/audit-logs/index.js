import { Button, Stack } from '@mui/material'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getAuditLogs } from 'src/services/user360Api'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'

export default function AuditLogsPage() {
  const router = useRouter()
  const filterUserId = router.isReady && router.query.userId ? String(router.query.userId) : undefined
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs(filterUserId, {
        page: page + 1,
        limit: pageSize,
        search: search.trim(),
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
  }, [page, pageSize, search, filterUserId])

  useEffect(() => {
    void load()
  }, [load])

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

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 180,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'action', headerName: 'Action', width: 120 },
    { field: 'entity_type', headerName: 'Entity', width: 130 },
    { field: 'entity_id', headerName: 'Entity ID', width: 220 },
    { field: 'adminLabel', headerName: 'Admin', width: 160 },
    { field: 'targetLabel', headerName: 'Target user', width: 160 },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 160 }
  ]

  return (
    <AdminPageShell
      icon='mdi:clipboard-text-clock-outline'
      title='Audit log'
      subtitle='Admin actions (deletes, refunds, and more). For logins, bookings, uploads, and referrals use Platform activity.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Button variant='outlined' component={Link} href='/apps/platform-activity'>
            Platform activity
          </Button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
          <Button variant='contained' onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </Button>
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <AdminFilterBar
          searchPlaceholder='Search reason, action, entity type, or ID'
          searchValue={search}
          onSearchChange={e => setSearch(e.target.value)}
          onSearchSubmit={() => {
            setPage(0)
            void load()
          }}
          onRefresh={() => void load()}
          refreshLoading={loading}
          resultCount={total}
          helperText='Press Enter to search. Filter by user via User 360 deep links.'
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
            emptyMessage='No audit events match your search'
            emptyDescription='Try a broader keyword or clear filters.'
            onEmptyAction={() => {
              setSearch('')
              setPage(0)
              void load()
            }}
            emptyActionLabel='Clear search'
          />
        </AdminGridContainer>
      </AdminPageSection>
    </AdminPageShell>
  )
}
