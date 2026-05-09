// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

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
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'

const Home = () => {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const canEditCommission = ability?.can('update', 'admin-action-commission') ?? true
  const { metrics, socketConnected } = useAdminRealtime()

  const [comission, setComission] = useState([]);
  const [commissionModal, setComissionModal] = useState(false);

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
      <ApexChartWrapper>
        <Grid container spacing={6} className='match-height' sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Alert severity='info' icon={false} sx={{ py: 0.5 }}>
              <strong>API:</strong> {getAdminApiEnvLabel()}
              <Chip
                component='span'
                size='small'
                label={socketConnected ? 'Realtime connected' : 'Realtime connecting'}
                color={socketConnected ? 'success' : 'default'}
                sx={{ ml: 2, verticalAlign: 'middle' }}
              />
            </Alert>
          </Grid>
        </Grid>

        <Grid container spacing={6} className='match-height'>

          <Grid item xs={12}>
            <Card>
              <Grid container alignItems="center">
                <Grid item xs={10}>
                  <CardHeader title='Netqwix Global Commission 🚀' />
                  <CardContent>
                    <Typography sx={{ mb: 2 }}>The commission will apply from all trainers.</Typography>
                  </CardContent>
                </Grid>
                <Grid item xs={2} container >
                  <Typography variant="body1">{comission?.commission ?? 0}%</Typography>
                  {/* <IconButton aria-label="edit commission">
                    <EditIcon />
                  </IconButton> */}
                  {canEditCommission ? (
                    <CustomAvatar skin='light' variant='rounded' color='success' onClick={openComissionModal}>
                      <Icon icon='tabler:edit' />
                    </CustomAvatar>
                  ) : null}

                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} container spacing={3}>
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


      <ActiveUsersTable />
      {/* -----------------Modal Commission Edit--------------- */}

      <Modal handleClose={closeComissionModal} open={commissionModal} maxWidth='xs'>
        {canEditCommission ? <CommissionForm getGlobalCommission={getGlobalCommission} /> : null}
      </Modal>
    </>
  )
}

export default Home
