import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useEffect, useState } from 'react'
import { OpsMetricTile, OpsSurfaceCard } from 'src/components/admin'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fmtMoney, fmtPct } from 'src/constants/pricingAdmin'
import { fetchUnitEconomics } from 'src/services/pricingApi'
import { ops } from 'src/styles/opsSurface'

function FlowStep({ n, title, body }) {
  return (
    <Box sx={{ flex: 1, minWidth: 140 }}>
      <Chip
        size='small'
        label={`Step ${n}`}
        sx={{ mb: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft2 }}
      />
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 14 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: ops.body, mt: 0.5, lineHeight: 1.5 }}>{body}</Typography>
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
    <Stack spacing={2.5}>
      <OpsSurfaceCard sx={{ bgcolor: ops.canvasSoft }}>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>What this page does.</Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, maxWidth: 720, mb: 2, lineHeight: 1.5 }}>
          Set how much NetQwix keeps from each lesson, then check whether a typical session is profitable
          after AWS, video, and payment costs.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant='contained' onClick={() => onGoTab(1)} sx={{ textTransform: 'none' }}>
            Set commission & fees
          </Button>
          <Button variant='outlined' onClick={() => onGoTab(2)} sx={{ textTransform: 'none' }}>
            Surge & peak pricing
          </Button>
          <Button variant='outlined' onClick={() => onGoTab(3)} sx={{ textTransform: 'none' }}>
            Check profit on a session
          </Button>
        </Stack>
      </OpsSurfaceCard>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <OpsMetricTile
            label='US commission'
            value={fmtPct(us?.defaultCommissionRate)}
            hint={`+ ${fmtMoney(us?.traineePlatformFeeMinor, 'USD')} trainee / ${fmtMoney(us?.trainerPlatformFeeMinor, 'USD')} coach fees`}
            tone='accent'
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <OpsSurfaceCard>
            <Typography
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                color: ops.mute,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb: 1
              }}
            >
              Profit health (last 30d)
            </Typography>
            {healthLoading ? (
              <CircularProgress size={24} sx={{ color: ops.ink }} />
            ) : health ? (
              <>
                <Stack direction='row' alignItems='center' spacing={1}>
                  {profitable ? (
                    <TrendingUpIcon sx={{ color: '#1A8F76' }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: ops.error }} />
                  )}
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 600,
                      letterSpacing: '-0.96px',
                      color: profitable ? '#1A8F76' : ops.error
                    }}
                  >
                    {profitable ? 'On track' : 'Review rates'}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 13, color: ops.body, mt: 1 }}>
                  ~{fmtMoney(netPerLesson || 0, 'USD')} net / lesson (est.)
                  {health.actuals?.completedSessions ? ` · ${health.actuals.completedSessions} sessions` : ''}
                </Typography>
                {lossScenarios > 0 ? (
                  <Chip
                    size='small'
                    label={`${lossScenarios} scenario(s) at a loss`}
                    sx={{ mt: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.errorSoft, color: ops.warning }}
                  />
                ) : null}
              </>
            ) : (
              <Typography sx={{ fontSize: 13, color: ops.mute }}>Open Profit check to load estimates.</Typography>
            )}
          </OpsSurfaceCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <OpsMetricTile
            label='Active config'
            value={`v${config?.version ?? 1}`}
            hint='New bookings only — existing escrow keeps its snapshot'
            onClick={() => onGoTab(3)}
          />
        </Grid>
      </Grid>

      <AdminPageSection title='How money flows on each lesson'>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ p: 2.5, borderRadius: ops.radiusLg, bgcolor: ops.canvasSoft }}
        >
          <FlowStep n={1} title='Trainee pays' body='Session price + small platform fee + card processing + tax.' />
          <FlowStep n={2} title='You hold in escrow' body='Funds stay held until the lesson completes and both sides rate.' />
          <FlowStep n={3} title='Coach is paid' body='Session price minus your % commission minus coach platform fee.' />
          <FlowStep n={4} title='You keep' body='Commission + both platform fees, minus infra & Stripe costs.' />
        </Stack>
      </AdminPageSection>
    </Stack>
  )
}
