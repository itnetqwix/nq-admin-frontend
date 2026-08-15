import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import { OpsMetricTile, OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'
import {
  DEFAULT_LESSON_DOLLARS,
  LESSON_DURATION_MINUTES,
  PRICING_REGIONS,
  PRODUCT_TYPES,
  centsToInput,
  currencyForRegion,
  decimalToPctInput,
  defaultJurisdiction,
  defaultPaymentHint,
  fmtMoney,
  fmtPct,
  hourlyCentsFromSession,
  inputToCents,
  pctInputToDecimal
} from 'src/constants/pricingAdmin'
import { previewPricingQuote } from 'src/services/pricingApi'

const SESSION_PRODUCTS = PRODUCT_TYPES.filter(
  p => p.value !== 'wallet_topup' && p.value !== 'storage_subscription'
)

const DEFAULT_LESSON = {
  region: 'US',
  productType: 'session_booking',
  durationMinutes: 30,
  sessionDollars: DEFAULT_LESSON_DOLLARS
}

function rowAmount(quote, key) {
  return (quote?.breakdown || []).find(r => r.key === key)?.amountMinor ?? 0
}

function SplitBar({ coach, commission, coachFee, currency }) {
  const parts = [
    { key: 'coach', label: 'Coach', cents: Math.max(0, coach), color: ops.live },
    { key: 'commission', label: 'Commission', cents: Math.max(0, commission), color: ops.indigo },
    { key: 'fee', label: 'Coach fee', cents: Math.max(0, coachFee), color: ops.clay }
  ]
  const total = parts.reduce((s, p) => s + p.cents, 0) || 1

  return (
    <Box>
      <Stack direction='row' sx={{ height: 14, borderRadius: 99, overflow: 'hidden', bgcolor: ops.canvasSoft2 }}>
        {parts.map(p => (
          <Box
            key={p.key}
            sx={{
              width: `${(p.cents / total) * 100}%`,
              bgcolor: p.color,
              minWidth: p.cents > 0 ? 4 : 0
            }}
          />
        ))}
      </Stack>
      <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
        {parts.map(p => (
          <Typography key={p.key} sx={{ fontSize: 12, color: ops.body, fontFamily: ops.mono }}>
            <Box component='span' sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, bgcolor: p.color, mr: 0.75 }} />
            {p.label} {fmtMoney(p.cents, currency)}
          </Typography>
        ))}
      </Stack>
    </Box>
  )
}

export default function PricingLessonSplit({
  config,
  isDirty,
  canEdit = false,
  onPatchRegion,
  value,
  onChange,
  lockedRegion,
  compact = false,
  showCommissionControls = true
}) {
  const [internal, setInternal] = useState(DEFAULT_LESSON)
  const lesson = value || internal
  const setLesson = onChange || setInternal

  const region = lockedRegion || lesson.region || 'US'
  const currency = currencyForRegion(region)
  const regionCfg = config?.regions?.[region]
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const patchLesson = partial => setLesson(prev => ({ ...(prev || DEFAULT_LESSON), ...partial }))

  const runQuote = useCallback(async () => {
    if (!config) return
    setLoading(true)
    try {
      const sessionSubtotalCents = inputToCents(lesson.sessionDollars)
      const result = await previewPricingQuote({
        region,
        productType: lesson.productType,
        sessionSubtotalCents,
        paymentMethodHint: defaultPaymentHint(region),
        billingAddress: { country: region, state: defaultJurisdiction(region) },
        draftConfig: config
      })
      setQuote(result)
    } catch {
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }, [config, lesson.productType, lesson.sessionDollars, region])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void runQuote(), 350)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [runQuote])

  const hourly = useMemo(() => {
    const cents = hourlyCentsFromSession(inputToCents(lesson.sessionDollars), lesson.durationMinutes)
    return fmtMoney(cents, currency)
  }, [lesson.sessionDollars, lesson.durationMinutes, currency])

  const commissionPct = Number(regionCfg?.defaultCommissionRate || 0) * 100
  const floorPct = Number(regionCfg?.minCommissionRateFloor || 0) * 100

  const sessionCents = inputToCents(lesson.sessionDollars)
  const traineePays = rowAmount(quote, 'total')
  const coachGets = quote?.trainerNetCents ?? 0
  const youKeep = quote?.platformNetMarginCents ?? 0
  const commissionCents = quote?.platformFeePercentCents ?? 0
  const coachFee = quote?.trainerPlatformFeeCents ?? 0
  const traineeFee = quote?.traineePlatformFeeCents ?? 0
  const processing = quote?.processingFeeCents ?? 0
  const tax = quote?.taxCents ?? 0
  const surge = quote?.surgeCents ?? 0

  const checkoutLines = [
    ['Session price', sessionCents, 'What the coach listed. 15 vs 30 min does not change this if the ticket is flat $60.'],
    surge ? ['Peak / surge', surge, quote?.surgeLabel || 'Extra % on the session before fees. Held with the lesson.'] : null,
    traineeFee ? ['Enthusiast platform fee', traineeFee, 'Added on checkout. This is yours, not taken from the coach.'] : null,
    processing ? ['Card processing', processing, 'Stripe. $0 if they pay from wallet. Passed through when “pass processing to trainee” is on.'] : null,
    tax ? ['Tax', tax, 'Estimated unless Stripe Tax is on.'] : null
  ].filter(Boolean)

  const afterLines = [
    [`Commission (${fmtPct(quote?.commissionRate)})`, commissionCents, 'Taken from the session. Coaches with an override keep theirs.'],
    ['Coach platform fee', coachFee, 'Taken from the coach, not added to checkout.'],
    ['Coach wallet (later)', coachGets, 'After ratings or 7 days + 24h clearance. Stays in NetQwix wallet — not a bank.'],
    ['You keep (before infra)', youKeep, 'Commission + both fees − Stripe. AWS/video is the next section.']
  ]

  function MoneyCol({ title, chip, lines, totalLabel, totalCents, emphasize }) {
    return (
      <OpsSurfaceCard>
        <Chip size='small' label={chip} sx={{ mb: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft2 }} />
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>{title}</Typography>
        <Stack spacing={1.25}>
          {lines.map(([label, cents, why]) => (
            <Box key={label}>
              <Stack direction='row' justifyContent='space-between' gap={1}>
                <Typography variant='body2'>{label}</Typography>
                <Typography variant='body2' fontWeight={600}>
                  {fmtMoney(cents, currency)}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 12, color: ops.mute, lineHeight: 1.4 }}>{why}</Typography>
            </Box>
          ))}
          <Stack direction='row' justifyContent='space-between' sx={{ pt: 1, borderTop: `1px solid ${ops.hairline}` }}>
            <Typography variant='body2' fontWeight={700}>
              {totalLabel}
            </Typography>
            <Typography variant='body2' fontWeight={700} color={emphasize}>
              {fmtMoney(totalCents, currency)}
            </Typography>
          </Stack>
        </Stack>
      </OpsSurfaceCard>
    )
  }

  return (
    <Stack spacing={2}>
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
        {isDirty ? (
          <Chip size='small' color='warning' label='Uses unsaved draft' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
        ) : (
          <Chip size='small' variant='outlined' label='Uses saved config' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
        )}
        <Typography sx={{ fontSize: 12, color: ops.mute, fontFamily: ops.mono }}>
          {lesson.durationMinutes} min · {hourly}/hr
        </Typography>
        {loading ? <CircularProgress size={14} sx={{ color: ops.ink }} /> : null}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap='wrap' useFlexGap>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={Number(lesson.durationMinutes)}
          onChange={(_, v) => v && patchLesson({ durationMinutes: v })}
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontFamily: ops.mono,
              fontSize: 12,
              px: 1.5,
              '&.Mui-selected': { bgcolor: ops.ink, color: '#fff', '&:hover': { bgcolor: '#000' } }
            }
          }}
        >
          {LESSON_DURATION_MINUTES.map(m => (
            <ToggleButton key={m} value={m}>
              {m} min
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <TextField
          size='small'
          type='number'
          label='Session price'
          value={lesson.sessionDollars}
          onChange={e => patchLesson({ sessionDollars: e.target.value })}
          sx={{ width: 140 }}
          inputProps={{ min: 0, step: '1' }}
        />

        {!compact ? (
          <TextField
            select
            size='small'
            label='Product'
            value={lesson.productType}
            onChange={e => patchLesson({ productType: e.target.value })}
            sx={{ minWidth: 180 }}
          >
            {SESSION_PRODUCTS.map(p => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
        ) : null}

        {!lockedRegion ? (
          <TextField
            select
            size='small'
            label='Region'
            value={region}
            onChange={e => patchLesson({ region: e.target.value })}
            sx={{ minWidth: 180 }}
          >
            {PRICING_REGIONS.map(r => (
              <MenuItem key={r.key} value={r.key}>
                {r.label} ({r.currency})
              </MenuItem>
            ))}
          </TextField>
        ) : null}
      </Stack>

      {!compact ? (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <OpsMetricTile label='Enthusiast pays now' value={fmtMoney(traineePays, currency)} hint='Card or wallet — captured immediately' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <OpsMetricTile label='Coach wallet later' value={fmtMoney(coachGets, currency)} hint='After ratings or 7 days + 24h — not a bank' tone='success' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <OpsMetricTile
            label='You keep (before infra)'
            value={fmtMoney(youKeep, currency)}
            hint={youKeep >= 0 ? 'Commission + fees − Stripe' : 'This lesson loses money before infra'}
            tone={youKeep >= 0 ? 'accent' : 'danger'}
          />
        </Grid>
      </Grid>
      ) : null}

      <OpsSurfaceCard sx={{ bgcolor: ops.canvasSoft }}>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>
          What happens to this {fmtMoney(sessionCents, currency)} / {lesson.durationMinutes} min lesson
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.6 }}>
          Enthusiast is charged {fmtMoney(traineePays, currency)} <strong>now</strong> (Stripe captures the card
          immediately, or we debit wallet). We hold it on our ledger. If the lesson never starts, they get a{' '}
          <strong>full refund</strong> to the original method. If it completes, the coach gets{' '}
          {fmtMoney(coachGets, currency)} in their NetQwix wallet after ratings or 7 days + 24 hours — not a bank
          transfer. You keep {fmtMoney(youKeep, currency)} before infrastructure.
        </Typography>
      </OpsSurfaceCard>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <MoneyCol
            chip='Charged now'
            title='Enthusiast checkout'
            lines={checkoutLines}
            totalLabel='They pay'
            totalCents={traineePays}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MoneyCol
            chip='After the lesson'
            title='Split of the session'
            lines={afterLines}
            totalLabel='You keep (before infra)'
            totalCents={youKeep}
            emphasize={youKeep >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>

      <SplitBar coach={coachGets} commission={commissionCents} coachFee={coachFee} currency={currency} />

      {showCommissionControls && onPatchRegion && regionCfg ? (
        <OpsSurfaceCard>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>
            Tune this region
          </Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
            Edits apply to every future {PRICING_REGIONS.find(r => r.key === region)?.label} checkout — website
            and app pick them up on the next quote. Save at the top of the page to publish.
          </Typography>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute, mb: 0.5 }}>
            Commission {decimalToPctInput(regionCfg.defaultCommissionRate)}%
            {' · '}
            {fmtMoney(Math.round(inputToCents(lesson.sessionDollars) * (regionCfg.defaultCommissionRate || 0)), currency)} on this lesson
          </Typography>
          <Slider
            value={commissionPct}
            min={Math.min(floorPct, 40)}
            max={40}
            step={0.5}
            disabled={!canEdit}
            onChange={(_, v) =>
              onPatchRegion(region, {
                defaultCommissionRate: pctInputToDecimal(Array.isArray(v) ? v[0] : v)
              })
            }
            valueLabelDisplay='auto'
            valueLabelFormat={v => `${Number(v).toFixed(1)}%`}
            sx={{ color: ops.ink, maxWidth: 480 }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              size='small'
              type='number'
              label='Trainee platform fee'
              value={centsToInput(regionCfg.traineePlatformFeeMinor)}
              onChange={e => onPatchRegion(region, { traineePlatformFeeMinor: inputToCents(e.target.value) })}
              disabled={!canEdit}
              helperText='Added on checkout'
            />
            <TextField
              size='small'
              type='number'
              label='Coach platform fee'
              value={centsToInput(regionCfg.trainerPlatformFeeMinor)}
              onChange={e => onPatchRegion(region, { trainerPlatformFeeMinor: inputToCents(e.target.value) })}
              disabled={!canEdit}
              helperText='Taken from coach'
            />
          </Stack>
        </OpsSurfaceCard>
      ) : null}
    </Stack>
  )
}

export { DEFAULT_LESSON }
