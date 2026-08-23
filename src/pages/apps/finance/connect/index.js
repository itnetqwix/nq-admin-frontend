import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { getConnectAccounts } from 'src/services/financeApi'
import { ops } from 'src/styles/opsSurface'

function formatPayoutPreference(pref) {
  if (!pref) return '—'
  if (pref === 'wallet_fast') return 'Wallet (fast)'
  if (pref === 'bank_standard') return 'Bank (standard)'
  return String(pref)
}

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

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
    void load()
  }, [load])

  const cols = useMemo(
    () => [
      {
        field: 'fullname',
        headerName: 'Trainer',
        flex: 1,
        minWidth: 160,
        renderCell: params => (
          <Button size='small' component={Link} href={`/apps/users/${params.row._id}`} sx={{ textTransform: 'none' }}>
            {params.row.fullname || '—'}
          </Button>
        )
      },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
      {
        field: 'stripe_account_id',
        headerName: 'Stripe account',
        flex: 1,
        minWidth: 180,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }} noWrap>
            {p.value || '—'}
          </Typography>
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
      bare
      eyebrow='Revenue · connect'
      icon='mdi:bank-transfer'
      title='Stripe Connect.'
      subtitle='Directory of existing trainer Connect account ids. New coaches are wallet-first — this is not a live onboarding tool.'
      actions={
        <Stack direction='row' spacing={1}>
          <Chip component={Link} href='/apps/finance' label='Finance' clickable variant='outlined' size='small' />
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <OpsMetricTile icon='mdi:bank' label='Connect accounts' value={fmtInt(total)} hint='Matching search' tone='accent' />
        </Grid>
        <Grid item xs={12} sm={6}>
          <OpsMetricTile icon='mdi:page-layout-body' label='This page' value={fmtInt(rows.length)} hint={`Up to ${pageSize} rows`} />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: { xs: 2, sm: 3 } }}>
        <AdminFilterBar
          searchPlaceholder='Search name, email, or account id'
          searchValue={searchQ}
          onSearchChange={e => setSearchQ(e.target.value)}
          onSearchSubmit={() => {
            setPage(1)
            void load()
          }}
          onRefresh={() => void load()}
          refreshLoading={loading}
          resultCount={total}
        />
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
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: ops.canvasSoft, borderBottom: `1px solid ${ops.hairline}` },
              '& .MuiDataGrid-cell': { border: 'none' }
            }}
            emptyMessage='No Connect accounts'
            emptyDescription='Try a broader search.'
          />
        </AdminGridContainer>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}

export default ConnectAccountsPage
