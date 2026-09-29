import * as React from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  REFUND_REASON_PRESETS,
  personDisplayName,
  refundDestinationCopy
} from 'src/features/bookings/refundLabels'
import { getAdminBookingDetail } from 'src/services/bookingApi'

const LIVE_HOLD = ['held', 'disputed']

/** What the refund engine can do for this booking, from its escrow holds (extension holds excluded). */
function escrowCapabilities(detail, hasStripe) {
  const holds = (detail?.escrow_holds || []).filter(h => (h.kind || 'booking') !== 'extension')
  const live = holds.filter(h => LIVE_HOLD.includes(h.status))
  const released = holds.some(h => h.status === 'released')
  const heldUsd = live.reduce((sum, h) => sum + Number(h.charge_total_minor ?? h.gross_minor ?? 0), 0) / 100

  return {
    loaded: Boolean(detail),
    heldUsd: live.length ? heldUsd : null,
    // Partial refunds need held escrow, or a plain Stripe charge with nothing released yet.
    canSplit: live.length > 0 || (!released && hasStripe),
    // Wallet credit needs held escrow; a legacy card charge without a hold can only go back to the card.
    walletAllowed: live.length > 0,
    releasedOnly: released && live.length === 0
  }
}

export default function RefundPopups({
  paymentIntentDetails,
  bookingPreview,
  handleClose,
  open,
  onConform,
  mode = 'refund'
}) {
  const isCancel = mode === 'cancel'
  const [preset, setPreset] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [percentInput, setPercentInput] = React.useState('100')
  const [refundTo, setRefundTo] = React.useState('original')
  const [detail, setDetail] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setPreset('')
      setNotes('')
      setPercentInput('100')
      setRefundTo('original')
      setDetail(null)
      setSubmitting(false)
    }
  }, [open])

  const bookingId = bookingPreview?._id
  React.useEffect(() => {
    if (!open || !bookingId) return
    let cancelled = false
    getAdminBookingDetail(bookingId)
      .then(d => {
        if (!cancelled) setDetail(d)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [open, bookingId])

  const hasStripe = Boolean(paymentIntentDetails?.id || bookingPreview?.payment_intent_id)
  const caps = escrowCapabilities(detail, hasStripe)
  const splitLocked = caps.loaded && !caps.canSplit
  const walletLocked = caps.loaded && !caps.walletAllowed

  React.useEffect(() => {
    if (splitLocked) setPercentInput('100')
  }, [splitLocked])
  React.useEffect(() => {
    if (walletLocked) setRefundTo('original')
  }, [walletLocked])

  const amountUsd =
    caps.heldUsd ??
    (paymentIntentDetails?.amount_received
      ? paymentIntentDetails.amount_received / 100
      : bookingPreview?.amount != null
        ? Number(bookingPreview.amount)
        : 0)
  const feeUsd = paymentIntentDetails?.application_fee_amount ? paymentIntentDetails.application_fee_amount / 100 : 0
  const destination =
    bookingPreview?.refund_transfer?.destination || (hasStripe ? 'card' : 'wallet')
  const traineeName = personDisplayName(bookingPreview?.trainee_info, bookingPreview?.trainee_id)
  const trainerName = personDisplayName(bookingPreview?.trainer_info, bookingPreview?.trainer_id)
  const traineeEmail = bookingPreview?.trainee_info?.email
  const trainerEmail = bookingPreview?.trainer_info?.email

  const reason =
    preset && preset !== 'other'
      ? notes.trim()
        ? `${preset}: ${notes.trim()}`
        : preset
      : notes.trim()

  const refundPercent = Number(percentInput)
  const percentValid = Number.isInteger(refundPercent) && refundPercent >= 1 && refundPercent <= 100
  const refundUsd = percentValid ? Math.round(amountUsd * refundPercent) / 100 : 0

  const handleRefund = async () => {
    if (reason.length < 3 || !percentValid || submitting) return
    setSubmitting(true)
    try {
      await onConform?.(paymentIntentDetails?.id || bookingPreview?.payment_intent_id || null, reason, {
        refundPercent,
        destination: hasStripe && !walletLocked ? refundTo : 'original'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{isCancel ? 'Cancel and refund this session' : 'Refund this session'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {bookingPreview ? (
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary'>
                Case
              </Typography>
              <Typography variant='body2' sx={{ fontFamily: 'ui-monospace, monospace', mb: 1 }}>
                {bookingPreview._id}
              </Typography>
              <Typography variant='body2'>
                Enthusiast: {traineeName}
                {traineeEmail ? ` · ${traineeEmail}` : ''}
              </Typography>
              <Typography variant='body2'>
                Coach: {trainerName}
                {trainerEmail ? ` · ${trainerEmail}` : ''}
              </Typography>
              {bookingPreview.status ? (
                <Typography variant='body2'>Booking status: {bookingPreview.status}</Typography>
              ) : null}
            </Box>
          ) : null}

          <Box>
            <Typography variant='subtitle2'>Amount</Typography>
            <Typography variant='body2'>
              {amountUsd ? `$${Number(amountUsd).toFixed(2)}` : 'Wallet / escrow hold'}
              {caps.heldUsd != null ? ' held in escrow' : ''}
              {hasStripe && feeUsd && caps.heldUsd == null ? ` · platform fee $${feeUsd.toFixed(2)}` : ''}
            </Typography>
            {!caps.loaded && bookingId ? (
              <Typography variant='caption' color='text.secondary'>
                Checking escrow…
              </Typography>
            ) : null}
            {hasStripe ? null : (
              <Typography variant='body2' color='text.secondary'>
                {refundDestinationCopy(destination)}
              </Typography>
            )}
          </Box>

          {caps.releasedOnly ? (
            <Alert severity='warning'>
              Funds were already released to the coach. Only a full refund to the original payment method is possible,
              and it reverses the coach payout.
            </Alert>
          ) : null}

          <Box>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Refund amount
            </Typography>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
              <TextField
                size='small'
                type='number'
                label='Percent'
                value={percentInput}
                onChange={e => setPercentInput(e.target.value)}
                inputProps={{ min: 1, max: 100, step: 1 }}
                InputProps={{ endAdornment: <InputAdornment position='end'>%</InputAdornment> }}
                error={!percentValid}
                disabled={splitLocked}
                sx={{ width: 130 }}
              />
              {[100, 50, 25].map(p => (
                <Chip
                  key={p}
                  size='small'
                  label={`${p}%`}
                  clickable={!splitLocked}
                  disabled={splitLocked && p !== 100}
                  color={refundPercent === p ? 'primary' : 'default'}
                  variant={refundPercent === p ? 'filled' : 'outlined'}
                  onClick={() => !splitLocked && setPercentInput(String(p))}
                />
              ))}
            </Stack>
            <Typography variant='body2' color={percentValid ? 'text.secondary' : 'error'} sx={{ mt: 1 }}>
              {percentValid
                ? amountUsd
                  ? `≈ $${refundUsd.toFixed(2)} to the enthusiast.${
                      refundPercent < 100 ? ' The rest goes to the coach, minus platform commission.' : ''
                    }`
                  : refundPercent < 100
                    ? 'The rest goes to the coach, minus platform commission.'
                    : 'Full refund.'
                : 'Enter a whole number from 1 to 100.'}
            </Typography>
          </Box>

          {hasStripe ? (
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                Refund to
              </Typography>
              <RadioGroup value={refundTo} onChange={e => setRefundTo(e.target.value)}>
                <FormControlLabel
                  value='original'
                  control={<Radio size='small' />}
                  label='Original payment method (card, 5–10 business days)'
                />
                <FormControlLabel
                  value='wallet'
                  control={<Radio size='small' />}
                  label='NetQwix wallet credit (instant)'
                  disabled={walletLocked}
                />
              </RadioGroup>
              <Typography variant='caption' color='text.secondary'>
                {walletLocked
                  ? caps.releasedOnly
                    ? 'Wallet credit is unavailable because the coach was already paid.'
                    : 'Wallet credit is unavailable: this card payment has no escrow hold.'
                  : 'Partial refunds and wallet credit use the funds held in escrow.'}
              </Typography>
            </Box>
          ) : null}

          <Alert severity='info' icon={false}>
            <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
              What happens next
            </Typography>
            {isCancel ? (
              <Typography variant='body2'>
                The booking is cancelled first, and both the enthusiast and coach are notified.
              </Typography>
            ) : null}
            <Typography variant='body2'>1. Reason is stored on the booking and the finance audit log.</Typography>
            <Typography variant='body2'>
              2. Held escrow is reversed, or Stripe refunds the original charge if there is no hold.
            </Typography>
            <Typography variant='body2'>
              3. Wallet credits land immediately. Card refunds take 5–10 business days. Duplicate refunds are blocked.
            </Typography>
          </Alert>

          <Box>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Reason
            </Typography>
            <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mb: 1.5 }}>
              {REFUND_REASON_PRESETS.map(p => (
                <Chip
                  key={p.key}
                  size='small'
                  label={p.label}
                  clickable
                  color={preset === p.key ? 'primary' : 'default'}
                  variant={preset === p.key ? 'filled' : 'outlined'}
                  onClick={() => setPreset(p.key)}
                />
              ))}
            </Stack>
            <TextField
              fullWidth
              required={preset === 'other' || !preset}
              label={preset && preset !== 'other' ? 'Notes (optional)' : 'Refund reason (required)'}
              placeholder='Add context for audit — ticket #, policy, what support told the user'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              helperText='Minimum 3 characters total. The enthusiast and coach see the outcome; this text stays in admin audit.'
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color='inherit' disabled={submitting}>
          Back
        </Button>
        <Button
          variant='contained'
          color={isCancel ? 'error' : 'warning'}
          onClick={() => void handleRefund()}
          disabled={reason.length < 3 || !percentValid || submitting}
        >
          {submitting ? 'Working…' : isCancel ? 'Cancel and refund' : 'Process refund'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
