import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import toast from 'react-hot-toast'
import { OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'
import { previewPricingQuote } from 'src/services/pricingApi'
import {
  DEFAULT_LESSON_DOLLARS,
  PRODUCT_TYPES,
  SURGE_TIMEZONES,
  fmtMoney,
  inputToCents,
  surgeCentsOnSubtotal
} from 'src/constants/pricingAdmin'
import SurgeRuleCard, { DemandRuleFields, TimeWindowFields } from './SurgeRuleCard'

const SESSION_PRODUCTS = PRODUCT_TYPES.filter(
  p => p.value === 'session_booking' || p.value === 'instant_lesson' || p.value === 'session_extension'
)

const DEMAND_METRICS = [
  { value: 'instant_queue_depth', label: 'Instant queue depth' },
  { value: 'active_lessons_ratio', label: 'Active lessons ratio' }
]

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}`
}

function ProductTypeChips({ value, onChange, disabled }) {
  const selected = value || []
  return (
    <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap sx={{ mt: 0.5 }}>
      {SESSION_PRODUCTS.map(p => {
        const on = selected.includes(p.value)
        return (
          <Chip
            key={p.value}
            size='small'
            label={p.label}
            variant={on ? 'filled' : 'outlined'}
            onClick={
              disabled
                ? undefined
                : () => {
                    const next = new Set(selected)
                    if (on) next.delete(p.value)
                    else next.add(p.value)
                    onChange([...next])
                  }
            }
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              bgcolor: on ? ops.ink : undefined,
              color: on ? '#fff' : undefined,
              cursor: disabled ? 'default' : 'pointer'
            }}
          />
        )
      })}
    </Stack>
  )
}

function SurgeStatusChip({ surge }) {
  const windows = surge.timeWindows || []
  const demands = surge.demandRules || []
  if (!surge.enabled) {
    return <Chip size='small' label='Off' sx={{ fontFamily: ops.mono, bgcolor: ops.canvasSoft2 }} />
  }
  if (windows.length === 0 && demands.length === 0) {
    return (
      <Chip
        size='small'
        label='No rules'
        sx={{ fontFamily: ops.mono, bgcolor: ops.softAmber, color: ops.clay }}
      />
    )
  }
  return (
    <Chip
      size='small'
      label='Active'
      sx={{ fontFamily: ops.mono, bgcolor: ops.softMint, color: ops.live }}
    />
  )
}

function SurgeWorkedExample({ surge }) {
  const [dollars, setDollars] = useState(DEFAULT_LESSON_DOLLARS)
  const subtotal = inputToCents(dollars)
  const windows = surge.timeWindows || []
  const demands = surge.demandRules || []

  return (
    <OpsSurfaceCard>
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>
        What peak does to a lesson
      </Typography>
      <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
        Surge is a % on the session price, before platform fees and tax. It is added to what the trainee
        pays and held in escrow with the lesson. Coaches can opt out or cap it in Manage trainers.
      </Typography>
      <TextField
        size='small'
        type='number'
        label='Example session'
        value={dollars}
        onChange={e => setDollars(e.target.value)}
        sx={{ width: 160, mb: 2 }}
      />
      {!surge.enabled ? (
        <Alert severity='warning' sx={{ mb: 1.5 }}>
          Surge is off — windows below do nothing until you enable it.
        </Alert>
      ) : null}
      {windows.length === 0 && demands.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: ops.mute }}>
          Add a time window or demand rule to see the extra on {fmtMoney(subtotal)}.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {windows.map((win, idx) => {
            const extra = surgeCentsOnSubtotal(subtotal, win.multiplierBps)
            const pct = (win.multiplierBps || 0) / 100
            return (
              <Stack key={win.id || idx} direction='row' justifyContent='space-between' flexWrap='wrap' gap={1}>
                <Typography variant='body2'>
                  {win.label || 'Window'} · {pct}% · {win.startHour ?? 0}–{win.endHour ?? 0}h
                </Typography>
                <Typography variant='body2' fontWeight={700}>
                  {fmtMoney(subtotal)} → {fmtMoney(subtotal + extra)} (+{fmtMoney(extra)})
                </Typography>
              </Stack>
            )
          })}
          {demands.map((rule, idx) => {
            const extra = surgeCentsOnSubtotal(subtotal, rule.multiplierBps)
            const pct = (rule.multiplierBps || 0) / 100
            return (
              <Stack key={rule.id || idx} direction='row' justifyContent='space-between' flexWrap='wrap' gap={1}>
                <Typography variant='body2'>
                  {rule.label || 'Demand'} · {pct}% when {rule.metric} ≥ {rule.threshold}
                </Typography>
                <Typography variant='body2' fontWeight={700}>
                  {fmtMoney(subtotal)} → {fmtMoney(subtotal + extra)} (+{fmtMoney(extra)})
                </Typography>
              </Stack>
            )
          })}
        </Stack>
      )}
    </OpsSurfaceCard>
  )
}

export default function PricingSurgeTab({ config, canEdit, onPatchGlobal, isDirty }) {
  const surge = config.surgeRules || {
    enabled: false,
    timezone: 'America/New_York',
    timeWindows: [],
    demandRules: []
  }

  const patchSurge = partial => {
    onPatchGlobal({
      surgeRules: { ...surge, ...partial }
    })
  }

  const [simProduct, setSimProduct] = useState('session_booking')
  const [simSubtotal, setSimSubtotal] = useState(DEFAULT_LESSON_DOLLARS)
  const [simAt, setSimAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [simResult, setSimResult] = useState(null)
  const [simBusy, setSimBusy] = useState(false)

  const runSimulator = async () => {
    setSimBusy(true)
    try {
      const quote = await previewPricingQuote({
        draftConfig: isDirty ? config : undefined,
        productType: simProduct,
        sessionSubtotalCents: Math.round(Number(simSubtotal || 0) * 100),
        scheduledAt: simAt ? new Date(simAt).toISOString() : undefined,
        paymentMethodHint: 'card_domestic_us',
        billingAddress: { country: 'US', state: 'TX' }
      })
      setSimResult(quote)
    } catch (e) {
      toast.error(e?.message || 'Simulator failed')
    } finally {
      setSimBusy(false)
    }
  }

  const updateTimeWindow = (idx, field, value) => {
    const next = [...(surge.timeWindows || [])]
    next[idx] = { ...next[idx], [field]: value }
    patchSurge({ timeWindows: next })
  }

  const updateDemandRule = (idx, field, value) => {
    const next = [...(surge.demandRules || [])]
    next[idx] = { ...next[idx], [field]: value }
    patchSurge({ demandRules: next })
  }

  return (
    <Stack spacing={3}>
      <Alert severity='info'>
        Peak pricing adds a % on the session before platform fees. On a $60 lesson, 15% peak is +$9 —
        the trainee pays $69 plus fees. Saved rules apply on the next website and app quote.
      </Alert>

      <OpsSurfaceCard>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent='space-between'>
          <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap' useFlexGap>
            <FormControlLabel
              control={
                <Switch
                  checked={!!surge.enabled}
                  onChange={e => patchSurge({ enabled: e.target.checked })}
                  disabled={!canEdit}
                />
              }
              label='Enable surge pricing'
              sx={{ mr: 0 }}
            />
            <SurgeStatusChip surge={surge} />
          </Stack>
          <TextField
            select
            label='Timezone'
            size='small'
            sx={{ minWidth: 260, maxWidth: 360 }}
            value={surge.timezone || 'America/New_York'}
            onChange={e => patchSurge({ timezone: e.target.value })}
            disabled={!canEdit}
            helperText='Windows use this timezone.'
          >
            {[surge.timezone, ...SURGE_TIMEZONES].filter((z, i, a) => z && a.indexOf(z) === i).map(z => (
              <MenuItem key={z} value={z}>
                {z}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </OpsSurfaceCard>

      <SurgeWorkedExample surge={surge} />

      <OpsSurfaceCard>
        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography variant='h6' fontWeight={700}>
              Time windows
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Weekday hours in the timezone above. Multiplier 15 = +15% on the session.
            </Typography>
          </Box>
          {canEdit ? (
            <Button
              size='small'
              startIcon={<AddIcon />}
              sx={{ textTransform: 'none' }}
              onClick={() =>
                patchSurge({
                  timeWindows: [
                    ...(surge.timeWindows || []),
                    {
                      id: newId('tw'),
                      label: 'Peak hours',
                      daysOfWeek: [1, 2, 3, 4, 5],
                      startHour: 17,
                      endHour: 21,
                      multiplierBps: 1500,
                      productTypes: ['session_booking', 'instant_lesson']
                    }
                  ]
                })
              }
            >
              Add window
            </Button>
          ) : null}
        </Stack>
        {(surge.timeWindows || []).length === 0 ? (
          <Typography sx={{ fontSize: 13, color: ops.mute }}>No time windows yet.</Typography>
        ) : null}
        {(surge.timeWindows || []).map((win, idx) => (
          <SurgeRuleCard
            key={win.id || idx}
            title={win.label || `Window ${idx + 1}`}
            upliftBps={win.multiplierBps}
            canEdit={canEdit}
            onDelete={() =>
              patchSurge({
                timeWindows: surge.timeWindows.filter((_, i) => i !== idx)
              })
            }
          >
            <TimeWindowFields
              win={win}
              idx={idx}
              canEdit={canEdit}
              updateTimeWindow={updateTimeWindow}
              ProductTypeChips={ProductTypeChips}
            />
          </SurgeRuleCard>
        ))}
      </OpsSurfaceCard>

      <OpsSurfaceCard>
        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography variant='h6' fontWeight={700}>
              Demand rules
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Fires when the metric is at or above the threshold. Highest matching % wins with time windows.
            </Typography>
          </Box>
          {canEdit ? (
            <Button
              size='small'
              startIcon={<AddIcon />}
              sx={{ textTransform: 'none' }}
              onClick={() =>
                patchSurge({
                  demandRules: [
                    ...(surge.demandRules || []),
                    {
                      id: newId('dr'),
                      label: 'High instant demand',
                      metric: 'instant_queue_depth',
                      threshold: 5,
                      multiplierBps: 1000,
                      productTypes: ['instant_lesson']
                    }
                  ]
                })
              }
            >
              Add rule
            </Button>
          ) : null}
        </Stack>
        {(surge.demandRules || []).length === 0 ? (
          <Typography sx={{ fontSize: 13, color: ops.mute }}>No demand rules yet.</Typography>
        ) : null}
        {(surge.demandRules || []).map((rule, idx) => (
          <SurgeRuleCard
            key={rule.id || idx}
            title={rule.label || `Demand ${idx + 1}`}
            upliftBps={rule.multiplierBps}
            canEdit={canEdit}
            onDelete={() =>
              patchSurge({
                demandRules: surge.demandRules.filter((_, i) => i !== idx)
              })
            }
          >
            <DemandRuleFields
              rule={rule}
              idx={idx}
              canEdit={canEdit}
              updateDemandRule={updateDemandRule}
              ProductTypeChips={ProductTypeChips}
              metrics={DEMAND_METRICS}
            />
          </SurgeRuleCard>
        ))}
      </OpsSurfaceCard>

      <Accordion
        disableGutters
        sx={{
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${ops.hairline}`,
          borderRadius: ops.radiusMd,
          bgcolor: ops.canvas
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>Test a quote</Typography>
            <Typography sx={{ fontSize: 12, color: ops.mute }}>
              Pick a lesson price and clock time — same quote website and app will charge.
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
            <TextField
              select
              label='Product'
              size='small'
              value={simProduct}
              onChange={e => setSimProduct(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {SESSION_PRODUCTS.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label='Session price ($)'
              size='small'
              type='number'
              value={simSubtotal}
              onChange={e => setSimSubtotal(e.target.value)}
              sx={{ width: 160 }}
            />
            <TextField
              label='Scheduled at'
              size='small'
              type='datetime-local'
              value={simAt}
              onChange={e => setSimAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant='contained'
              onClick={() => void runSimulator()}
              disabled={simBusy}
              sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
            >
              {simBusy ? 'Running…' : 'Preview quote'}
            </Button>
          </Stack>
          {simResult ? (
            <Box sx={{ bgcolor: ops.canvasSoft, p: 2, borderRadius: 1 }}>
              <Typography variant='body2' fontWeight={600} gutterBottom>
                Trainee pays {fmtMoney(simResult.chargeTotalCents || 0)}
                {simResult.surgeCents > 0
                  ? ` · peak ${fmtMoney(simResult.surgeCents)} (${simResult.surgeLabel || 'surge'})`
                  : ' · no peak on this time'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Coach receives {fmtMoney(simResult.trainerNetCents || 0)}
              </Typography>
              {(simResult.breakdown || []).map(row => (
                <Typography key={row.key} variant='body2' color='text.secondary'>
                  {row.label}: {fmtMoney(row.amountMinor || 0)}
                </Typography>
              ))}
            </Box>
          ) : null}
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}
