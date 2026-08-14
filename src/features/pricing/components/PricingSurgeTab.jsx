import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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

const PRODUCT_TYPES = [
  { value: 'session_booking', label: 'Scheduled session' },
  { value: 'instant_lesson', label: 'Instant lesson' },
  { value: 'session_extension', label: 'Session extension' }
]

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
  const [simSubtotal, setSimSubtotal] = useState('100')
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
        Surge pricing adds a peak-time or high-demand uplift on the session subtotal before platform
        fees and taxes. Coaches can opt out or cap surge via Manage trainers.
      </Alert>

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
            label='Timezone'
            size='small'
            fullWidth
            sx={{ mt: 2, maxWidth: 360 }}
            value={surge.timezone || 'America/New_York'}
            onChange={e => patchSurge({ timezone: e.target.value })}
            disabled={!canEdit}
            helperText='IANA timezone for time-window rules (e.g. America/New_York)'
          />
        </OpsSurfaceCard>

      <OpsSurfaceCard>
          <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6' fontWeight={700}>
              Time windows
            </Typography>
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
                  label='Multiplier %'
                  size='small'
                  type='number'
                  value={(win.multiplierBps || 0) / 100}
                  onChange={e =>
                    updateTimeWindow(idx, 'multiplierBps', Math.round(Number(e.target.value || 0) * 100))
                  }
                  disabled={!canEdit}
                  sx={{ width: 120 }}
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
            </Box>
          ))}
        </OpsSurfaceCard>

      <OpsSurfaceCard>
          <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography variant='h6' fontWeight={700}>
              Demand rules
            </Typography>
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
                  label='Multiplier %'
                  size='small'
                  type='number'
                  value={(rule.multiplierBps || 0) / 100}
                  onChange={e =>
                    updateDemandRule(idx, 'multiplierBps', Math.round(Number(e.target.value || 0) * 100))
                  }
                  disabled={!canEdit}
                  sx={{ width: 120 }}
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
            </Box>
          ))}
        </OpsSurfaceCard>

      <OpsSurfaceCard>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            Quote simulator
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
              {PRODUCT_TYPES.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label='Session subtotal ($)'
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
                Total charged: ${((simResult.chargeTotalCents || 0) / 100).toFixed(2)}
              </Typography>
              {(simResult.breakdown || []).map(row => (
                <Typography key={row.key} variant='body2' color='text.secondary'>
                  {row.label}: ${((row.amountMinor || 0) / 100).toFixed(2)}
                </Typography>
              ))}
            </Box>
          ) : null}
        </OpsSurfaceCard>
    </Stack>
  )
}
