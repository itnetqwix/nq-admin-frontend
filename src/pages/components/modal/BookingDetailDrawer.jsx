import React, { useEffect, useState } from 'react'
import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import moment from 'moment'
import { getAdminBookingDetail } from 'src/services/bookingApi'

function DetailRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75 }}>
      <Typography variant='body2' color='text.secondary' sx={{ minWidth: 160, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant='body2' sx={{ flex: 1, wordBreak: 'break-word' }}>
        {String(value)}
      </Typography>
    </Box>
  )
}

export default function BookingDetailDrawer({ open, bookingId, onClose }) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !bookingId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getAdminBookingDetail(bookingId)
      .then(data => {
        if (!cancelled) setDetail(data)
      })
      .catch(e => {
        if (!cancelled) setError(e?.message || 'Could not load booking')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, bookingId])

  const s = detail?.session
  const fmt = v => (v ? moment(v).format('MMM D, YYYY h:mm A') : '—')

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6'>Booking detail</Typography>
        <IconButton onClick={onClose} aria-label='Close'>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : null}
        {error ? (
          <Typography color='error' variant='body2'>
            {error}
          </Typography>
        ) : null}
        {s ? (
          <>
            <Typography variant='subtitle2' sx={{ mb: 1, mt: 1 }}>
              Session
            </Typography>
            <DetailRow label='Booking ID' value={s._id} />
            <DetailRow label='Status' value={s.status} />
            <DetailRow label='Type' value={s.is_instant ? 'Instant' : 'Scheduled'} />
            <DetailRow label='Instant phase' value={s.instant_phase} />
            <DetailRow label='Duration' value={s.duration_minutes ? `${s.duration_minutes} min` : null} />
            <DetailRow label='Booked date' value={fmt(s.booked_date)} />
            <DetailRow label='Start' value={fmt(s.start_time || s.session_start_time)} />
            <DetailRow label='End' value={fmt(s.end_time || s.session_end_time)} />
            <DetailRow label='Timezone' value={s.time_zone} />
            <DetailRow label='Amount' value={s.amount != null ? `$${s.amount}` : null} />
            <DetailRow label='Refund status' value={s.refund_status} />
            <DetailRow label='Refund reason' value={s.refund_reason_label || s.refund_reason} />
            <DetailRow label='Requested' value={fmt(s.requested_at)} />
            <DetailRow label='Accept deadline' value={fmt(s.accept_deadline_at)} />
            <DetailRow label='Accepted at' value={fmt(s.accepted_at)} />
            <DetailRow label='Join deadline' value={fmt(s.join_deadline_at)} />
            <DetailRow label='Both joined' value={fmt(s.both_joined_at)} />

            <Divider sx={{ my: 2 }} />
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Trainer
            </Typography>
            <DetailRow label='Name' value={detail?.trainer?.fullname} />
            <DetailRow label='Email' value={detail?.trainer?.email} />
            <DetailRow label='Timezone' value={detail?.trainer?.time_zone} />

            <Divider sx={{ my: 2 }} />
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Trainee
            </Typography>
            <DetailRow label='Name' value={detail?.trainee?.fullname} />
            <DetailRow label='Email' value={detail?.trainee?.email} />

            {detail?.escrow ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Escrow
                </Typography>
                <DetailRow label='Hold ID' value={detail.escrow.hold_id} />
                <DetailRow label='Status' value={detail.escrow.status} />
                <DetailRow
                  label='Gross'
                  value={
                    detail.escrow.gross_minor != null
                      ? `$${(detail.escrow.gross_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow label='Funding' value={detail.escrow.funding_source} />
                <DetailRow label='Release eligible' value={fmt(detail.escrow.release_eligible_at)} />
                <DetailRow label='Released at' value={fmt(detail.escrow.released_at)} />
              </>
            ) : null}

            {detail?.payment?.payment_intent_id ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Payment
                </Typography>
                <DetailRow label='Method' value={detail.payment.method} />
                <DetailRow label='Payment intent' value={detail.payment.payment_intent_id} />
              </>
            ) : null}
          </>
        ) : null}
      </Box>
    </Drawer>
  )
}
