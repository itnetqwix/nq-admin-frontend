import { useCallback, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import toast from 'react-hot-toast'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { OpsSurfaceCard, useAdminConfirm } from 'src/components/admin'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fetchSessionTips, refundSessionTip } from 'src/services/pricingApi'

const money = (minor, currency = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((minor || 0) / 100)
  } catch {
    return `$${((minor || 0) / 100).toFixed(2)}`
  }
}

export default function PricingTipsLedgerTab({ canEdit }) {
  const [data, setData] = useState({ items: [], total: 0, totals: [] })
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchSessionTips({ page: page + 1, limit: 25, status: status || undefined }))
    } catch (e) {
      toast.error(e?.message || 'Could not load tips')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    void load()
  }, [load])

  const refund = async row => {
    const res = await confirm({
      title: 'Refund this tip?',
      message: `${money(row.tipMinor, row.currency)} from ${row.traineeName} is taken back from the coach and returned to the enthusiast.`
    })
    if (!res?.confirmed) return
    try {
      await refundSessionTip(row.id, 'admin_refund')
      toast.success('Tip refunded')
      void load()
    } catch (e) {
      toast.error(e?.message || 'Refund failed')
    }
  }

  const cols = [
    {
      field: 'createdAt',
      headerName: 'When',
      minWidth: 160,
      flex: 1,
      valueGetter: p => new Date(p.row.createdAt).toLocaleString()
    },
    { field: 'traineeName', headerName: 'From', minWidth: 140, flex: 1 },
    { field: 'tipMinor', headerName: 'Tip', width: 100, valueGetter: p => money(p.row.tipMinor, p.row.currency) },
    {
      field: 'processingFeeMinor',
      headerName: 'Fee paid',
      width: 100,
      valueGetter: p => money(p.row.processingFeeMinor, p.row.currency)
    },
    {
      field: 'commissionMinor',
      headerName: 'Commission',
      width: 110,
      valueGetter: p => money(p.row.commissionMinor, p.row.currency)
    },
    {
      field: 'trainerNetMinor',
      headerName: 'Coach gets',
      width: 110,
      valueGetter: p => money(p.row.trainerNetMinor, p.row.currency)
    },
    { field: 'fundingSource', headerName: 'Paid by', width: 90 },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: p =>
        canEdit && p.row.status === 'succeeded' ? (
          <Button size='small' color='error' onClick={() => void refund(p.row)}>
            Refund
          </Button>
        ) : null
    }
  ]

  return (
    <AdminPageSection
      title='Tips'
      subtitle='Every tip enthusiasts have sent. Refunding takes the money back from the coach.'
      action={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <Stack direction='row' spacing={3} sx={{ mb: 2 }} alignItems='center' flexWrap='wrap'>
        {(data.totals || []).map(t => (
          <Typography key={t._id} variant='body2'>
            {t._id}: <b>{money(t.tipMinor, t._id)}</b> across {t.count} tips · fees {money(t.feeMinor, t._id)} · commission{' '}
            {money(t.commissionMinor, t._id)}
          </Typography>
        ))}
        <TextField select size='small' label='Status' value={status} onChange={e => { setPage(0); setStatus(e.target.value) }} sx={{ minWidth: 140 }}>
          <MenuItem value=''>All</MenuItem>
          <MenuItem value='succeeded'>Succeeded</MenuItem>
          <MenuItem value='pending'>Pending</MenuItem>
          <MenuItem value='failed'>Failed</MenuItem>
          <MenuItem value='refunded'>Refunded</MenuItem>
        </TextField>
      </Stack>
      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        {!loading && data.items.length === 0 ? (
          <AdminEmptyState icon={FavoriteBorderIcon} title='No tips yet' description='Tips appear here once enthusiasts start sending them.' compact />
        ) : (
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight
              rows={data.items}
              columns={cols}
              loading={loading}
              rowCount={data.total}
              paginationMode='server'
              paginationModel={{ page, pageSize: 25 }}
              onPaginationModelChange={m => setPage(m.page)}
              pageSizeOptions={[25]}
            />
          </AdminGridContainer>
        )}
      </OpsSurfaceCard>
      {ConfirmDialog}
    </AdminPageSection>
  )
}
