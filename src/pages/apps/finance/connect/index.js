import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import toast from 'react-hot-toast'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getConnectAccounts } from 'src/services/financeApi'

function formatPayoutPreference(pref) {
  if (!pref) return '—'
  if (pref === 'wallet_fast') return 'Wallet (fast)'
  if (pref === 'bank_standard') return 'Bank (standard)'
  return String(pref)
}

const ConnectAccountsPage = () => {
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const pageSize = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getConnectAccounts({ page, limit: pageSize, q: searchQ || undefined })
      setRows(r?.items ?? [])
      setTotal(r?.total ?? 0)
    } catch (e) {
      toast.error(e?.message || 'Failed to load Connect accounts')
    } finally {
      setLoading(false)
    }
  }, [page, searchQ])

  useEffect(() => {
    load()
  }, [load])

  const cols = useMemo(
    () => [
      {
        field: 'fullname',
        headerName: 'Trainer',
        flex: 1,
        minWidth: 160,
        renderCell: params => (
          <Button size='small' component={Link} href={`/apps/users/${params.row._id}`}>
            {params.row.fullname || '—'}
          </Button>
        )
      },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
      { field: 'stripe_account_id', headerName: 'Stripe account', flex: 1, minWidth: 180 },
      {
        field: 'is_kyc_completed',
        headerName: 'KYC',
        width: 100,
        renderCell: params => (
          <Chip
            size='small'
            label={params.row.is_kyc_completed ? 'Verified' : 'Incomplete'}
            color={params.row.is_kyc_completed ? 'success' : 'warning'}
            variant='outlined'
          />
        )
      },
      {
        field: 'payout_preference',
        headerName: 'Payout pref',
        width: 140,
        valueGetter: p => formatPayoutPreference(p.row.payout_preference)
      }
    ],
    []
  )

  return (
    <AdminPageShell
      icon='mdi:bank-transfer'
      title='Stripe Connect'
      subtitle='Trainer Connect accounts, KYC status, and payout preferences.'
      actions={
        <Stack direction='row' spacing={1}>
          <Button size='small' variant='outlined' component={Link} href='/apps/finance'>
            Back to Finance
          </Button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            size='small'
            label='Search name, email, or account id'
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Button
            size='small'
            variant='contained'
            onClick={() => {
              setPage(1)
              load()
            }}
          >
            Search
          </Button>
        </Stack>
        <AdminGridContainer>
          <AdminDataGrid
            rows={rows}
            columns={cols}
            loading={loading}
            getRowId={row => row._id}
            paginationMode='server'
            rowCount={total}
            paginationModel={{ page: page - 1, pageSize }}
            onPaginationModelChange={model => setPage(model.page + 1)}
          />
        </AdminGridContainer>
      </AdminPageSection>
    </AdminPageShell>
  )
}

export default ConnectAccountsPage
