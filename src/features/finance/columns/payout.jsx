import Button from '@mui/material/Button'
import toast from 'react-hot-toast'
import {
  approvePayout
} from 'src/services/financeApi'
import { formatMinor } from '../constants'

export function buildPayoutColumns({ allowPayout, confirm, load }) {
  return [
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
      field: 'amount_minor',
      headerName: 'Gross',
      width: 100,
      valueGetter: p => formatMinor(p.row.gross_minor ?? p.row.amount_minor)
    },
    {
      field: 'fee_minor',
      headerName: 'Fee',
      width: 90,
      valueGetter: p => formatMinor(p.row.fee_minor || 0)
    },
    {
      field: 'net_minor',
      headerName: 'Net',
      width: 100,
      valueGetter: p => formatMinor(p.row.net_minor ?? p.row.amount_minor)
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
}
