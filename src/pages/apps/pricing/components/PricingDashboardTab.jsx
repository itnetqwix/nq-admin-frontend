import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useEffect, useState } from 'react'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fmtMoney, fmtPct } from 'src/constants/pricingAdmin'
import { fetchUnitEconomics } from 'src/services/pricingApi'

function FlowStep({ n, title, body }) {
  return (
    <Box sx={{ flex: 1, minWidth: 140 }}>
      <Chip size='small' label={`Step ${n}`} sx={{ mb: 1 }} />
      <Typography variant='subtitle2' fontWeight={700}>
        {title}
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
        {body}
      </Typography>
    </Box>
  )
}

export default function PricingDashboardTab({ config, onGoTab }) {
  const us = config?.regions?.US
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setHealthLoading(true)
      try {
        const data = await fetchUnitEconomics({
          region: 'US',
          days: 30,
          draftConfig: config,
          useSavedInfra: true
        })
        setHealth(data)
      } catch {
        setHealth(null)
      } finally {
        setHealthLoading(false)
      }
    })()
  }, [config])

  const profitable = health?.actuals?.profitable
  const netPerLesson = health?.actuals?.estimatedNetPerLessonCents
  const lossScenarios = (health?.scenarios || []).filter(s => !s.economics?.profitable).length

  return (
    <Stack spacing={3}>
      <Card variant='outlined' sx={{ bgcolor: 'primary.50', borderColor: 'primary.light' }}>
        <CardContent>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            What this page does
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 720, mb: 2 }}>
            Set how much NetQwix keeps from each lesson, then check whether a typical session is
            profitable after AWS, video, and payment costs.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant='contained' onClick={() => onGoTab(1)}>
              Set commission & fees
            </Button>
            <Button variant='outlined' onClick={() => onGoTab(2)}>
              Check profit on a session
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                US commission
              </Typography>
              <Typography variant='h4' fontWeight={800}>
                {fmtPct(us?.defaultCommissionRate)}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                + {fmtMoney(us?.traineePlatformFeeMinor, 'USD')} trainee /{' '}
                {fmtMoney(us?.trainerPlatformFeeMinor, 'USD')} coach fees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                Profit health (last 30d)
              </Typography>
              {healthLoading ? (
                <CircularProgress size={28} sx={{ mt: 1 }} />
              ) : health ? (
                <>
                  <Stack direction='row' alignItems='center' spacing={1} sx={{ mt: 0.5 }}>
                    {profitable ? (
                      <TrendingUpIcon color='success' />
                    ) : (
                      <TrendingDownIcon color='error' />
                    )}
                    <Typography variant='h5' fontWeight={800} color={profitable ? 'success.main' : 'error.main'}>
                      {profitable ? 'On track' : 'Review rates'}
                    </Typography>
                  </Stack>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                    ~{fmtMoney(netPerLesson || 0, 'USD')} net / lesson (est.)
                    {health.actuals?.completedSessions
                      ? ` · ${health.actuals.completedSessions} sessions`
                      : ''}
                  </Typography>
                  {lossScenarios > 0 ? (
                    <Chip
                      size='small'
                      color='warning'
                      label={`${lossScenarios} scenario(s) at a loss`}
                      sx={{ mt: 1 }}
                    />
                  ) : null}
                </>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Open Profit check to load estimates.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                Active config
              </Typography>
              <Typography variant='h4' fontWeight={800}>
                v{config?.version ?? 1}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Changes apply to new bookings only. Existing escrow keeps its snapshot.
              </Typography>
              <Button size='small' sx={{ mt: 1.5 }} onClick={() => onGoTab(3)}>
                View history
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <AdminPageSection title='How money flows on each lesson'>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}
        >
          <FlowStep
            n={1}
            title='Trainee pays'
            body='Session price + small platform fee + card processing + tax.'
          />
          <FlowStep
            n={2}
            title='You hold in escrow'
            body='Funds stay held until the lesson completes and both sides rate.'
          />
          <FlowStep
            n={3}
            title='Coach is paid'
            body='Session price minus your % commission minus coach platform fee.'
          />
          <FlowStep
            n={4}
            title='You keep'
            body='Commission + both platform fees, minus infra & Stripe costs.'
          />
        </Stack>
      </AdminPageSection>
    </Stack>
  )
}
