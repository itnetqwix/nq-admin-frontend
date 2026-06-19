import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button, Stack, Typography } from '@mui/material'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import { getFinanceLedger } from 'src/services/financeApi'

const ledgerCols = [
  { field: 'entry_id', headerName: 'Entry', flex: 1, minWidth: 120 },
  { field: 'reference_type', headerName: 'Type', width: 140 },
  { field: 'entry_type', headerName: 'Dr/Cr', width: 90 },
  { field: 'bucket', headerName: 'Bucket', width: 120 },
  {
    field: 'amount_minor',
    headerName: 'Amount',
    width: 100,
    valueGetter: p => (p.row.amount_minor / 100).toFixed(2)
  },
  { field: 'createdAt', headerName: 'When', width: 180 }
]

export default function User360WalletTab({ userId, walletAmount, currency = 'USD' }) {
  const [ledger, setLedger] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 25

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const r = await getFinanceLedger({ userId, page, limit: pageSize })
      setLedger(r?.items ?? [])
      setTotal(r?.total ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [userId, page])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent='space-between'>
        <Typography variant='body2' color='text.secondary'>
          Wallet balance: {walletAmount != null ? `${currency} ${Number(walletAmount).toFixed(2)}` : '—'}
        </Typography>
        <Button size='small' component={Link} href={`/apps/finance?userId=${userId}`} variant='outlined'>
          Open in Finance
        </Button>
      </Stack>
      <Stack direction='row' spacing={1} alignItems='center'>
        <Button size='small' disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>
          Previous
        </Button>
        <Button size='small' disabled={page * pageSize >= total || loading} onClick={() => setPage(p => p + 1)}>
          Next
        </Button>
        <Typography variant='caption' color='text.secondary'>
          Page {page}
          {total ? ` · ${total} entries` : ''}
        </Typography>
      </Stack>
      <AdminGridContainer>
        <AdminDataGrid
          autoHeight={false}
          rows={ledger.map((r, i) => ({ id: r.entry_id ?? r._id ?? i, ...r }))}
          columns={ledgerCols}
          loading={loading}
        />
      </AdminGridContainer>
    </Stack>
  )
}
