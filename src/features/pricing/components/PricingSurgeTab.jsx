import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
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

const SESSION_PRODUCTS = PRODUCT_TYPES.filter(
  p => p.value === 'session_booking' || p.value === 'instant_lesson' || p.value === 'session_extension'
)

const DEMAND_METRICS = [
  { value: 'instant_queue_depth', label: 'Instant queue depth' },
  { value: 'active_lessons_ratio', label: 'Active lessons ratio' }
]

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
]

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}`
}

function ProductTypeChips({ value, onChange, disabled }) {
  const selected = value || []
  return (
    <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
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

      <SurgeWorkedExample surge={surge} />

      <OpsSurfaceCard>
          <FormControlLabel
            control={
              <Switch
                checked={!!surge.enabled}
                onChange={e => patchSurge({ enabled: e.target.checked })}
                disabled={!canEdit}
              />
            }
            label='Enable surge pricing'
          />
          <TextField
            select
            label='Timezone'
            size='small'
            fullWidth
            sx={{ mt: 2, maxWidth: 360 }}
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
        </OpsSurfaceCard>

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
          {(surge.timeWindows || []).map((win, idx) => (
            <Box key={win.id || idx} sx={{ mb: 2, p: 2, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft, boxShadow: 'inset 0 0 0 1px ' + ops.hairline }}>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <TextField
                  label='Label'
                  size='small'
                  value={win.label || ''}
                  onChange={e => updateTimeWindow(idx, 'label', e.target.value)}
                  disabled={!canEdit}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  label='Uplift %'
                  size='small'
                  type='number'
                  value={(win.multiplierBps || 0) / 100}
                  onChange={e =>
                    updateTimeWindow(idx, 'multiplierBps', Math.round(Number(e.target.value || 0) * 100))
                  }
                  disabled={!canEdit}
                  sx={{ width: 140 }}
                  helperText={`$60 → ${fmtMoney(6000 + surgeCentsOnSubtotal(6000, win.multiplierBps))}`}
                />
                <TextField
                  label='Start hour'
                  size='small'
                  type='number'
                  value={win.startHour ?? 0}
                  onChange={e => updateTimeWindow(idx, 'startHour', Number(e.target.value))}
                  disabled={!canEdit}
                  sx={{ width: 100 }}
                />
                <TextField
                  label='End hour'
                  size='small'
                  type='number'
                  value={win.endHour ?? 0}
                  onChange={e => updateTimeWindow(idx, 'endHour', Number(e.target.value))}
                  disabled={!canEdit}
                  sx={{ width: 100 }}
                />
                {canEdit ? (
                  <IconButton
                    color='error'
                    onClick={() =>
                      patchSurge({
                        timeWindows: surge.timeWindows.filter((_, i) => i !== idx)
                      })
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                ) : null}
              </Stack>
              <Stack direction='row' spacing={0.5} flexWrap='wrap' sx={{ mt: 1 }}>
                {DAYS.map(d => {
                  const selected = (win.daysOfWeek || []).includes(d.value)
                  return (
                    <Button
                      key={d.value}
                      size='small'
                      variant={selected ? 'contained' : 'outlined'}
                      disabled={!canEdit}
                      onClick={() => {
                        const days = new Set(win.daysOfWeek || [])
                        if (selected) days.delete(d.value)
                        else days.add(d.value)
                        updateTimeWindow(idx, 'daysOfWeek', [...days].sort())
                      }}
                    >
                      {d.label}
                    </Button>
                  )
                })}
              </Stack>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                Applies to
              </Typography>
              <ProductTypeChips
                value={win.productTypes}
                disabled={!canEdit}
                onChange={next => updateTimeWindow(idx, 'productTypes', next)}
              />
            </Box>
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
          {(surge.demandRules || []).map((rule, idx) => (
            <Box key={rule.id || idx} sx={{ mb: 2, p: 2, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft, boxShadow: 'inset 0 0 0 1px ' + ops.hairline }}>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <TextField
                  label='Label'
                  size='small'
                  value={rule.label || ''}
                  onChange={e => updateDemandRule(idx, 'label', e.target.value)}
                  disabled={!canEdit}
                />
                <TextField
                  select
                  label='Metric'
                  size='small'
                  value={rule.metric || 'instant_queue_depth'}
                  onChange={e => updateDemandRule(idx, 'metric', e.target.value)}
                  disabled={!canEdit}
                  sx={{ minWidth: 180 }}
                >
                  {DEMAND_METRICS.map(m => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label='Threshold'
                  size='small'
                  type='number'
                  value={rule.threshold ?? 0}
                  onChange={e => updateDemandRule(idx, 'threshold', Number(e.target.value))}
                  disabled={!canEdit}
                  sx={{ width: 100 }}
                />
                <TextField
                  label='Uplift %'
                  size='small'
                  type='number'
                  value={(rule.multiplierBps || 0) / 100}
                  onChange={e =>
                    updateDemandRule(idx, 'multiplierBps', Math.round(Number(e.target.value || 0) * 100))
                  }
                  disabled={!canEdit}
                  sx={{ width: 140 }}
                  helperText={`$60 → ${fmtMoney(6000 + surgeCentsOnSubtotal(6000, rule.multiplierBps))}`}
                />
                {canEdit ? (
                  <IconButton
                    color='error'
                    onClick={() =>
                      patchSurge({
                        demandRules: surge.demandRules.filter((_, i) => i !== idx)
                      })
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                ) : null}
              </Stack>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                Applies to
              </Typography>
              <ProductTypeChips
                value={rule.productTypes}
                disabled={!canEdit}
                onChange={next => updateDemandRule(idx, 'productTypes', next)}
              />
            </Box>
          ))}
        </OpsSurfaceCard>

      <OpsSurfaceCard>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            Quote at a date & time
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Pick a $60 lesson and a clock time. If it lands in a window, peak shows in the breakdown —
            the same quote website and app will charge.
          </Typography>
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
            <Button variant='contained' onClick={() => void runSimulator()} disabled={simBusy}>
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
        </OpsSurfaceCard>
    </Stack>
  )
}
