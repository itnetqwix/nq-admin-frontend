// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// ** Demo Components Imports
import AnalyticsSessions from 'src/views/dashboards/analytics/AnalyticsSessions'
import AnalyticsOverview from 'src/views/dashboards/analytics/AnalyticsOverview'
import AnalyticsTotalRevenue from 'src/views/dashboards/analytics/AnalyticsTotalRevenue'

import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import authConfig from 'src/configs/auth'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { getAdminApiEnvLabel } from 'src/configs/adminEnv'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Modal from '../components/modal/Modal'
import CommissionForm from 'src/layouts/components/student/CommissionForm'
import CustomAvatar from 'src/@core/components/mui/avatar'
import ActiveUsersTable from '../components/tables/UsersTable'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { getPendingVerificationCount } from 'src/services/verificationApi'

const Home = () => {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const canEditCommission = ability?.can('update', 'admin-action-commission') ?? true
  const { metrics, socketConnected } = useAdminRealtime()

  const [comission, setComission] = useState([]);
  const [commissionModal, setComissionModal] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState(null);

  useEffect(() => {
    getPendingVerificationCount()
      .then(setPendingVerifications)
      .catch(() => setPendingVerifications(0))
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
        title='Dashboard'
        subtitle='Live metrics, operational shortcuts, and platform health.'
        actions={
          <Chip
            size='small'
            label={socketConnected ? 'Realtime connected' : 'Realtime connecting'}
            color={socketConnected ? 'success' : 'default'}
            variant={socketConnected ? 'filled' : 'outlined'}
          />
        }
      >
      <ApexChartWrapper>
        <Grid container spacing={4} className='match-height' sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Alert severity='info' icon={false} sx={{ py: 0.5 }}>
              <strong>API:</strong> {getAdminApiEnvLabel()}
            </Alert>
          </Grid>
        </Grid>

        <Grid container spacing={4} className='match-height'>

          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Grid container alignItems='center' spacing={2} sx={{ px: 2, py: 1 }}>
                <Grid item xs={12} sm={10}>
                  <CardHeader title='Global commission' sx={{ px: 0, py: 1 }} titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
                  <CardContent sx={{ pt: 0, px: 0, pb: 2 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Applies to all trainers. Use the edit control to update the rate.
                    </Typography>
                  </CardContent>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                    <Typography variant='h6' fontWeight={600}>
                      {comission?.commission ?? 0}%
                    </Typography>
                    {canEditCommission ? (
                      <CustomAvatar skin='light' variant='rounded' color='primary' onClick={openComissionModal}>
                        <Icon icon='tabler:edit' />
                      </CustomAvatar>
                    ) : null}
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} container spacing={3}>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='primary'
                stats={metrics != null ? fmtInt(metrics.activeBanners ?? 0) : '—'}
                trendNumber='Live'
                trend='positive'
                title='Active banners'
                chipText='CMS'
                icon={<Icon icon='mdi:image-multiple-outline' />}
                onCardClick={() => router.push('/apps/banners')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='info'
                stats={metrics != null ? fmtInt(metrics.activeTips ?? 0) : '—'}
                trendNumber='Offers'
                trend='positive'
                title='Active tips'
                chipText='CMS'
                icon={<Icon icon='mdi:lightbulb-on-outline' />}
                onCardClick={() => router.push('/apps/tips')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='secondary'
                stats={
                  metrics != null
                    ? `${fmtInt(metrics.activeBannersHero ?? 0)} / ${fmtInt(metrics.activeBannersStrip ?? 0)} / ${fmtInt(metrics.activeBannersSticky ?? 0)}`
                    : '—'
                }
                trendNumber='H / S / B'
                trend='positive'
                title='Banner placements'
                chipText='hero · strip · sticky'
                icon={<Icon icon='mdi:view-dashboard-edit-outline' />}
                onCardClick={() => router.push('/apps/cms')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='warning'
                stats={metrics != null ? fmtInt(metrics.openSupportTickets ?? 0) : '—'}
                trendNumber='Queue'
                trend='positive'
                title='Open support tickets'
                chipText='raise_concern'
                icon={<Icon icon='mdi:lifebuoy' />}
                onCardClick={() => router.push('/apps/concern-by-user')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='secondary'
                stats={metrics != null ? fmtInt(metrics.openUserFeedback ?? 0) : '—'}
                trendNumber='Queue'
                trend='positive'
                title='Open user feedback'
                chipText='write_us'
                icon={<Icon icon='mdi:account-question' />}
                onCardClick={() => router.push('/apps/write-by-user')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='error'
                stats={metrics != null ? fmtInt(metrics.bookingsPendingRefund ?? 0) : '—'}
                trendNumber='Action'
                trend='positive'
                title='Bookings pending refund'
                chipText='Canceled w/ payment'
                icon={<Icon icon='mdi:cash-refund' />}
                onCardClick={() => router.push('/apps/booking')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='info'
                stats={metrics != null ? fmtInt(metrics.newUsersLast7Days ?? 0) : '—'}
                trendNumber='7d'
                trend='positive'
                title='New trainers + trainees'
                chipText='Last 7 days'
                icon={<Icon icon='mdi:account-multiple-plus' />}
                onCardClick={() => router.push('/apps/manage-trainer')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <CardStatisticsVertical
                color='primary'
                stats='Open'
                trendNumber=' '
                trend='positive'
                title='Call diagnostics'
                chipText='Quality & events'
                icon={<Icon icon='mdi:video-outline' />}
                onCardClick={() => router.push('/apps/call-diagnostics')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='secondary'
                stats={pendingVerifications != null ? fmtInt(pendingVerifications) : '—'}
                trendNumber='Queue'
                trend='positive'
                title='Trainer verifications'
                chipText='Pending review'
                icon={<Icon icon='mdi:account-check-outline' />}
                onCardClick={() => router.push('/apps/trainer-verifications')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='error'
                stats={metrics != null ? fmtInt(metrics.opsCriticalOpen24h ?? 0) : '—'}
                trendNumber='24h'
                trend='positive'
                title='Critical ops events'
                chipText='Open / investigating'
                icon={<Icon icon='mdi:alert-octagon-outline' />}
                onCardClick={() => router.push('/apps/ops-logs?severity=critical')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='warning'
                stats={metrics != null ? fmtInt(metrics.opsInstantFailures24h ?? 0) : '—'}
                trendNumber='24h'
                trend='positive'
                title='Instant lesson failures'
                chipText='Errors'
                icon={<Icon icon='mdi:flash-alert' />}
                onCardClick={() => router.push('/apps/ops-logs?instant_only=true')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <CardStatisticsVertical
                color='info'
                stats={metrics != null ? fmtInt(metrics.opsCallPreflightFailures24h ?? 0) : '—'}
                trendNumber='24h'
                trend='positive'
                title='Call preflight failures'
                chipText='Connection'
                icon={<Icon icon='mdi:phone-alert' />}
                onCardClick={() => router.push('/apps/ops-logs?category=connection')}
              />
            </Grid>
          </Grid>

          <Grid item xs={12} md={8} container spacing={6}>
            <Grid item xs={6}>
              <AnalyticsTotalRevenue
                valueText={metrics ? fmtMoney(metrics.totalRevenue) : '—'}
                trendText={liveHint}
                trendPositive={socketConnected}
                chipSubtext='Paid bookings (excl. canceled)'
                onClick={() => router.push('/apps/booking?focus=paid')}
              />
            </Grid>
            {/* <Grid item xs={3}>
              <CardStatisticsVertical
                stats='$13.4k'
                color='success'
                trendNumber='+38%'
                title={`Global Commission: ${comission?.commission ?? 0}%`}
                chipText='Last Six Month'
                icon={<Icon icon='tabler:edit' />}
                isCommission={true}
                onClick={openComissionModal}
              />
            </Grid> */}
            <Grid item xs={3}>
              <CardStatisticsVertical
                color='info'
                stats={metrics ? fmtInt(metrics.totalImpressions) : '—'}
                trendNumber={liveHint}
                trend='positive'
                chipText='Published clips (live)'
                title='Total Impressions'
                icon={<Icon icon='mdi:link' />}
                onCardClick={() => router.push('/apps/manage-trainer')}
              />
            </Grid>
            <Grid item xs={3}>
              <AnalyticsOverview
                valueText={
                  metrics
                    ? `${fmtInt(metrics.trainersCount)} / ${fmtInt(metrics.traineesCount)}`
                    : '—'
                }
                trendText={liveHint}
                trendPositive={socketConnected}
                radialPercent={metrics?.overviewCompletionPercent ?? 0}
                caption='Session completion rate'
                onClick={() => router.push('/apps/booking')}
              />
            </Grid>
          </Grid>
          <Grid item xs={6} md={2}>
            <CardStatisticsVertical
              stats={metrics ? fmtInt(metrics.totalOrders) : '—'}
              color='primary'
              trendNumber={liveHint}
              trend='positive'
              title='Total Orders'
              chipText='Paid bookings (live)'
              icon={<Icon icon='mdi:cart-plus' />}
              onCardClick={() => router.push('/apps/booking')}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <AnalyticsSessions
              valueText={metrics ? fmtInt(metrics.totalSessions) : '—'}
              trendText={liveHint}
              trendPositive={socketConnected}
              onClick={() => router.push('/apps/booking')}
            />
          </Grid>
        </Grid>
      </ApexChartWrapper>
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
