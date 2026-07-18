// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import { ops } from 'src/styles/opsSurface'

import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import authConfig from 'src/configs/auth'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { getAdminApiEnvLabel } from 'src/configs/adminEnv'
import Chip from '@mui/material/Chip'
import Modal from '../components/modal/Modal'
import CommissionForm from 'src/layouts/components/student/CommissionForm'
import CustomAvatar from 'src/@core/components/mui/avatar'
import ActiveUsersTable from '../components/tables/UsersTable'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { getPendingVerificationCount } from 'src/services/verificationApi'
import { getPendingTraineeCount } from 'src/services/clipsAdminApi'

const Home = () => {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const canEditCommission = ability?.can('update', 'admin-action-commission') ?? true
  const { metrics, socketConnected } = useAdminRealtime()

  const [comission, setComission] = useState([]);
  const [commissionModal, setComissionModal] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState(null);
  const [pendingTraineeReviews, setPendingTraineeReviews] = useState(null);

  useEffect(() => {
    getPendingVerificationCount()
      .then(setPendingVerifications)
      .catch(() => setPendingVerifications(0))
    getPendingTraineeCount()
      .then(setPendingTraineeReviews)
      .catch(() => setPendingTraineeReviews(0))
  }, [])

  const fmtMoney = v =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      Number(v) || 0
    )
  const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)
  const liveHint = socketConnected ? 'Live' : '…'

  useEffect(() => {
    getGlobalCommission()
  }, [])

  const getGlobalCommissionApi = async () => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (storedToken) {
      return await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/admin/get-global-commission', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      }).then(data => {
        return data.json();
      })
        .then(async response => {
          return response?.result
        })
    }
  }

  async function getGlobalCommission() {
    const res = await getGlobalCommissionApi()
    if (res?.length) {
      setComission(res[0])
      if (commissionModal) {
        closeComissionModal()
      }
    }
  }

  function openComissionModal() {
    setComissionModal(true)
  }

  function closeComissionModal() {
    setComissionModal(false)
  }

  return (
    <>
      <AdminPageShell
        bare
        eyebrow='Overview'
        title={
          <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            Platform overview.
            <Box
              component='span'
              sx={{
                px: 1,
                py: 0.15,
                bgcolor: socketConnected ? ops.lime : ops.canvasSoft2,
                color: ops.night,
                borderRadius: '4px',
                fontFamily: ops.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em'
              }}
            >
              {socketConnected ? 'LIVE' : '…'}
            </Box>
          </Box>
        }
        subtitle='Metrics, queues, and shortcuts — same Ops Surface chrome as the rest of admin.'
        actions={
          <Chip
            size='small'
            label={getAdminApiEnvLabel()}
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              borderColor: ops.hairline,
              bgcolor: ops.canvas,
              color: ops.body
            }}
            variant='outlined'
          />
        }
      >
        <Grid container spacing={2} className='match-height'>
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2.5,
                bgcolor: ops.canvas,
                borderRadius: ops.radiusLg,
                boxShadow: ops.shadowCard,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}
            >
              <Box>
                <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Global commission
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 14, color: ops.body }}>
                  Applies to all trainers.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.96px', fontVariantNumeric: 'tabular-nums' }}>
                  {comission?.commission ?? 0}%
                </Typography>
                {canEditCommission ? (
                  <CustomAvatar
                    skin='light'
                    variant='rounded'
                    sx={{ bgcolor: ops.canvasSoft2, color: ops.ink, cursor: 'pointer', borderRadius: ops.radiusSm }}
                    onClick={openComissionModal}
                  >
                    <Icon icon='tabler:edit' />
                  </CustomAvatar>
                ) : null}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Active banners' value={metrics != null ? fmtInt(metrics.activeBanners ?? 0) : '—'} hint='CMS' onClick={() => router.push('/apps/banners')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Active tips' value={metrics != null ? fmtInt(metrics.activeTips ?? 0) : '—'} hint='CMS offers' onClick={() => router.push('/apps/tips')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              label='Banner placements'
              value={
                metrics != null
                  ? `${fmtInt(metrics.activeBannersHero ?? 0)}/${fmtInt(metrics.activeBannersStrip ?? 0)}/${fmtInt(metrics.activeBannersSticky ?? 0)}`
                  : '—'
              }
              hint='hero · strip · sticky'
              onClick={() => router.push('/apps/cms')}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Support tickets' value={metrics != null ? fmtInt(metrics.openSupportTickets ?? 0) : '—'} hint='Open queue' tone='warn' onClick={() => router.push('/apps/concern-by-user')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='User feedback' value={metrics != null ? fmtInt(metrics.openUserFeedback ?? 0) : '—'} hint='Open queue' onClick={() => router.push('/apps/write-by-user')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Pending refunds' value={metrics != null ? fmtInt(metrics.bookingsPendingRefund ?? 0) : '—'} hint='Canceled w/ payment' tone='danger' onClick={() => router.push('/apps/booking')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='New users (7d)' value={metrics != null ? fmtInt(metrics.newUsersLast7Days ?? 0) : '—'} hint='Trainers + trainees' onClick={() => router.push('/apps/manage-trainer')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Call diagnostics' value='Open' hint='Quality & events' accent onClick={() => router.push('/apps/call-diagnostics')} tone='accent' />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Trainer verifications' value={pendingVerifications != null ? fmtInt(pendingVerifications) : '—'} hint='Pending review' onClick={() => router.push('/apps/trainer-verifications')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Trainee reviews' value={pendingTraineeReviews != null ? fmtInt(pendingTraineeReviews) : '—'} hint='Pending review' tone='warn' onClick={() => router.push('/apps/trainee-account-reviews')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Critical ops (24h)' value={metrics != null ? fmtInt(metrics.opsCriticalOpen24h ?? 0) : '—'} hint='Open / investigating' tone='danger' onClick={() => router.push('/apps/ops-logs?severity=critical')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Instant failures (24h)' value={metrics != null ? fmtInt(metrics.opsInstantFailures24h ?? 0) : '—'} hint='Lesson errors' tone='warn' onClick={() => router.push('/apps/ops-logs?instant_only=true')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Call preflight (24h)' value={metrics != null ? fmtInt(metrics.opsCallPreflightFailures24h ?? 0) : '—'} hint='Connection' onClick={() => router.push('/apps/ops-logs?category=connection')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile label='Platform activity' value='Open' hint='Who · when · what' tone='accent' onClick={() => router.push('/apps/platform-activity')} />
          </Grid>

          <Grid item xs={12} md={8} container spacing={2}>
            <Grid item xs={12} sm={6}>
              <OpsMetricTile
                label='Total revenue'
                value={metrics ? fmtMoney(metrics.totalRevenue) : '—'}
                hint={`Paid bookings · ${liveHint}`}
                tone='accent'
                onClick={() => router.push('/apps/booking?focus=paid')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <OpsMetricTile
                label='Impressions'
                value={metrics ? fmtInt(metrics.totalImpressions) : '—'}
                hint='Published clips'
                onClick={() => router.push('/apps/manage-trainer')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <OpsMetricTile
                label='Trainers / trainees'
                value={
                  metrics
                    ? `${fmtInt(metrics.trainersCount)} / ${fmtInt(metrics.traineesCount)}`
                    : '—'
                }
                hint={`Completion ${metrics?.overviewCompletionPercent ?? 0}%`}
                onClick={() => router.push('/apps/booking')}
              />
            </Grid>
          </Grid>
          <Grid item xs={6} md={2}>
            <OpsMetricTile
              label='Total orders'
              value={metrics ? fmtInt(metrics.totalOrders) : '—'}
              hint='Paid bookings'
              onClick={() => router.push('/apps/booking')}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <OpsMetricTile
              label='Total sessions'
              value={metrics ? fmtInt(metrics.totalSessions) : '—'}
              hint={liveHint}
              onClick={() => router.push('/apps/booking')}
            />
          </Grid>
        </Grid>
      </AdminPageShell>

      <ActiveUsersTable />
      {/* -----------------Modal Commission Edit--------------- */}

      <Modal handleClose={closeComissionModal} open={commissionModal} maxWidth='xs'>
        {canEditCommission ? <CommissionForm getGlobalCommission={getGlobalCommission} /> : null}
      </Modal>
    </>
  )
}

export default Home
