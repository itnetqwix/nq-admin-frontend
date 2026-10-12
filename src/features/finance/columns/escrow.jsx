import Button from '@mui/material/Button'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import toast from 'react-hot-toast'
import {
  disputeEscrowHold,
  refundEscrowHold,
  releaseEscrowHold,
  resolveDisputeEscrow
} from 'src/services/financeApi'
import { formatMinor } from '../constants'

export function buildEscrowColumns({ allowRefund, confirm, load }) {
  return [
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
}
