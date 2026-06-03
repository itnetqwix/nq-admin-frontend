import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'
import { getReferralDashboard } from 'src/services/referralAdminApi'

const fmtMoney = minor =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    (Number(minor) || 0) / 100
  )

const fmtUsd = v =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v) || 0)

const ReferralsAdminPage = () => {
  const [tab, setTab] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const dash = await getReferralDashboard()
      setData(dash)
    } catch (e) {
      setError(e?.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const summary = data?.summary ?? {}
  const cfg = data?.firstLessonDiscount ?? {}

  const rewardCols = useMemo(
    () => [
      { field: 'beneficiary_role', headerName: 'Role', width: 100 },
      { field: 'trigger', headerName: 'Trigger', width: 120 },
      {
        field: 'amount_minor',
        headerName: 'Amount',
        width: 100,
        valueGetter: p => fmtMoney(p.row.amount_minor)
      },
      { field: 'status', headerName: 'Status', width: 110 },
      {
        field: 'beneficiary',
        headerName: 'User',
        flex: 1,
        minWidth: 160,
        valueGetter: p => p.row.beneficiary?.fullname || p.row.beneficiary?.email || '—'
      },
      {
        field: 'createdAt',
        headerName: 'When',
        width: 180,
        valueGetter: p =>
          p.row.createdAt ? new Date(p.row.createdAt).toLocaleString() : '—'
      }
    ],
    []
  )

  const attrCols = useMemo(
    () => [
      {
        field: 'referrer',
        headerName: 'Referrer',
        flex: 1,
        minWidth: 140,
        valueGetter: p => p.row.referrer?.fullname || '—'
      },
      {
        field: 'referee',
        headerName: 'Referee',
        flex: 1,
        minWidth: 140,
        valueGetter: p => p.row.referee?.fullname || '—'
      },
      { field: 'referrer_account_type', headerName: 'Ref type', width: 100 },
      { field: 'referee_account_type', headerName: 'New type', width: 100 },
      {
        field: 'first_lesson_discount_used',
        headerName: '1st lesson $',
        width: 110,
        valueGetter: p =>
          p.row.first_lesson_discount_used
            ? fmtUsd(p.row.first_lesson_discount_amount)
            : '—'
      },
      {
        field: 'createdAt',
        headerName: 'Linked',
        width: 170,
        valueGetter: p =>
          p.row.createdAt ? new Date(p.row.createdAt).toLocaleString() : '—'
      }
    ],
    []
  )

  const pairRows = (data?.byPair ?? []).map((p, i) => ({
    id: i,
    ...p
  }))

  return (
    <AdminPageShell
      title='Referrals'
      subtitle='Invites, attributions, wallet rewards, and first-lesson checkout discounts.'
      actions={<AdminRefreshButton onClick={load} loading={loading} />}
    >
      {error ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {!data?.enabled ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Referral program is disabled (REFERRAL_ENABLED=false).
        </Alert>
      ) : null}

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatisticsVertical
            stats={String(summary.invitesTotal ?? 0)}
            title='Invites sent'
            subtitle={`${summary.invitesRegistered ?? 0} joined`}
            icon='mdi:email-send-outline'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatisticsVertical
            stats={String(summary.attributionsTotal ?? 0)}
            title='Attributions'
            subtitle='Linked accounts'
            icon='mdi:account-multiple-plus-outline'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatisticsVertical
            stats={fmtMoney(summary.rewardsCreditedMinor)}
            title='Wallet credited'
            subtitle={`${summary.rewardsCreditedCount ?? 0} payouts`}
            icon='mdi:wallet-outline'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatisticsVertical
            stats={fmtUsd(summary.checkoutDiscountDollars)}
            title='Checkout discounts'
            subtitle={`${summary.checkoutDiscountsUsed ?? 0} first lessons`}
            icon='mdi:tag-outline'
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>
            First lesson checkout discount (stacks with promo)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              size='small'
              label={cfg.enabled ? 'Enabled' : 'Disabled'}
              color={cfg.enabled ? 'success' : 'default'}
            />
            <Chip size='small' label={`Type: ${cfg.discountType || 'fixed_amount'}`} />
            <Chip
              size='small'
              label={
                cfg.discountType === 'percentage'
                  ? `Value: ${cfg.discountValue}%`
                  : `Value: ${fmtUsd(cfg.discountValue)}`
              }
            />
            <Chip size='small' label={`Max: ${fmtUsd(cfg.maxDiscountDollars)}`} />
          </Box>
        </CardContent>
      </Card>

      <AdminPageSection title='Attributions by pair'>
        <AdminGridContainer>
          <AdminDataGrid
            rows={pairRows}
            columns={[
              { field: 'referrerType', headerName: 'Referrer', width: 120 },
              { field: 'refereeType', headerName: 'Referee', width: 120 },
              { field: 'attributions', headerName: 'Count', width: 100 }
            ]}
            loading={loading}
            autoHeight
            hideFooter
          />
        </AdminGridContainer>
      </AdminPageSection>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label='Recent rewards' />
        <Tab label='Recent attributions' />
      </Tabs>

      <AdminGridContainer>
        {tab === 0 ? (
          <AdminDataGrid
            rows={(data?.recentRewards ?? []).map((r, i) => ({ id: r._id || i, ...r }))}
            columns={rewardCols}
            loading={loading}
            autoHeight
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          />
        ) : (
          <AdminDataGrid
            rows={(data?.recentAttributions ?? []).map((a, i) => ({ id: a._id || i, ...a }))}
            columns={attrCols}
            loading={loading}
            autoHeight
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          />
        )}
      </AdminGridContainer>
    </AdminPageShell>
  )
}

export default ReferralsAdminPage
