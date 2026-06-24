import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import moment from 'moment'
import toast from 'react-hot-toast'
import { useAdminConfirm } from 'src/components/admin'
import { getAdminBookingDetail } from 'src/services/bookingApi'
import { releaseEscrowHold, refundEscrowHold, refundWalletSession } from 'src/services/financeApi'
import SessionTimelinePanel from 'src/pages/components/booking/SessionTimelinePanel'
import { BookedSession, isCurrentDateBefore } from 'src/utils/utils'

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

function refundTransferLabel(transfer) {
  if (!transfer?.destination) return null
  const dest =
    transfer.destination === 'wallet'
      ? 'Wallet'
      : transfer.destination === 'card'
        ? 'Card'
        : 'Bank'
  const st = transfer.status ? String(transfer.status) : ''
  const expected = transfer.expected_by
    ? moment(transfer.expected_by).format('MMM D, YYYY h:mm A')
    : null
  if (transfer.destination === 'bank' && transfer.status === 'processing' && expected) {
    return `${dest}: ${st} (expected by ${expected})`
  }
  return `${dest}: ${st}`
}

export default function BookingDetailDrawer({
  open,
  bookingId,
  listRow,
  canRefund,
  onClose,
  onConfirm,
  onRequestCancel,
  onRequestRefund,
  onActionComplete
}) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const [timelineRefresh, setTimelineRefresh] = useState(0)
  const [escrowBusy, setEscrowBusy] = useState(false)
  const [extensionRefundBusy, setExtensionRefundBusy] = useState(false)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const loadDetail = () => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    getAdminBookingDetail(bookingId)
      .then(data => setDetail(data))
      .catch(e => setError(e?.message || 'Could not load booking'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!open || !bookingId) return
    loadDetail()
  }, [open, bookingId])

  const s = detail?.session
  const fmt = v => (v ? moment(v).format('MMM D, YYYY h:mm A') : '—')

  const canConfirm =
    s?.status === BookedSession.booked && isCurrentDateBefore(s?.start_time || s?.booked_date)
  const canCancel =
    s?.status === BookedSession.booked || s?.status === BookedSession.confirmed
  const canStartRefund =
    canRefund &&
    s?.status === 'canceled' &&
    s?.refund_status !== 'refunded' &&
    (listRow?.payment_intent_id ||
      detail?.payment?.payment_intent_id ||
      detail?.escrow?.hold_id ||
      listRow?.trainee_id ||
      detail?.trainee?._id)

  const escrowHoldId = detail?.escrow?.hold_id
  const canEscrowAction =
    canRefund && detail?.escrow?.status === 'held' && escrowHoldId

  const traineeFinanceId =
    detail?.trainee?._id || listRow?.trainee_id || listRow?.trainee_info?._id

  const runExtensionWalletRefund = async ext => {
    if (!s?._id || !traineeFinanceId) return
    const ok = await confirm({
      title: 'Refund extension to trainee wallet?',
      message: `Refund +${ext.minutes} min ($${Number(ext.amount).toFixed(2)}) via wallet refund path.`,
      detail: `Session: ${s._id}`,
      confirmLabel: 'Refund extension',
      variant: 'danger'
    })
    if (!ok) return
    setExtensionRefundBusy(true)
    try {
      await refundWalletSession({
        sessionId: String(s._id),
        traineeId: String(traineeFinanceId),
        kind: 'extension',
        reason: 'admin_booking_extension_refund'
      })
      toast.success('Extension wallet refund submitted')
      loadDetail()
      onActionComplete?.()
    } catch (e) {
      toast.error(e?.message || 'Extension refund failed')
    } finally {
      setExtensionRefundBusy(false)
    }
  }

  const runEscrowAction = async (action, reason) => {
    if (!escrowHoldId) return
    const ok = await confirm({
      title: action === 'release' ? 'Release escrow to trainer?' : 'Refund escrow to trainee?',
      message:
        action === 'release'
          ? 'Held funds will be released from escrow for this session.'
          : 'This starts a refund from held escrow back to the trainee wallet or card.',
      detail: `Hold ID: ${escrowHoldId}`,
      confirmLabel: action === 'release' ? 'Release' : 'Refund',
      variant: action === 'release' ? 'warning' : 'danger'
    })
    if (!ok) return
    setEscrowBusy(true)
    try {
      if (action === 'release') {
        await releaseEscrowHold(escrowHoldId, reason)
        toast.success('Escrow released')
      } else {
        await refundEscrowHold(escrowHoldId, reason)
        toast.success('Escrow refund started')
      }
      loadDetail()
      setTimelineRefresh(n => n + 1)
      onActionComplete?.()
    } catch (e) {
      toast.error(e?.message || 'Escrow action failed')
    } finally {
      setEscrowBusy(false)
    }
  }

  const handleConfirm = () => {
    if (!bookingId || !onConfirm) return
    onConfirm(bookingId)
    onActionComplete?.()
    loadDetail()
    setTimelineRefresh(n => n + 1)
  }

  const handleCancel = () => {
    if (!bookingId || !onRequestCancel) return
    onRequestCancel(bookingId)
  }

  const handleRefund = () => {
    if (!listRow || !onRequestRefund) return
    onRequestRefund(listRow)
  }

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6'>Booking detail</Typography>
        <IconButton onClick={onClose} aria-label='Close'>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      {s ? (
        <Stack direction='row' spacing={1} sx={{ p: 2, flexWrap: 'wrap' }}>
          {canConfirm ? (
            <Button size='small' variant='contained' onClick={handleConfirm}>
              Confirm
            </Button>
          ) : null}
          {canCancel ? (
            <Button size='small' variant='outlined' color='error' onClick={handleCancel}>
              Cancel
            </Button>
          ) : null}
          {canStartRefund ? (
            <Button size='small' variant='contained' color='secondary' onClick={handleRefund}>
              Start refund
            </Button>
          ) : null}
        </Stack>
      ) : null}

      <Box sx={{ p: 2, overflow: 'auto', pb: 4 }}>
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
            <DetailRow label='Refund status' value={detail?.refund?.status || s.refund_status} />
            <DetailRow
              label='Refund reason'
              value={detail?.refund?.reason_label || s.refund_reason_label || s.refund_reason}
            />
            <DetailRow
              label='Refund transfer'
              value={refundTransferLabel(detail?.refund?.transfer)}
            />
            <DetailRow label='Requested' value={fmt(s.requested_at)} />
            <DetailRow label='Accept deadline' value={fmt(s.accept_deadline_at)} />
            <DetailRow label='Accepted at' value={fmt(s.accepted_at)} />
            <DetailRow label='Join deadline' value={fmt(s.join_deadline_at)} />
            <DetailRow label='Both joined' value={fmt(s.both_joined_at)} />
            <DetailRow label='Actual end' value={fmt(s.actual_end_at)} />
            <DetailRow label='Early end (trainer ack)' value={fmt(s.early_end_trainer_ack_at)} />
            <DetailRow label='Early end (trainee ack)' value={fmt(s.early_end_trainee_ack_at)} />

            {detail?.live_state || detail?.departure ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Live session state
                </Typography>
                <Stack direction='row' spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Button
                    size='small'
                    variant='outlined'
                    href={`/apps/ops-logs?sessionId=${s._id}`}
                    component='a'
                  >
                    Ops logs
                  </Button>
                  <Button
                    size='small'
                    variant='outlined'
                    href={`/apps/call-diagnostics?sessionId=${s._id}`}
                    component='a'
                  >
                    Call diagnostics
                  </Button>
                </Stack>
                <DetailRow
                  label='Departure role'
                  value={detail?.departure?.initiated_by_role || s.departure_initiated_by_role}
                />
                <DetailRow
                  label='Departure at'
                  value={fmt(detail?.departure?.initiated_at || s.departure_initiated_at)}
                />
                <DetailRow
                  label='Partner stayed'
                  value={fmt(detail?.departure?.stayed_active_at || s.departure_stayed_active_at)}
                />
                <DetailRow
                  label='Rejoin deadline'
                  value={fmt(detail?.departure?.rejoin_deadline_at || s.departure_rejoin_deadline_at)}
                />
                <DetailRow
                  label='Concern raised'
                  value={fmt(detail?.departure?.concern_raised_at || s.departure_concern_raised_at)}
                />
                <DetailRow
                  label='Timer status'
                  value={detail?.live_state?.lesson_timer?.status}
                />
                <DetailRow
                  label='Timer remaining'
                  value={
                    detail?.live_state?.lesson_timer?.remainingSeconds != null
                      ? `${detail.live_state.lesson_timer.remainingSeconds}s`
                      : null
                  }
                />
                <DetailRow
                  label='Pause reason'
                  value={detail?.live_state?.lesson_timer?.pauseReason}
                />
                <DetailRow
                  label='Trainer call slot'
                  value={
                    detail?.live_state?.call_slots?.trainer?.canJoin === false
                      ? 'Active elsewhere'
                      : 'Available'
                  }
                />
                <DetailRow
                  label='Trainee call slot'
                  value={
                    detail?.live_state?.call_slots?.trainee?.canJoin === false
                      ? 'Active elsewhere'
                      : 'Available'
                  }
                />
                {Array.isArray(detail?.live_state?.lesson_client_kinds) &&
                detail.live_state.lesson_client_kinds.length > 0 ? (
                  <DetailRow
                    label='Client kinds'
                    value={detail.live_state.lesson_client_kinds
                      .map(c => `${c.role}: ${c.client}`)
                      .join(' · ')}
                  />
                ) : null}
              </>
            ) : null}

            {Array.isArray(s.extensions) && s.extensions.length > 0 ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Extensions
                </Typography>
                {s.extensions.map((ext, idx) => (
                  <Box key={`ext-${idx}`} sx={{ mb: 1.5, pl: 1, borderLeft: 2, borderColor: 'divider' }}>
                    <Typography variant='body2' fontWeight={600}>
                      +{ext.minutes} min — ${Number(ext.amount).toFixed(2)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {ext.status}
                      {ext.requested_by_name ? ` · ${ext.requested_by_name}` : ''} ·{' '}
                      {fmt(ext.applied_at || ext.requested_at)}
                    </Typography>
                    {canRefund &&
                    traineeFinanceId &&
                    (ext.status === 'paid' || ext.status === 'applied') ? (
                      <Button
                        size='small'
                        color='warning'
                        sx={{ mt: 0.5 }}
                        disabled={extensionRefundBusy}
                        onClick={() => runExtensionWalletRefund(ext)}
                      >
                        Refund extension
                      </Button>
                    ) : null}
                  </Box>
                ))}
                {s.total_extended_minutes ? (
                  <Typography variant='caption' color='primary'>
                    Total extended: {s.total_extended_minutes} min
                  </Typography>
                ) : null}
              </>
            ) : null}

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
                <Stack direction='row' spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Button
                    size='small'
                    variant='outlined'
                    href={`/apps/finance?sessionId=${s._id}&tab=escrow`}
                    component='a'
                  >
                    Finance (escrow)
                  </Button>
                  {canEscrowAction ? (
                    <>
                      <Button
                        size='small'
                        variant='contained'
                        disabled={escrowBusy}
                        onClick={() => runEscrowAction('release', 'admin_booking_release')}
                      >
                        Release hold
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        color='warning'
                        disabled={escrowBusy}
                        onClick={() => runEscrowAction('refund', 'admin_booking_refund')}
                      >
                        Refund hold
                      </Button>
                    </>
                  ) : null}
                </Stack>
                <DetailRow label='Hold ID' value={detail.escrow.hold_id} />
                <DetailRow label='Status' value={detail.escrow.status} />
                <DetailRow
                  label='Charged total'
                  value={
                    detail.escrow.charge_total_minor != null
                      ? `$${(detail.escrow.charge_total_minor / 100).toFixed(2)}`
                      : detail.escrow.gross_minor != null
                        ? `$${(detail.escrow.gross_minor / 100).toFixed(2)}`
                        : null
                  }
                />
                <DetailRow
                  label='Session subtotal'
                  value={
                    detail.escrow.session_subtotal_minor
                      ? `$${(detail.escrow.session_subtotal_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow
                  label='Surge'
                  value={
                    detail.escrow.surge_minor
                      ? `$${(detail.escrow.surge_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow
                  label='Trainee platform fee'
                  value={
                    detail.escrow.trainee_platform_fee_minor
                      ? `$${(detail.escrow.trainee_platform_fee_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow
                  label='Coach platform fee'
                  value={
                    detail.escrow.trainer_platform_fee_minor
                      ? `$${(detail.escrow.trainer_platform_fee_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow
                  label='Processing'
                  value={
                    detail.escrow.processing_fee_minor
                      ? `$${(detail.escrow.processing_fee_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow
                  label='Tax'
                  value={
                    detail.escrow.tax_minor
                      ? `$${(detail.escrow.tax_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow
                  label='% commission'
                  value={
                    detail.escrow.platform_fee_minor != null
                      ? `$${(detail.escrow.platform_fee_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow
                  label='Coach net'
                  value={
                    detail.escrow.trainer_net_minor != null
                      ? `$${(detail.escrow.trainer_net_minor / 100).toFixed(2)}`
                      : null
                  }
                />
                <DetailRow label='Funding' value={detail.escrow.funding_source} />
                <DetailRow label='Quote ID' value={detail.escrow.quote_id} />
                {Array.isArray(detail.escrow.release_blockers) &&
                detail.escrow.release_blockers.length > 0 ? (
                  <DetailRow
                    label='Release blockers'
                    value={detail.escrow.release_blockers.join('; ')}
                  />
                ) : null}
                <DetailRow label='Release eligible' value={fmt(detail.escrow.release_eligible_at)} />
                <DetailRow label='Released at' value={fmt(detail.escrow.released_at)} />
              </>
            ) : null}

            {detail?.payment?.payment_intent_id || s?._id ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Payment & finance
                </Typography>
                <Stack direction='row' spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Button
                    size='small'
                    variant='outlined'
                    href={`/apps/finance?sessionId=${s._id}`}
                    component='a'
                  >
                    Transactions
                  </Button>
                  {traineeFinanceId ? (
                    <Button
                      size='small'
                      variant='outlined'
                      href={`/apps/finance?userId=${traineeFinanceId}`}
                      component='a'
                    >
                      Trainee wallet
                    </Button>
                  ) : null}
                </Stack>
                {detail?.payment?.payment_intent_id ? (
                  <>
                    <DetailRow label='Method' value={detail.payment.method} />
                    <DetailRow label='Payment intent' value={detail.payment.payment_intent_id} />
                  </>
                ) : null}
              </>
            ) : null}

            {Array.isArray(detail?.ops_events) && detail.ops_events.length > 0 ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Ops timeline
                </Typography>
                {detail.ops_events.map(ev => (
                  <Box
                    key={ev._id || ev.event_id}
                    sx={{ mb: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                  >
                    <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.5 }}>
                      <Typography variant='caption' color='text.secondary'>
                        {fmt(ev.createdAt)}
                      </Typography>
                      {ev.severity ? (
                        <Chip size='small' label={ev.severity} sx={{ height: 20 }} />
                      ) : null}
                    </Stack>
                    <Typography variant='body2' fontWeight={600}>
                      {ev.title}
                    </Typography>
                    {ev.summary ? (
                      <Typography variant='caption' color='text.secondary'>
                        {ev.summary}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </>
            ) : null}

            {s?._id ? (
              <SessionTimelinePanel bookingId={String(s._id)} refreshKey={timelineRefresh} />
            ) : null}
          </>
        ) : null}
      </Box>
      {ConfirmDialog}
    </Drawer>
  )
}
