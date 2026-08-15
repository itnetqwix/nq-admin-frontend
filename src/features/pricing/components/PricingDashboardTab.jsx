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
import { PricingMentalModel, PricingMixups } from './PricingGuide'
import PricingPromoSponsorTab from './PricingPromoSponsorTab'

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

  const sixty15 = (health?.scenarios || []).find(
    s => s.durationMinutes === 15 && s.economics?.sessionSubtotalCents === 6000
  )
  const sixty30 = (health?.scenarios || []).find(
    s => s.durationMinutes === 30 && s.economics?.sessionSubtotalCents === 6000
  )
  const profitable = health?.actuals?.profitable
  const netPerLesson = health?.actuals?.estimatedNetPerLessonCents
  const lossScenarios = (health?.scenarios || []).filter(s => !s.economics?.profitable).length
  const commission = us?.defaultCommissionRate ?? 0.15
  const onSixty = Math.round(6000 * commission)

  return (
    <Stack spacing={3}>
      <AdminPageSection
        title='Start here — how money works'
        subtitle='NetQwix is a marketplace with a platform wallet. Stripe moves card money in. We decide who is paid, who is refunded, and when. Website and app use this same config.'
      >
        <PricingMentalModel />
      </AdminPageSection>

      <AdminPageSection
        title='A typical $60 lesson (defaults)'
        subtitle='15 min or 30 min — commission is the same dollar amount. Duration only changes video/infra cost, which you check in Profit.'
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <OpsSurfaceCard>
              <Chip size='small' label='Enthusiast' sx={{ mb: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft2 }} />
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Pays ~$60 + fees now</Typography>
              <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
                Session $60 + {fmtMoney(us?.traineePlatformFeeMinor)} platform fee + card processing
                (about 2.9% + $0.30 if they use a card; $0 if they pay from wallet) + tax where it applies.
              </Typography>
            </OpsSurfaceCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <OpsSurfaceCard>
              <Chip size='small' label='Coach' sx={{ mb: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.softMint, color: ops.live }} />
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                Receives {fmtMoney(6000 - onSixty - (us?.trainerPlatformFeeMinor || 0))} later
              </Typography>
              <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
                $60 minus {fmtPct(commission)} commission ({fmtMoney(onSixty)}) minus{' '}
                {fmtMoney(us?.trainerPlatformFeeMinor)} coach fee. Credited to their NetQwix wallet after
                ratings or 7 days, plus 24h — not to a bank.
              </Typography>
            </OpsSurfaceCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <OpsSurfaceCard>
              <Chip size='small' label='NetQwix' sx={{ mb: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.softIndigo, color: ops.indigo }} />
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                Keeps {fmtMoney(onSixty + (us?.traineePlatformFeeMinor || 0) + (us?.trainerPlatformFeeMinor || 0))} before Stripe & infra
              </Typography>
              <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
                Commission + both platform fees. Card processing is either passed to the enthusiast or
                absorbed (Rates → checkout). Open Profit check to subtract AWS/video.
              </Typography>
            </OpsSurfaceCard>
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <Button variant='contained' onClick={() => onGoTab(1)} sx={{ textTransform: 'none', bgcolor: ops.ink }}>
            2 · Set commission & fees
          </Button>
          <Button variant='outlined' onClick={() => onGoTab(3)} sx={{ textTransform: 'none' }}>
            Skip to $60 profit check
          </Button>
        </Stack>
      </AdminPageSection>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <OpsMetricTile
            label='US commission'
            value={fmtPct(us?.defaultCommissionRate)}
            hint={`${fmtMoney(onSixty)} of every $60 · floor ${fmtPct(us?.minCommissionRateFloor)}`}
            tone='accent'
            onClick={() => onGoTab(1)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='$60 · 15 min net'
            value={sixty15 ? fmtMoney(sixty15.economics.netProfitCents, 'USD') : '—'}
            hint={sixty15 ? (sixty15.economics.profitable ? 'After infra — still profitable' : 'After infra — this ticket loses money') : 'Loading…'}
            tone={sixty15?.economics?.profitable ? 'success' : sixty15 ? 'danger' : 'default'}
            onClick={() => onGoTab(3)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='$60 · 30 min net'
            value={sixty30 ? fmtMoney(sixty30.economics.netProfitCents, 'USD') : '—'}
            hint={sixty30 ? (sixty30.economics.profitable ? 'After infra — 30 min costs more video' : 'After infra — this ticket loses money') : 'Loading…'}
            tone={sixty30?.economics?.profitable ? 'success' : sixty30 ? 'danger' : 'default'}
            onClick={() => onGoTab(3)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
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
              Last 30 days (real holds)
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
                  ~{fmtMoney(netPerLesson || 0, 'USD')} net / completed lesson
                  {health.actuals?.completedSessions ? ` · ${health.actuals.completedSessions} sessions` : ''}
                </Typography>
                {lossScenarios > 0 ? (
                  <Chip
                    size='small'
                    label={`${lossScenarios} modeled ticket(s) at a loss`}
                    sx={{ mt: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.errorSoft, color: ops.warning }}
                  />
                ) : null}
              </>
            ) : (
              <Typography sx={{ fontSize: 13, color: ops.mute }}>Profit check will load estimates.</Typography>
            )}
          </OpsSurfaceCard>
        </Grid>
      </Grid>

      <PricingMixups />

      <PricingPromoSponsorTab />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant='contained' onClick={() => onGoTab(1)} sx={{ textTransform: 'none', bgcolor: ops.ink }}>
          Continue to rates
        </Button>
      </Box>
    </Stack>
  )
}
