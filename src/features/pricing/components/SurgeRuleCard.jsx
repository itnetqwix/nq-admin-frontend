import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import MenuItem from '@mui/material/MenuItem'
import { ops } from 'src/styles/opsSurface'
import { fmtMoney, surgeCentsOnSubtotal } from 'src/constants/pricingAdmin'
import DayOfWeekPicker from './DayOfWeekPicker'

/**
 * Shared card chrome for surge time windows and demand rules.
 */
export default function SurgeRuleCard({
  title,
  children,
  onDelete,
  canEdit,
  upliftBps,
  showUpliftHelper = true
}) {
  const extra = surgeCentsOnSubtotal(6000, upliftBps)
  const pct = (upliftBps || 0) / 100

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: ops.radiusMd,
        bgcolor: ops.canvasSoft,
        boxShadow: `inset 0 0 0 1px ${ops.hairline}`
      }}
    >
      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' gap={1} mb={1.5}>
        <Box>
          {title ? (
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.2px', fontSize: 14 }}>{title}</Typography>
          ) : null}
          {showUpliftHelper ? (
            <Typography sx={{ fontSize: 12, color: ops.mute, fontFamily: ops.mono, mt: 0.25 }}>
              {pct}% uplift · $60 → {fmtMoney(6000 + extra)} (+{fmtMoney(extra)})
            </Typography>
          ) : null}
        </Box>
        {canEdit && onDelete ? (
          <IconButton color='error' size='small' onClick={onDelete} aria-label='Delete rule'>
            <DeleteIcon fontSize='small' />
          </IconButton>
        ) : null}
      </Stack>
      {children}
    </Box>
  )
}

export function SurgeFieldRow({ children }) {
  return (
    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1.25 }}>
      {children}
    </Stack>
  )
}

export function TimeWindowFields({ win, idx, canEdit, updateTimeWindow, ProductTypeChips }) {
  return (
    <>
      <SurgeFieldRow>
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
          onChange={e => updateTimeWindow(idx, 'multiplierBps', Math.round(Number(e.target.value || 0) * 100))}
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
          inputProps={{ min: 0, max: 23 }}
        />
        <TextField
          label='End hour'
          size='small'
          type='number'
          value={win.endHour ?? 0}
          onChange={e => updateTimeWindow(idx, 'endHour', Number(e.target.value))}
          disabled={!canEdit}
          sx={{ width: 100 }}
          inputProps={{ min: 0, max: 24 }}
        />
      </SurgeFieldRow>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>
        Days of week
      </Typography>
      <DayOfWeekPicker
        value={win.daysOfWeek || []}
        disabled={!canEdit}
        onChange={days => updateTimeWindow(idx, 'daysOfWeek', days)}
      />
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1.25, mb: 0.5 }}>
        Applies to
      </Typography>
      <ProductTypeChips
        value={win.productTypes}
        disabled={!canEdit}
        onChange={next => updateTimeWindow(idx, 'productTypes', next)}
      />
    </>
  )
}

export function DemandRuleFields({ rule, idx, canEdit, updateDemandRule, ProductTypeChips, metrics }) {
  return (
    <>
      <SurgeFieldRow>
        <TextField
          label='Label'
          size='small'
          value={rule.label || ''}
          onChange={e => updateDemandRule(idx, 'label', e.target.value)}
          disabled={!canEdit}
          sx={{ minWidth: 160 }}
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
          {metrics.map(m => (
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
          onChange={e => updateDemandRule(idx, 'multiplierBps', Math.round(Number(e.target.value || 0) * 100))}
          disabled={!canEdit}
          sx={{ width: 120 }}
        />
      </SurgeFieldRow>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5, mb: 0.5 }}>
        Applies to
      </Typography>
      <ProductTypeChips
        value={rule.productTypes}
        disabled={!canEdit}
        onChange={next => updateDemandRule(idx, 'productTypes', next)}
      />
    </>
  )
}
