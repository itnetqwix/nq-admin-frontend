import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getReferralDashboard } from 'src/services/referralAdminApi'
import { ops } from 'src/styles/opsSurface'

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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='Invites sent'
            value={String(summary.invitesTotal ?? 0)}
            hint={`${summary.invitesRegistered ?? 0} joined`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile label='Attributions' value={String(summary.attributionsTotal ?? 0)} hint='Linked accounts' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='Referral points issued'
            value={fmtPts(summary.referralPointsIssued)}
            hint={`${summary.rewardsCreditedCount ?? 0} credited rewards`}
            tone='accent'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='Points redeemed'
            value={fmtMoney(summary.pointsRedeemedWalletMinor)}
            hint={`${summary.pointsRedemptionsCount ?? 0} redemptions · ${fmtPts(summary.pointsRedeemedTotal)} burned`}
          />
        </Grid>
      </Grid>

      <Box sx={{ p: 2.5, mb: 3, bgcolor: ops.canvas, borderRadius: ops.radiusLg, boxShadow: ops.shadowCard }}>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>
          Referral earn matrix (points).
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
          Redeem in the app: 100 points = $5 wallet credit. Per-action cap: 5 points.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {matrixChips.map(row => {
            const p = row.preview ?? {}
            const bits = [
              p.referrerSignupPoints > 0 && `referrer signup ${p.referrerSignupPoints} pts`,
              p.refereeSignupPoints > 0 && `referee signup ${p.refereeSignupPoints} pts`,
              p.referrerFirstBookingPoints > 0 && `referrer first booking ${p.referrerFirstBookingPoints} pts`
            ].filter(Boolean)
            return (
              <Box key={row.label} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <Chip
                  size='small'
                  label={row.label}
                  variant='outlined'
                  sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
                />
                {bits.length ? (
                  bits.map(b => <Chip key={b} size='small' label={b} sx={{ fontFamily: ops.mono, fontSize: 11 }} />)
                ) : (
                  <Typography sx={{ fontSize: 12, color: ops.mute }}>No points for this pair</Typography>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>

      <Box sx={{ p: 2.5, mb: 3, bgcolor: ops.canvas, borderRadius: ops.radiusLg, boxShadow: ops.shadowCard }}>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1 }}>
          First lesson checkout discount.
        </Typography>
        <Alert severity='info' sx={{ mb: 1.5, borderRadius: ops.radiusSm }}>
          Dollar checkout discounts for referred trainees are disabled; rewards are points-only.
        </Alert>
        <Chip
          size='small'
          label={cfg.enabled ? 'Enabled (legacy config)' : 'Disabled'}
          sx={{
            fontFamily: ops.mono,
            fontSize: 11,
            bgcolor: cfg.enabled ? ops.errorSoft : ops.canvasSoft2,
            color: cfg.enabled ? ops.warning : ops.mute
          }}
        />
      </Box>

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
