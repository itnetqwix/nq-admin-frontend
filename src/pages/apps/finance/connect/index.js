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
  const [kycFilter, setKycFilter] = useState('all')
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

  const kycVerified = useMemo(() => rows.filter(r => r.is_kyc_completed).length, [rows])
  const kycPending = useMemo(() => rows.filter(r => !r.is_kyc_completed).length, [rows])

  const filteredRows = useMemo(() => {
    if (kycFilter === 'verified') return rows.filter(r => r.is_kyc_completed)
    if (kycFilter === 'incomplete') return rows.filter(r => !r.is_kyc_completed)
    return rows
  }, [rows, kycFilter])

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
        field: 'is_kyc_completed',
        headerName: 'KYC',
        width: 120,
        renderCell: params => (
          <Chip
            size='small'
            label={params.row.is_kyc_completed ? 'Verified' : 'Incomplete'}
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: params.row.is_kyc_completed ? '#AAFFEC' : ops.softAmber,
              color: params.row.is_kyc_completed ? '#1A8F76' : '#ab570a'
            }}
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

  const chipSx = active => ({
    borderRadius: ops.radiusPill,
    textTransform: 'none',
    fontSize: 13,
    px: 2,
    minHeight: 36,
    color: active ? ops.onNight : ops.body,
    bgcolor: active ? ops.ink : ops.canvas,
    border: `1px solid ${active ? ops.ink : ops.hairline}`
  })

  return (
    <AdminPageShell
      bare
      eyebrow='Revenue · connect'
      icon='mdi:bank-transfer'
      title='Stripe Connect.'
      subtitle='Trainer Connect accounts, KYC, and payout preferences.'
      actions={
        <Stack direction='row' spacing={1}>
          <Chip component={Link} href='/apps/finance' label='Finance' clickable variant='outlined' size='small' />
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:bank' label='Accounts' value={fmtInt(total)} hint='Matching search' tone='accent' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:check-decagram' label='KYC verified' value={fmtInt(kycVerified)} hint='Current page' tone='success' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:alert-outline'
            label='KYC incomplete'
            value={fmtInt(kycPending)}
            hint='Current page'
            tone={kycPending > 0 ? 'warn' : 'default'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:filter' label='View' value={kycFilter} hint='Chip filter' />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
          {[
            ['all', 'All'],
            ['verified', 'KYC verified'],
            ['incomplete', 'KYC incomplete']
          ].map(([key, label]) => (
            <Button key={key} onClick={() => setKycFilter(key)} sx={chipSx(kycFilter === key)}>
              {label}
            </Button>
          ))}
        </Stack>
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
            rows={filteredRows}
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
            emptyDescription='Try a broader search or clear KYC filter.'
          />
        </AdminGridContainer>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}

export default ConnectAccountsPage
