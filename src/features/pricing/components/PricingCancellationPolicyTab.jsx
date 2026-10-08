import Link from 'next/link'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'

const MAX_TIERS = 6
const DEFAULT_TIERS = [
  { minHoursBefore: 12, refundPercent: 100 },
  { minHoursBefore: 6, refundPercent: 75 },
  { minHoursBefore: 1, refundPercent: 50 },
  { minHoursBefore: 0, refundPercent: 0 }
]
const DEFAULT_PENALTY = { enabled: false, freeCancelsPerMonth: 8, finePercent: null }

/** Mirrors backend parseCoachCancellationPenalty (server still enforces). */
export function coachPenaltyError(penalty) {
  const free = Number(penalty?.freeCancelsPerMonth)
  if (!Number.isInteger(free) || free < 0 || free > 100) return 'Free cancels per month must be a whole number 0–100.'
  const fine = penalty?.finePercent
  if (fine != null && fine !== '') {
    const n = Number(fine)
    if (!Number.isInteger(n) || n < 1 || n > 100) return 'Fine % must be a whole number 1–100, or empty to use commission.'
  }
  return null
}

/** Mirrors backend parseCancellationPolicy so admins see problems before Save (server still enforces). */
export function cancellationPolicyError(tiers) {
  if (!tiers?.length) return 'Add at least one tier.'
  for (const [i, t] of tiers.entries()) {
    const h = Number(t.minHoursBefore)
    const p = Number(t.refundPercent)
    if (!Number.isFinite(h) || h < 0 || h > 720) return `Tier ${i + 1}: hours before must be 0–720.`
    if (!Number.isInteger(p) || p < 0 || p > 100) return `Tier ${i + 1}: refund % must be a whole number 0–100.`
  }
  const sorted = [...tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minHoursBefore === sorted[i - 1].minHoursBefore) return 'Two tiers use the same hours-before value.'
    if (sorted[i].refundPercent > sorted[i - 1].refundPercent)
      return 'Refund % cannot increase as the lesson gets closer.'
  }
  if (sorted[sorted.length - 1].minHoursBefore !== 0) return 'Add a final tier at 0 hours for last-minute cancellations.'
  return null
}

function describeTiers(tiers) {
  const sorted = [...tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore)
  return sorted.map((t, i) => {
    const upper = i === 0 ? null : sorted[i - 1].minHoursBefore
    const window =
      upper == null
        ? `${t.minHoursBefore}h or more before`
        : t.minHoursBefore === 0
          ? `Less than ${upper}h before`
          : `${t.minHoursBefore}–${upper}h before`
    return `${window} → ${t.refundPercent}% refund`
  })
}

export default function PricingCancellationPolicyTab({ policy, penalty, canEdit, onChange, onPenaltyChange }) {
  const tiers = policy?.tiers?.length ? policy.tiers : DEFAULT_TIERS
  const error = cancellationPolicyError(tiers)
  const fine = { ...DEFAULT_PENALTY, ...(penalty || {}) }
  const fineError = coachPenaltyError(fine)

  const setTiers = next => onChange({ tiers: next })
  const patchTier = (index, partial) => setTiers(tiers.map((t, i) => (i === index ? { ...t, ...partial } : t)))
  const patchFine = partial => onPenaltyChange({ ...fine, ...partial })

  return (
    <Stack spacing={2}>
      <Alert severity='info'>
        Platform-wide, all regions. Applies when an enthusiast cancels a <strong>confirmed</strong> scheduled lesson.
        Requests the coach hasn&apos;t confirmed yet are always refunded in full, and so is any booking cancelled within
        15 minutes of being made (when the lesson is more than 1 hour away). The non-refunded part goes to the coach
        (minus commission). Changes apply to <strong>new bookings only</strong> — existing bookings keep the policy they
        were booked under.
      </Alert>

      <AdminPageSection title='Refund tiers'>
        <Stack spacing={1.5}>
          {tiers.map((t, i) => (
            <Grid container spacing={2} alignItems='center' key={i}>
              <Grid item xs={5} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='At least (hours before)'
                  inputProps={{ min: 0, max: 720, step: 1 }}
                  value={t.minHoursBefore}
                  onChange={e => patchTier(i, { minHoursBefore: Number(e.target.value) })}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={5} sm={4}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='Refund %'
                  inputProps={{ min: 0, max: 100, step: 5 }}
                  value={t.refundPercent}
                  onChange={e => patchTier(i, { refundPercent: Number(e.target.value) })}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  aria-label={`Remove tier ${i + 1}`}
                  onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                  disabled={!canEdit || tiers.length <= 1}
                >
                  <DeleteOutlineIcon fontSize='small' />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Stack direction='row' spacing={1}>
            <Button
              size='small'
              startIcon={<AddIcon />}
              onClick={() => setTiers([...tiers, { minHoursBefore: 0, refundPercent: 0 }])}
              disabled={!canEdit || tiers.length >= MAX_TIERS}
              sx={{ textTransform: 'none' }}
            >
              Add tier
            </Button>
            <Button
              size='small'
              onClick={() => setTiers(DEFAULT_TIERS.map(t => ({ ...t })))}
              disabled={!canEdit}
              sx={{ textTransform: 'none' }}
            >
              Reset to 12h / 6h / 1h defaults
            </Button>
          </Stack>
        </Stack>
      </AdminPageSection>

      {error ? (
        <Alert severity='error'>{error}</Alert>
      ) : (
        <AdminPageSection title='What enthusiasts will see'>
          <Stack spacing={0.5}>
            {describeTiers(tiers).map(line => (
              <Typography key={line} variant='body2'>
                {line}
              </Typography>
            ))}
          </Stack>
        </AdminPageSection>
      )}

      <AdminPageSection title='Coach cancellation fine'>
        <Stack spacing={1.5}>
          <Typography variant='body2' color='text.secondary'>
            When a coach cancels a lesson they already accepted, the enthusiast is always refunded in full. Beyond the
            free allowance each calendar month (UTC), every further cancel fines the coach a percentage of the lesson
            amount — taken from their wallet, and from future payouts if the wallet is short. Declining a request that
            was never accepted doesn&apos;t count.
          </Typography>
          <FormControlLabel
            control={
              <Switch checked={!!fine.enabled} onChange={e => patchFine({ enabled: e.target.checked })} disabled={!canEdit} />
            }
            label='Fine coaches for repeated cancellations'
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='Free cancels per month'
                inputProps={{ min: 0, max: 100, step: 1 }}
                value={fine.freeCancelsPerMonth}
                onChange={e => patchFine({ freeCancelsPerMonth: Number(e.target.value) })}
                disabled={!canEdit || !fine.enabled}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='Fine % of lesson amount'
                placeholder='Commission rate'
                helperText='Leave empty to use the coach’s commission rate'
                inputProps={{ min: 1, max: 100, step: 1 }}
                value={fine.finePercent ?? ''}
                onChange={e => patchFine({ finePercent: e.target.value === '' ? null : Number(e.target.value) })}
                disabled={!canEdit || !fine.enabled}
              />
            </Grid>
          </Grid>
          {fineError ? <Alert severity='error'>{fineError}</Alert> : null}
        </Stack>
      </AdminPageSection>

      <Alert severity='warning'>
        Keep the published Cancellation &amp; Refund Policy text in sync. After saving, update it in{' '}
        <Link href='/apps/cms-legal'>CMS · Legal</Link> and publish — that bumps the version so enthusiasts and coaches
        must accept the new terms.
      </Alert>
    </Stack>
  )
}
