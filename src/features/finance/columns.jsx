import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import {
  approvePayout,
  disputeEscrowHold,
  refundEscrowHold,
  releaseEscrowHold,
  resolveDisputeEscrow
} from 'src/services/financeApi'
import { formatMinor, TAB } from './constants'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { refundDestinationCopy, refundReasonLabel, refundStatusLabel } from 'src/features/bookings/refundLabels'

function PersonCell({ person, fallbackId }) {
  const id = person?.id || fallbackId
  const name = person?.name || (id ? String(id).slice(-6) : '—')
  const email = person?.email
  if (!id && !person?.name) return '—'
  return (
    <Box sx={{ lineHeight: 1.25, py: 0.5, minWidth: 0 }}>
      {id ? (
        <Button size='small' component={Link} href={`/apps/users/${id}`} onClick={e => e.stopPropagation()} sx={{ px: 0, minWidth: 0, textTransform: 'none' }}>
          {name}
        </Button>
      ) : (
        <Typography variant='body2'>{name}</Typography>
      )}
      {email ? (
        <Typography variant='caption' display='block' color='text.secondary' noWrap>
          {email}
        </Typography>
      ) : null}
    </Box>
  )
}

function StatusChip({ status }) {
  const s = String(status || '').toLowerCase()
  const color =
    s === 'failed' || s === 'disputed' || s === 'open' || s === 'chargeback' ? 'error' : s === 'processing' || s === 'pending' || s === 'releasing' ? 'warning' : s === 'completed' || s === 'refunded' || s === 'released' ? 'success' : 'default'
  return <Chip size='small' label={refundStatusLabel(status)} color={color} variant='outlined' />
}

export function buildFinanceColumns({ allowRefund, allowPayout, confirm, load, tab }) {
  const escrowCols = [
    { field: '_id', headerName: 'Hold ID', flex: 1, minWidth: 120 },
    {
      field: 'session_id',
      headerName: 'Session',
      flex: 1,
      renderCell: params =>
        params.row.session_id ? (
          <Button
            size='small'
            component={Link}
            href={`/apps/booking?bookingId=${params.row.session_id}`}
          >
            Open
          </Button>
        ) : (
          '—'
        )
    },
    { field: 'status', headerName: 'Status', width: 110 },
    { field: 'kind', headerName: 'Kind', width: 90 },
    { field: 'funding_source', headerName: 'Funding', width: 90 },
    {
      field: 'gross_minor',
      headerName: 'Gross',
      width: 90,
      valueGetter: p => formatMinor(p.row.gross_minor)
    },
    {
      field: 'session_subtotal_minor',
      headerName: 'Subtotal',
      width: 90,
      valueGetter: p => formatMinor(p.row.session_subtotal_minor)
    },
    {
      field: 'surge_minor',
      headerName: 'Surge',
      width: 80,
      valueGetter: p => formatMinor(p.row.surge_minor)
    },
    {
      field: 'processing_fee_minor',
      headerName: 'Processing',
      width: 90,
      valueGetter: p => formatMinor(p.row.processing_fee_minor)
    },
    {
      field: 'tax_minor',
      headerName: 'Tax',
      width: 80,
      valueGetter: p => formatMinor(p.row.tax_minor)
    },
    {
      field: 'platform_fee_minor',
      headerName: 'Platform fee',
      width: 100,
      valueGetter: p => formatMinor(p.row.platform_fee_minor)
    },
    {
      field: 'trainer_net_minor',
      headerName: 'Trainer net',
      width: 100,
      valueGetter: p => formatMinor(p.row.trainer_net_minor)
    },
    {
      field: 'release_eligible_at',
      headerName: 'Release eligible',
      width: 150,
      valueGetter: p =>
        p.row.release_eligible_at ? new Date(p.row.release_eligible_at).toLocaleString() : '—'
    },
    {
      field: 'createdAt',
      headerName: 'Age',
      width: 120,
      valueGetter: p => {
        if (!p.row.createdAt) return '—'
        const hours = (Date.now() - new Date(p.row.createdAt).getTime()) / 3_600_000
        if (hours < 24) return '<24h'
        if (hours < 168) return '1–7d'
        if (hours < 720) return '7–30d'
        return '30d+'
      }
    },
    {
      field: 'actions',
      headerName: '',
      width: 300,
      renderCell: params => {
        if (!allowRefund) return null
        if (params.row.status === 'disputed') {
          return (
            <Stack direction='row' spacing={1} flexWrap='wrap'>
              <Button
                size='small'
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Release to trainer?',
                    message: 'Resolve dispute in favor of the trainer and release escrow.',
                    detail: `Hold ID: ${params.row._id}`,
                    confirmLabel: 'Release trainer',
                    variant: 'warning',
                    reasonRequired: true,
                    reasonLabel: 'Resolution note'
                  })
                  if (!ok) return
                  try {
                    await resolveDisputeEscrow(params.row._id, 'release_trainer', ok.reason)
                    toast.success('Dispute resolved — released to trainer')
                    load()
                  } catch (e) {
                    toast.error(e?.message || 'Resolve failed')
                  }
                }}
              >
                Release trainer
              </Button>
              <Button
                size='small'
                color='warning'
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Refund trainee?',
                    message: 'Resolve dispute in favor of the trainee and refund escrow.',
                    detail: `Hold ID: ${params.row._id}`,
                    confirmLabel: 'Refund trainee',
                    variant: 'danger',
                    reasonRequired: true,
                    reasonLabel: 'Resolution note'
                  })
                  if (!ok) return
                  try {
                    await resolveDisputeEscrow(params.row._id, 'refund_trainee', ok.reason)
                    toast.success('Dispute resolved — refunded trainee')
                    load()
                  } catch (e) {
                    toast.error(e?.message || 'Resolve failed')
                  }
                }}
              >
                Refund trainee
              </Button>
              <Button
                size='small'
                variant='outlined'
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Reinstate hold?',
                    message: 'Return this hold to normal held status (dispute cleared).',
                    detail: `Hold ID: ${params.row._id}`,
                    confirmLabel: 'Reinstate',
                    variant: 'default',
                    reasonRequired: true,
                    reasonLabel: 'Why reinstate?'
                  })
                  if (!ok) return
                  try {
                    await resolveDisputeEscrow(params.row._id, 'reinstate_held', ok.reason)
                    toast.success('Hold reinstated')
                    load()
                  } catch (e) {
                    toast.error(e?.message || 'Reinstate failed')
                  }
                }}
              >
                Reinstate
              </Button>
            </Stack>
          )
        }
        if (params.row.status !== 'held') return null
        return (
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            <Button
              size='small'
              onClick={async () => {
                const ok = await confirm({
                  title: 'Release escrow to trainer?',
                  message: 'Held funds will be released from escrow for this session.',
                  detail: `Hold ID: ${params.row._id}`,
                  confirmLabel: 'Release',
                  variant: 'warning',
                  reasonRequired: true,
                  reasonLabel: 'Why release now?'
                })
                if (!ok) return
                try {
                  await releaseEscrowHold(params.row._id, ok.reason)
                  toast.success('Escrow released')
                  load()
                } catch (e) {
                  toast.error(e?.message || 'Release failed')
                }
              }}
            >
              Release
            </Button>
            <Button
              size='small'
              color='warning'
              onClick={async () => {
                const ok = await confirm({
                  title: 'Refund escrow to trainee?',
                  message: 'This starts a refund from held escrow back to the trainee wallet or card. Wallet is usually instant; cards take 5–10 business days.',
                  detail: `Hold ID: ${params.row._id}`,
                  confirmLabel: 'Refund',
                  variant: 'danger',
                  reasonRequired: true,
                  reasonLabel: 'Refund reason'
                })
                if (!ok) return
                try {
                  await refundEscrowHold(params.row._id, ok.reason)
                  toast.success('Escrow refund started')
                  load()
                } catch (e) {
                  toast.error(e?.message || 'Refund failed')
                }
              }}
            >
              Refund
            </Button>
            <Button
              size='small'
              color='error'
              onClick={async () => {
                const ok = await confirm({
                  title: 'Mark escrow as disputed?',
                  message: 'Freezes the hold for manual review. No automatic release until resolved.',
                  detail: `Hold ID: ${params.row._id}`,
                  confirmLabel: 'Mark disputed',
                  variant: 'danger',
                  reasonRequired: true,
                  reasonLabel: 'Dispute reason'
                })
                if (!ok) return
                try {
                  await disputeEscrowHold(params.row._id, ok.reason)
                  toast.success('Hold marked disputed')
                  load()
                } catch (e) {
                  toast.error(e?.message || 'Dispute failed')
                }
              }}
            >
              Dispute
            </Button>
          </Stack>
        )
      }
    }
  ]

  const ledgerCols = [
    { field: 'entry_id', headerName: 'Entry', flex: 1, minWidth: 120 },
    { field: 'reference_type', headerName: 'Type', width: 140 },
    {
      field: 'reference_id',
      headerName: 'Reference',
      flex: 1,
      minWidth: 120,
      renderCell: params => {
        const ref = params.row.reference_id
        if (!ref) return '—'
        const isSession = String(params.row.reference_type || '').includes('escrow') || ref.length === 24
        if (isSession && ref.length === 24) {
          return (
            <Button size='small' component={Link} href={`/apps/booking?bookingId=${ref}`}>
              {String(ref).slice(-6)}
            </Button>
          )
        }
        return String(ref).slice(0, 16)
      }
    },
    { field: 'entry_type', headerName: 'Dr/Cr', width: 90 },
    { field: 'bucket', headerName: 'Bucket', width: 120 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    { field: 'createdAt', headerName: 'When', width: 160, valueGetter: p => formatOpsDateTime(p.row.createdAt) }
  ]

  const transactionCols = [
    { field: 'source', headerName: 'Source', width: 110 },
    { field: 'label', headerName: 'Label', flex: 1, minWidth: 140 },
    { field: 'id', headerName: 'ID', flex: 1, minWidth: 120 },
    {
      field: 'session_id',
      headerName: 'Session',
      flex: 1,
      minWidth: 120,
      renderCell: params =>
        params.row.session_id ? (
          <Button size='small' component={Link} href={`/apps/booking?bookingId=${params.row.session_id}`}>
            Open
          </Button>
        ) : (
          '—'
        )
    },
    { field: 'payment_intent_id', headerName: 'PI', flex: 1, minWidth: 120 },
    { field: 'status', headerName: 'Status', width: 110 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    { field: 'createdAt', headerName: 'When', width: 160, valueGetter: p => formatOpsDateTime(p.row.createdAt) }
  ]

  const refundCols = [
    {
      field: 'createdAt',
      headerName: 'When',
      width: 160,
      valueGetter: p => formatOpsDateTime(p.row.createdAt)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: p => <StatusChip status={p.row.status} />
    },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    {
      field: 'trainee',
      headerName: 'Enthusiast',
      flex: 1,
      minWidth: 150,
      renderCell: p => <PersonCell person={p.row.trainee} fallbackId={p.row.user_id} />
    },
    {
      field: 'trainer',
      headerName: 'Coach',
      flex: 1,
      minWidth: 140,
      renderCell: p => <PersonCell person={p.row.trainer} />
    },
    {
      field: 'reason',
      headerName: 'Reason',
      flex: 1.2,
      minWidth: 180,
      renderCell: p => (
        <Box sx={{ py: 0.5, minWidth: 0 }}>
          <Typography variant='body2' noWrap title={p.row.reason || ''}>
            {refundReasonLabel(p.row.reason)}
          </Typography>
          {p.row.actor?.name ? (
            <Typography variant='caption' color='text.secondary' noWrap>
              by {p.row.actor.name}
            </Typography>
          ) : null}
        </Box>
      )
    },
    {
      field: 'path',
      headerName: 'Destination',
      width: 170,
      renderCell: p => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant='body2'>{refundDestinationCopy(p.row.destination || p.row.path)}</Typography>
          {p.row.expected_by ? (
            <Typography variant='caption' color='text.secondary'>
              ETA {formatOpsDateTime(p.row.expected_by, { withSeconds: false })}
            </Typography>
          ) : p.row.transfer_status ? (
            <Typography variant='caption' color='text.secondary'>
              {p.row.transfer_status}
            </Typography>
          ) : null}
        </Box>
      )
    },
    {
      field: 'session_id',
      headerName: 'Session',
      width: 110,
      renderCell: params =>
        params.row.session_id ? (
          <Button size='small' component={Link} href={`/apps/booking?bookingId=${params.row.session_id}`}>
            Open
          </Button>
        ) : (
          '—'
        )
    },
    { field: 'source', headerName: 'Source', width: 90 }
  ]

  const payoutCols = [
    { field: '_id', headerName: 'ID', flex: 1, minWidth: 100 },
    {
      field: 'trainer_id',
      headerName: 'Trainer',
      flex: 1,
      minWidth: 120,
      valueGetter: p => {
        const t = p.row.trainer_id
        if (!t) return '—'
        if (typeof t === 'object') return t.fullname || t.email || t._id
        return String(t).slice(-8)
      }
    },
    { field: 'status', headerName: 'Status', width: 140 },
    {
      field: 'stripe_transfer_id',
      headerName: 'Stripe transfer',
      flex: 1,
      minWidth: 120,
      valueGetter: p => p.row.stripe_transfer_id || '—'
    },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      renderCell: params =>
        params.row.status === 'pending_approval' && allowPayout ? (
          <Button
            size='small'
            onClick={async () => {
              const ok = await confirm({
                title: 'Approve trainer payout?',
                message: 'Funds will be sent to the trainer per the payout preference on file.',
                detail: `Payout ID: ${params.row._id}`,
                confirmLabel: 'Approve',
                variant: 'warning'
              })
              if (!ok) return
              const secondAdminId = window.prompt(
                'Second admin user ID (required for dual approval on large payouts):'
              )
              if (!secondAdminId?.trim()) {
                toast.error('Second admin ID is required')
                return
              }
              try {
                await approvePayout(params.row._id, secondAdminId.trim())
                toast.success('Payout approved')
                load()
              } catch (e) {
                toast.error(e?.message || 'Approve failed')
              }
            }}
          >
            Approve
          </Button>
        ) : null
    }
  ]

  const topUpCols = [
    { field: '_id', headerName: 'Top-up ID', flex: 1 },
    { field: 'user_id', headerName: 'User', flex: 1 },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    { field: 'stripe_payment_intent_id', headerName: 'PI', flex: 1 },
    { field: 'createdAt', headerName: 'Created', width: 160, valueGetter: p => formatOpsDateTime(p.row.createdAt) }
  ]

  const auditCols = [
    { field: 'action', headerName: 'Action', flex: 1 },
    { field: 'entity_type', headerName: 'Entity', width: 140 },
    { field: 'entity_id', headerName: 'Entity ID', flex: 1 },
    {
      field: 'reason',
      headerName: 'Reason',
      flex: 1,
      renderCell: p => refundReasonLabel(p.row.reason)
    },
    { field: 'createdAt', headerName: 'When', width: 160, valueGetter: p => formatOpsDateTime(p.row.createdAt) }
  ]

  if (tab === TAB.LEDGER) return ledgerCols
  if (tab === TAB.TRANSACTIONS) return transactionCols
  if (tab === TAB.ESCROW) return escrowCols
  if (tab === TAB.REFUNDS) return refundCols
  if (tab === TAB.PAYOUTS) return payoutCols
  if (tab === TAB.STUCK_TOPUPS) return topUpCols
  if (tab === TAB.TOPUPS) return topUpCols
  return auditCols
}
