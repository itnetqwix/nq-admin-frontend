import Button from '@mui/material/Button'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import {
  retryBookingRefund
} from 'src/services/financeApi'
import { formatMinor } from '../constants'
import { refundDestinationCopy, refundReasonLabel } from 'src/features/bookings/refundLabels'
import { PersonCell, StatusChip } from './cells'

export function buildRefundColumns({ allowRefund, confirm, load }) {
  return [
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
    { field: 'source', headerName: 'Source', width: 90 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: params => {
        const status = String(params.row.status || '').toLowerCase()
        const canRetry =
          allowRefund &&
          params.row.source === 'booking' &&
          params.row.session_id &&
          (status === 'failed' || status === 'processing' || status === 'pending')
        if (!canRetry) return null
        return (
          <Button
            size='small'
            color='warning'
            variant='outlined'
            onClick={async e => {
              e.stopPropagation()
              const ok = await confirm({
                title: 'Retry refund?',
                message: `Re-run escrow refund for booking ${params.row.session_id}. Use this for failed or stuck refunds.`,
                detail: `Booking ID: ${params.row.session_id}`,
                confirmLabel: 'Retry refund',
                variant: 'warning',
                reasonRequired: true,
                reasonLabel: 'Retry reason'
              })
              if (!ok) return
              try {
                await retryBookingRefund(params.row.session_id, ok.reason)
                toast.success('Refund retry submitted')
                load?.()
              } catch (err) {
                toast.error(err?.message || 'Retry failed')
              }
            }}
          >
            Retry
          </Button>
        )
      }
    }
  ]
}
