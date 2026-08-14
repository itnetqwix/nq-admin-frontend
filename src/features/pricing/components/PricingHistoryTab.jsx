import { useCallback, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fetchPricingHistory } from 'src/services/pricingApi'

export default function PricingHistoryTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const items = await fetchPricingHistory(25)
      setRows(
        (items || []).map(r => ({
          id: r._id || r.version,
          version: r.version,
          is_active: r.is_active,
          effective_at: r.effective_at,
          updatedAt: r.updatedAt,
          quote_tolerance_minor: r.quote_tolerance_minor
        }))
      )
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const cols = [
    { field: 'version', headerName: 'Version', width: 90 },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 90,
      valueGetter: p => (p.row.is_active ? 'Yes' : 'No')
    },
    {
      field: 'quote_tolerance_minor',
      headerName: 'Tolerance (¢)',
      width: 120
    },
    {
      field: 'effective_at',
      headerName: 'Effective',
      flex: 1,
      minWidth: 160,
      valueGetter: p =>
        p.row.effective_at ? new Date(p.row.effective_at).toLocaleString() : '—'
    },
    {
      field: 'updatedAt',
      headerName: 'Saved',
      flex: 1,
      minWidth: 160,
      valueGetter: p => (p.row.updatedAt ? new Date(p.row.updatedAt).toLocaleString() : '—')
    }
  ]

  return (
    <AdminPageSection
      title='Configuration history'
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <AdminGridContainer>
        <AdminDataGrid autoHeight rows={rows} columns={cols} loading={loading} hideFooter />
      </AdminGridContainer>
    </AdminPageSection>
  )
}
