import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { refundReasonLabel } from 'src/features/bookings/refundLabels'

export function buildAuditColumns() {
  return [
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
}
