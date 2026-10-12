import Button from '@mui/material/Button'
import Link from 'next/link'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { formatMinor } from '../constants'

export function buildTransactionColumns() {
  return [
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
}
