import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { formatMinor } from '../constants'

export function buildTopUpColumns() {
  return [
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
}
