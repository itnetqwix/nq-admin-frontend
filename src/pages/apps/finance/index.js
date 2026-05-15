import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  getFinanceLedger,
  getEscrowHolds,
  getPayoutQueue,
  getFinancialAuditLog,
  releaseEscrowHold,
  approvePayout
} from 'src/services/financeApi'

const FinancePage = () => {
  const [tab, setTab] = useState(0)
  const [ledger, setLedger] = useState([])
  const [escrow, setEscrow] = useState([])
  const [payouts, setPayouts] = useState([])
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 0) {
        const r = await getFinanceLedger({ page: 1, limit: 100 })
        setLedger(r?.items ?? [])
      } else if (tab === 1) {
        const r = await getEscrowHolds({ page: 1, limit: 100 })
        setEscrow(r?.items ?? [])
      } else if (tab === 2) {
        const r = await getPayoutQueue({ page: 1, limit: 100 })
        setPayouts(r?.items ?? [])
      } else {
        const r = await getFinancialAuditLog({ page: 1, limit: 100 })
        setAudit(r?.items ?? [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const ledgerCols = [
    { field: 'entry_id', headerName: 'Entry', flex: 1, minWidth: 120 },
    { field: 'reference_type', headerName: 'Type', width: 140 },
    { field: 'entry_type', headerName: 'Dr/Cr', width: 90 },
    { field: 'bucket', headerName: 'Bucket', width: 120 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => (p.row.amount_minor / 100).toFixed(2)
    },
    { field: 'createdAt', headerName: 'When', width: 180 }
  ]

  const escrowCols = [
    { field: '_id', headerName: 'Hold ID', flex: 1, minWidth: 120 },
    { field: 'session_id', headerName: 'Session', flex: 1 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'gross_minor',
      headerName: 'Gross',
      width: 100,
      valueGetter: p => (p.row.gross_minor / 100).toFixed(2)
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      renderCell: params =>
        params.row.status === 'held' ? (
          <Button
            size='small'
            onClick={async () => {
              await releaseEscrowHold(params.row._id, 'admin_release')
              load()
            }}
          >
            Release
          </Button>
        ) : null
    }
  ]

  const payoutCols = [
    { field: '_id', headerName: 'ID', flex: 1 },
    { field: 'trainer_id', headerName: 'Trainer', flex: 1 },
    { field: 'status', headerName: 'Status', width: 140 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => (p.row.amount_minor / 100).toFixed(2)
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      renderCell: params =>
        params.row.status === 'pending_approval' ? (
          <Button
            size='small'
            onClick={async () => {
              await approvePayout(params.row._id)
              load()
            }}
          >
            Approve
          </Button>
        ) : null
    }
  ]

  const auditCols = [
    { field: 'action', headerName: 'Action', flex: 1 },
    { field: 'entity_type', headerName: 'Entity', width: 140 },
    { field: 'entity_id', headerName: 'Entity ID', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 },
    { field: 'createdAt', headerName: 'When', width: 180 }
  ]

  const rows =
    tab === 0 ? ledger : tab === 1 ? escrow : tab === 2 ? payouts : audit
  const cols =
    tab === 0 ? ledgerCols : tab === 1 ? escrowCols : tab === 2 ? payoutCols : auditCols

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 2 }}>
        Finance
      </Typography>
      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label='Ledger' />
            <Tab label='Escrow' />
            <Tab label='Payouts' />
            <Tab label='Audit log' />
          </Tabs>
          <div style={{ height: 520, width: '100%' }}>
            <DataGrid
              rows={rows.map((r, i) => ({ id: r._id ?? r.entry_id ?? i, ...r }))}
              columns={cols}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  )
}

export default FinancePage
