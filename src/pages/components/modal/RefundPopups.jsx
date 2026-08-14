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
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  REFUND_REASON_PRESETS,
  personDisplayName,
  refundDestinationCopy
} from 'src/features/bookings/refundLabels'

export default function RefundPopups({ paymentIntentDetails, bookingPreview, handleClose, open, onConform }) {
  const [preset, setPreset] = React.useState('')
  const [notes, setNotes] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setPreset('')
      setNotes('')
    }
  }, [open])

  const amountUsd = paymentIntentDetails?.amount_received
    ? paymentIntentDetails.amount_received / 100
    : bookingPreview?.amount != null
      ? Number(bookingPreview.amount)
      : 0
  const feeUsd = paymentIntentDetails?.application_fee_amount ? paymentIntentDetails.application_fee_amount / 100 : 0
  const hasStripe = Boolean(paymentIntentDetails?.id || bookingPreview?.payment_intent_id)
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

  const handleRefund = () => {
    if (reason.length < 3) return
    onConform?.(paymentIntentDetails?.id || bookingPreview?.payment_intent_id || null, reason)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Refund this session</DialogTitle>
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
              {hasStripe && feeUsd ? ` · platform fee $${feeUsd.toFixed(2)}` : ''}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {refundDestinationCopy(destination)}
            </Typography>
          </Box>

          <Alert severity='info' icon={false}>
            <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
              What happens next
            </Typography>
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
        <Button onClick={handleClose} color='inherit'>
          Back
        </Button>
        <Button variant='contained' color='warning' onClick={handleRefund} disabled={reason.length < 3}>
          Process refund
        </Button>
      </DialogActions>
    </Dialog>
  )
}
