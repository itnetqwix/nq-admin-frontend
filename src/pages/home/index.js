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
import { useTheme } from '@mui/material/styles'
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
  const theme = useTheme()
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
        {/* Realtime API Telemetry Status Banner */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Box
              sx={theme => ({
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                px: { xs: 2, sm: 2.5 },
                py: 1.5,
                borderRadius: '14px',
                border: `1px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'
                }`,
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(17, 24, 39, 0.7) 100%)'
                    : 'rgba(248, 250, 252, 0.9)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              })}
            >
              <Chip
                component='span'
                size='small'
                label={socketConnected ? 'Realtime connected' : 'Realtime connecting'}
                sx={theme => ({
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                  borderRadius: '9999px',
                  border: `1px solid ${
                    socketConnected
                      ? 'rgba(16, 185, 129, 0.35)'
                      : theme.palette.mode === 'dark'
                      ? 'rgba(71, 85, 105, 0.5)'
                      : 'rgba(203, 213, 225, 0.8)'
                  }`,
                  bgcolor: socketConnected
                    ? 'rgba(16, 185, 129, 0.12)'
                    : theme.palette.mode === 'dark'
                    ? 'rgba(30, 41, 59, 0.6)'
                    : 'rgba(241, 245, 249, 0.9)',
                  color: socketConnected
                    ? '#34D399'
                    : theme.palette.mode === 'dark'
                    ? '#94A3B8'
                    : '#64748B'
                })}
              />
              <Typography
                variant='body2'
                sx={theme => ({
                  color: theme.palette.mode === 'dark' ? '#94A3B8' : '#64748B',
                  fontSize: '0.85rem'
                })}
              >
                Env banner (top) shows API host — <strong style={{ color: theme.palette.mode === 'dark' ? '#E2E8F0' : '#1E293B' }}>{getAdminApiEnvLabel()}</strong>
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3} className='match-height'>
          {/* Global Commission Banner (Hero Slate-Glass Card) */}
          <Grid item xs={12}>
            <Box
              sx={theme => ({
                borderRadius: '16px',
                border: `1px solid ${
                  theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.9)'
                }`,
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(17, 24, 39, 0.92) 50%, rgba(30, 27, 75, 0.45) 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                backdropFilter: 'blur(20px)',
                p: { xs: 2.5, sm: 3 },
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2.5
              })}
            >
              {/* Left Side: Title & Subtitle */}
              <Box sx={{ maxWidth: { sm: '70%', md: '75%' } }}>
                <Typography
                  sx={theme => ({
                    color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0F172A',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    letterSpacing: '-0.01em',
                    mb: 0.5
                  })}
                >
                  Global commission
                </Typography>
                <Typography
                  sx={theme => ({
                    color: theme.palette.mode === 'dark' ? '#94A3B8' : '#64748B',
                    fontSize: '0.875rem',
                    lineHeight: 1.45
                  })}
                >
                  Applies to all trainers across the platform. Use the edit control to update the platform commission rate.
                </Typography>
              </Box>

              {/* Right Side: Rate Display & Edit Button */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  alignSelf: { xs: 'flex-start', sm: 'center' }
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '1.85rem', sm: '2.25rem' },
                    fontWeight: 800,
                    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {comission?.commission ?? 0}%
                </Typography>
                {canEditCommission ? (
                  <Box
                    component='button'
                    onClick={openComissionModal}
                    title='Edit Global Commission'
                    sx={theme => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1.25,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: `1px solid ${
                        theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.9)'
                      }`,
                      bgcolor:
                        theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)',
                      color: theme.palette.mode === 'dark' ? '#CBD5E1' : '#334155',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor:
                          theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.9)' : 'rgba(226, 232, 240, 1)',
                        borderColor:
                          theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.4)',
                        color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#0F172A',
                        transform: 'scale(1.04)'
                      },
                      '&:active': {
                        transform: 'scale(0.98)'
                      }
                    })}
                  >
                    <Icon icon='tabler:edit' fontSize={20} />
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Grid>

          {/* Operational & Metric Cards (4-Column Grid) */}
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
              color='error'
              stats={metrics != null ? fmtInt(metrics.opsCallPreflightFailures24h ?? 0) : '—'}
              trendNumber='24h'
              trend='positive'
              title='ICE / call failures'
              chipText='Preflight & call errors'
              icon={<Icon icon='mdi:video-off-outline' />}
              onCardClick={() => router.push('/apps/ops?tab=calls&eventType=CLIENT_PRECALL_CHECK')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CardStatisticsVertical
              color='warning'
              stats={metrics != null ? fmtInt(metrics.pendingTrainerReview ?? 0) : '—'}
              trendNumber='Review'
              trend='positive'
              title='Pending trainer review'
              chipText='Profile approval'
              icon={<Icon icon='mdi:account-clock-outline' />}
              onCardClick={() => router.push('/apps/manage-trainer?status=pending')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CardStatisticsVertical
              color='error'
              stats='Open'
              trendNumber='BullMQ'
              trend='positive'
              title='Failed jobs'
              chipText='PDF / reminders'
              icon={<Icon icon='mdi:alert-octagon-outline' />}
              onCardClick={() => router.push('/apps/ops?tab=jobs')}
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
              onCardClick={() => router.push('/apps/ops?tab=calls')}
            />
          </Grid>

          {/* Live Session & Financial Metric Cards (Bottom Row) */}
          <Grid item xs={12} sm={6} lg={4}>
            <AnalyticsTotalRevenue
              valueText={metrics ? fmtMoney(metrics.totalRevenue) : '—'}
              trendText={liveHint}
              trendPositive={socketConnected}
              chipSubtext='Paid bookings (excl. canceled)'
              onClick={() => router.push('/apps/booking?focus=paid')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2}>
            <CardStatisticsVertical
              color='info'
              stats={metrics ? fmtInt(metrics.totalImpressions) : '—'}
              trendNumber={liveHint}
              trend='positive'
              chipText='Published clips'
              title='Total Impressions'
              icon={<Icon icon='mdi:link' />}
              onCardClick={() => router.push('/apps/manage-trainer')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2}>
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
          <Grid item xs={12} sm={6} lg={2}>
            <CardStatisticsVertical
              stats={metrics ? fmtInt(metrics.totalOrders) : '—'}
              color='primary'
              trendNumber={liveHint}
              trend='positive'
              title='Total Orders'
              chipText='Paid bookings'
              icon={<Icon icon='mdi:cart-plus' />}
              onCardClick={() => router.push('/apps/booking')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2}>
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
