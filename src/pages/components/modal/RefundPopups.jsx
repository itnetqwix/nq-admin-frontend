import * as React from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography
} from '@mui/material'

export default function RefundPopups({ paymentIntentDetails, bookingPreview, handleClose, open, onConform }) {
  const [reason, setReason] = React.useState('')

  React.useEffect(() => {
    if (!open) setReason('')
  }, [open])

  const amountUsd = paymentIntentDetails?.amount_received ? paymentIntentDetails.amount_received / 100 : 0
  const feeUsd = paymentIntentDetails?.application_fee_amount ? paymentIntentDetails.application_fee_amount / 100 : 0

  const handleRefund = () => {
    const r = reason.trim()
    if (r.length < 3) return
    onConform?.(paymentIntentDetails?.id, r)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Confirm refund</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {bookingPreview ? (
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Booking
              </Typography>
              <Typography variant='body2'>ID: {bookingPreview._id}</Typography>
              {bookingPreview.trainer_info?.fullName ? (
                <Typography variant='body2'>Trainer: {bookingPreview.trainer_info.fullName}</Typography>
              ) : null}
              {bookingPreview.trainee_info?.fullName ? (
                <Typography variant='body2'>Trainee: {bookingPreview.trainee_info.fullName}</Typography>
              ) : null}
              {bookingPreview.status ? <Typography variant='body2'>Status: {bookingPreview.status}</Typography> : null}
            </Grid>
          ) : null}
          <Grid item xs={12}>
            <Typography>Total session cost: ${amountUsd.toFixed(2)}</Typography>
            <Typography>NetQwix fee: ${feeUsd.toFixed(2)}</Typography>
            <Typography>
              Payment method:{' '}
              {paymentIntentDetails?.payment_method_types ? paymentIntentDetails.payment_method_types[0] : '—'}
            </Typography>
            <Typography variant='caption' display='block' sx={{ mt: 1 }} color='text.secondary'>
              This creates a Stripe refund and is recorded in the admin audit log. Duplicate refunds are blocked.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label='Refund reason (required)'
              placeholder='e.g. Trainee no-show per policy #4'
              value={reason}
              onChange={e => setReason(e.target.value)}
              inputProps={{ minLength: 3 }}
              helperText='Minimum 3 characters. Shown in audit history.'
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color='inherit'>
          Cancel
        </Button>
        <Button variant='contained' color='warning' onClick={handleRefund} disabled={reason.trim().length < 3}>
          Process refund
        </Button>
      </DialogActions>
    </Dialog>
  )
}
