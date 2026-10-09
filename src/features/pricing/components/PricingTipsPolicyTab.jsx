import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'

const DEFAULTS = {
  enabled: false,
  maxPercentOfSession: 50,
  minTipMinor: 100,
  presetPercents: [10, 15, 20, 25],
  windowDays: 7,
  commissionPercent: 0,
  passFeesToTrainee: true
}

const money = minor => `$${(minor / 100).toFixed(2)}`

export default function PricingTipsPolicyTab({ policy, canEdit, onChange }) {
  const p = { ...DEFAULTS, ...(policy || {}) }
  const patch = partial => onChange({ ...p, ...partial })
  const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback)
  const previewBase = 6000
  const cap = Math.floor((previewBase * p.maxPercentOfSession) / 100)

  return (
    <Stack spacing={2}>
      <Alert severity='info'>
        Trainee tips after a completed lesson. Applies platform-wide and takes effect for new tips as soon as you save. The
        cap is a share of the lesson subtotal, summed across all tips on that lesson.
      </Alert>
      <AdminPageSection title='Availability & limits'>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={<Switch checked={!!p.enabled} onChange={e => patch({ enabled: e.target.checked })} disabled={!canEdit} />}
              label='Tipping enabled'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type='number'
              label='Max tip (% of lesson fee)'
              inputProps={{ min: 1, max: 100, step: 1 }}
              value={p.maxPercentOfSession}
              onChange={e => patch({ maxPercentOfSession: num(e.target.value, 50) })}
              disabled={!canEdit}
              helperText={`On a $60 lesson: up to ${money(cap)} total`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type='number'
              label='Minimum tip (cents)'
              inputProps={{ min: 50, step: 50 }}
              value={p.minTipMinor}
              onChange={e => patch({ minTipMinor: num(e.target.value, 100) })}
              disabled={!canEdit}
              helperText={money(p.minTipMinor)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type='number'
              label='Tip window (days after lesson)'
              inputProps={{ min: 1, max: 90, step: 1 }}
              value={p.windowDays}
              onChange={e => patch({ windowDays: num(e.target.value, 7) })}
              disabled={!canEdit}
            />
          </Grid>
        </Grid>
      </AdminPageSection>
      <AdminPageSection title='Presets & fees'>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label='Quick-pick presets (% of lesson fee)'
              value={(p.presetPercents || []).join(', ')}
              onChange={e =>
                patch({
                  presetPercents: e.target.value
                    .split(',')
                    .map(s => Number(s.trim()))
                    .filter(n => Number.isInteger(n) && n > 0)
                })
              }
              disabled={!canEdit}
              helperText='Comma separated, e.g. 10, 15, 20, 25. Each must be within the max.'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type='number'
              label='Platform commission on tips (%)'
              inputProps={{ min: 0, max: 50, step: 1 }}
              value={p.commissionPercent}
              onChange={e => patch({ commissionPercent: num(e.target.value, 0) })}
              disabled={!canEdit}
              helperText='0 = trainer keeps 100% of every tip'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!p.passFeesToTrainee}
                  onChange={e => patch({ passFeesToTrainee: e.target.checked })}
                  disabled={!canEdit}
                />
              }
              label='Trainee pays processing fees'
            />
            <Typography variant='caption' color='text.secondary' display='block' sx={{ ml: 4.5 }}>
              Card tips are grossed up so the trainer still receives the full tip. Wallet tips carry no fee.
            </Typography>
          </Grid>
        </Grid>
      </AdminPageSection>
    </Stack>
  )
}
