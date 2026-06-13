import * as React from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { CustomButton } from '../common'
import Modal from './Modal'
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation'
import ReplayCircleFilledIcon from '@mui/icons-material/ReplayCircleFilled'

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
    <Modal handleClose={handleClose} open={open} maxWidth='sm'>
      <Box>
        <Box padding={'2rem'}>
          <Typography variant='h6' gutterBottom sx={{ textAlign: 'center', fontWeight: '600' }}>
            Confirm refund
          </Typography>
          <Box paddingTop={'1rem'}>
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
              <Grid item xs={12} sm={12}>
                <Typography>Total session cost: {amountUsd}$</Typography>
                <Typography>NetQwix fee: {feeUsd}$</Typography>
                <Typography>
                  Payment method:{' '}
                  {paymentIntentDetails?.payment_method_types ? paymentIntentDetails.payment_method_types[0] : ''}
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
              <Grid container justifyContent={'center'} sx={{ mt: 1 }}>
                <CustomButton
                  onClick={handleClose}
                  variant='contained'
                  startIcon={<CancelPresentationIcon />}
                  sx={{ marginRight: '10px', backgroundColor: 'gray', color: 'white' }}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  onClick={handleRefund}
                  variant='contained'
                  disabled={reason.trim().length < 3}
                  startIcon={<ReplayCircleFilledIcon />}
                  sx={{ marginLeft: '10px', backgroundColor: 'green', color: 'white' }}
                >
                  Refund
                </CustomButton>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}
