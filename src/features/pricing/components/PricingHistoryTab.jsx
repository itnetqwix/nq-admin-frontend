import { useCallback, useEffect, useState } from 'react'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fetchPricingHistory } from 'src/services/pricingApi'
import { fmtMoney, fmtPct } from 'src/constants/pricingAdmin'

function usRegion(row) {
  return row?.regions?.US || {}
}

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
          updated_by: r.updated_by_admin_id,
          commission: usRegion(r).defaultCommissionRate,
          traineeFee: usRegion(r).traineePlatformFeeMinor,
          serviceFee: usRegion(r).trainerPlatformFeeMinor,
          withdrawalFee: usRegion(r).withdrawalFeeMinor
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
      headerName: 'Live',
      width: 80,
      valueGetter: p => (p.row.is_active ? 'Yes' : '—')
    },
    {
      field: 'commission',
      headerName: 'US commission',
      width: 130,
      valueGetter: p => (p.row.commission != null ? fmtPct(p.row.commission) : '—')
    },
    {
      field: 'traineeFee',
      headerName: 'Platform fee',
      width: 120,
      valueGetter: p => (p.row.traineeFee != null ? fmtMoney(p.row.traineeFee) : '—')
    },
    {
      field: 'serviceFee',
      headerName: 'Service fee',
      width: 120,
      valueGetter: p => (p.row.serviceFee != null ? fmtMoney(p.row.serviceFee) : '—')
    },
    {
      field: 'withdrawalFee',
      headerName: 'Cash-out fee',
      width: 120,
      valueGetter: p => (p.row.withdrawalFee != null ? fmtMoney(p.row.withdrawalFee) : '—')
    },
    {
      field: 'effective_at',
      headerName: 'Effective',
      flex: 1,
      minWidth: 160,
      valueGetter: p => (p.row.effective_at ? new Date(p.row.effective_at).toLocaleString() : '—')
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
      title='Published versions'
      subtitle='The live row is what website and app quote now. Paid bookings keep their original snapshot.'
      action={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <AdminGridContainer>
        <AdminDataGrid autoHeight rows={rows} columns={cols} loading={loading} hideFooter />
      </AdminGridContainer>
    </AdminPageSection>
  )
}
