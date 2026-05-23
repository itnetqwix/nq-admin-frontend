import { Box, Button, Grid, TextField } from '@mui/material'
import Stack from '@mui/material/Stack'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import styles from 'styles/common.module.css'
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
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'action', headerName: 'Action', width: 120, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'entity_type', headerName: 'Entity', width: 130, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'entity_id', headerName: 'Entity ID', width: 220, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'adminLabel', headerName: 'Admin', width: 160, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'targetLabel', headerName: 'Target user', width: 160, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 160, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] }
  ]

  return (
    <AdminPageShell
      title='Audit log'
      subtitle='Admin actions (deletes, refunds, and more). Search, refresh, or export CSV.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
          <Button variant='contained' onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </Button>
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <TextField
              size='small'
              fullWidth
              label='Search (reason, action, entity type, id)'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void load()}
            />
          </Grid>
        </Grid>
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
            emptyMessage='No audit events match your search.'
          />
        </AdminGridContainer>
      </AdminPageSection>
    </AdminPageShell>
  )
}
