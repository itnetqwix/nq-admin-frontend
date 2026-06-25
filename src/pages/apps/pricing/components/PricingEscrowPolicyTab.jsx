import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'

export default function PricingEscrowPolicyTab({ policy, canEdit, onPatch }) {
  const p = policy || {}

  return (
    <Stack spacing={2}>
      <Alert severity='info'>
        Escrow policy applies platform-wide. After a session ends, both parties should rate. If ratings
        are still missing after the grace period, funds auto-release to the coach (disputed holds are
        excluded).
      </Alert>
      <AdminPageSection title='Clearance & ratings'>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type='number'
              label='Clearance period (hours)'
              inputProps={{ min: 0, step: 1 }}
              value={p.clearanceHoursStandard ?? 24}
              onChange={e =>
                onPatch({ clearanceHoursStandard: Number(e.target.value) || 0 })
              }
              disabled={!canEdit}
              helperText='Minimum wait after payment before release can proceed'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type='number'
              label='Rating grace (days)'
              inputProps={{ min: 0, step: 1 }}
              value={p.ratingGraceDays ?? 7}
              onChange={e => onPatch({ ratingGraceDays: Number(e.target.value) || 0 })}
              disabled={!canEdit}
              helperText='0 = require both ratings indefinitely'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type='number'
              label='Rating reminder (days after session)'
              inputProps={{ min: 0, step: 1 }}
              value={p.ratingReminderDays ?? 3}
              onChange={e => onPatch({ ratingReminderDays: Number(e.target.value) || 0 })}
              disabled={!canEdit || !p.sendRatingReminders}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!p.sendRatingReminders}
                  onChange={e => onPatch({ sendRatingReminders: e.target.checked })}
                  disabled={!canEdit}
                />
              }
              label='Send rating reminders'
            />
            <Typography variant='caption' color='text.secondary' display='block' sx={{ ml: 4.5 }}>
              Daily push to trainee & coach when escrow is held
            </Typography>
          </Grid>
        </Grid>
      </AdminPageSection>
    </Stack>
  )
}
