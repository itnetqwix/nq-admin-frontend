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

const fmtPts = n => `${Number(n) || 0} pts`

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
  const matrix = data?.rewardMatrixPoints ?? {}

  const rewardCols = useMemo(
    () => [
      { field: 'beneficiary_role', headerName: 'Role', width: 100 },
      { field: 'trigger', headerName: 'Trigger', width: 120 },
      {
        field: 'points_awarded',
        headerName: 'Points',
        width: 90,
        valueGetter: p => fmtPts(p.row.points_awarded)
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

  const matrixChips = [
    { label: 'Trainer → Trainee', preview: matrix.trainerInviteTrainee },
    { label: 'Trainer → Trainer', preview: matrix.trainerInviteTrainer },
    { label: 'Trainee → Trainee', preview: matrix.traineeInviteTrainee },
    { label: 'Trainee → Trainer', preview: matrix.traineeInviteTrainer }
  ]

  return (
    <AdminPageShell
      title='Referrals & points'
      subtitle='Invites, attributions, referral points (1–5 per event), and wallet redemptions (100 pts = $5).'
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
            stats={fmtPts(summary.referralPointsIssued)}
            title='Referral points issued'
            subtitle={`${summary.rewardsCreditedCount ?? 0} credited rewards`}
            icon='mdi:star-circle-outline'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardStatisticsVertical
            stats={fmtMoney(summary.pointsRedeemedWalletMinor)}
            title='Points redeemed'
            subtitle={`${summary.pointsRedemptionsCount ?? 0} redemptions · ${fmtPts(summary.pointsRedeemedTotal)} burned`}
            icon='mdi:wallet-outline'
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>
            Referral earn matrix (points)
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Redeem in the app: 100 points = $5 wallet credit. Per-action cap: 5 points.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {matrixChips.map(row => {
              const p = row.preview ?? {}
              const bits = [
                p.referrerSignupPoints > 0 && `referrer signup ${p.referrerSignupPoints} pts`,
                p.refereeSignupPoints > 0 && `referee signup ${p.refereeSignupPoints} pts`,
                p.referrerFirstBookingPoints > 0 &&
                  `referrer first booking ${p.referrerFirstBookingPoints} pts`
              ].filter(Boolean)
              return (
                <Box
                  key={row.label}
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
                >
                  <Chip size='small' label={row.label} variant='outlined' />
                  {bits.length ? (
                    bits.map(b => <Chip key={b} size='small' label={b} />)
                  ) : (
                    <Typography variant='caption' color='text.secondary'>
                      No points for this pair
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>
            First lesson checkout discount
          </Typography>
          <Alert severity='info' sx={{ mb: 1 }}>
            Dollar checkout discounts for referred trainees are disabled; rewards are points-only.
          </Alert>
          <Chip
            size='small'
            label={cfg.enabled ? 'Enabled (legacy config)' : 'Disabled'}
            color={cfg.enabled ? 'warning' : 'default'}
          />
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
