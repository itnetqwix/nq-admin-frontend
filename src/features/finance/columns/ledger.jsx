import Button from '@mui/material/Button'
import Link from 'next/link'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { formatMinor } from '../constants'

export function buildLedgerColumns() {
  return [
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
}
