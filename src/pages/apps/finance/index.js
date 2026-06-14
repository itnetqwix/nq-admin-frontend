import { useCallback, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  getFinanceLedger,
  getEscrowHolds,
  getPayoutQueue,
  getFinancialAuditLog,
  releaseEscrowHold,
  refundEscrowHold,
  adjustWallet,
  refundWalletSession,
  getStuckTopUps,
  reconcileStuckTopUps,
  reconcileFailedRefunds,
  reconcileStuckReleasingHolds,
  approvePayout
} from 'src/services/financeApi'

const FinancePage = () => {
  const [tab, setTab] = useState(0)
  const [ledger, setLedger] = useState([])
  const [escrow, setEscrow] = useState([])
  const [payouts, setPayouts] = useState([])
  const [audit, setAudit] = useState([])
  const [stuckTopUps, setStuckTopUps] = useState([])
  const [loading, setLoading] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [walletRefundOpen, setWalletRefundOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({
    walletAccountId: '',
    amount_minor: '',
    direction: 'credit',
    reason: ''
  })
  const [walletRefundForm, setWalletRefundForm] = useState({
    sessionId: '',
    traineeId: '',
    kind: 'booking',
    reason: 'admin_wallet_refund'
  })

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
      } else if (tab === 3) {
        const r = await getStuckTopUps({ maxAgeMinutes: 30 })
        setStuckTopUps(r?.items ?? [])
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

  const escrowCols = [
    { field: '_id', headerName: 'Hold ID', flex: 1, minWidth: 120 },
    { field: 'session_id', headerName: 'Session', flex: 1 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'kind', headerName: 'Kind', width: 100 },
    {
      field: 'gross_minor',
      headerName: 'Gross',
      width: 100,
      valueGetter: p => (p.row.gross_minor / 100).toFixed(2)
    },
    {
      field: 'actions',
      headerName: '',
      width: 220,
      renderCell: params =>
        params.row.status === 'held' ? (
          <Stack direction='row' spacing={1}>
            <Button
              size='small'
              onClick={async () => {
                await releaseEscrowHold(params.row._id, 'admin_release')
                load()
              }}
            >
              Release
            </Button>
            <Button
              size='small'
              color='warning'
              onClick={async () => {
                await refundEscrowHold(params.row._id, 'admin_refund')
                load()
              }}
            >
              Refund
            </Button>
          </Stack>
        ) : null
    }
  ]

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

  const topUpCols = [
    { field: '_id', headerName: 'Top-up ID', flex: 1 },
    { field: 'user_id', headerName: 'User', flex: 1 },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => (p.row.amount_minor / 100).toFixed(2)
    },
    { field: 'stripe_payment_intent_id', headerName: 'PI', flex: 1 },
    { field: 'createdAt', headerName: 'Created', width: 180 }
  ]

  const auditCols = [
    { field: 'action', headerName: 'Action', flex: 1 },
    { field: 'entity_type', headerName: 'Entity', width: 140 },
    { field: 'entity_id', headerName: 'Entity ID', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 },
    { field: 'createdAt', headerName: 'When', width: 180 }
  ]

  const rows =
    tab === 0 ? ledger : tab === 1 ? escrow : tab === 2 ? payouts : tab === 3 ? stuckTopUps : audit
  const cols =
    tab === 0
      ? ledgerCols
      : tab === 1
        ? escrowCols
        : tab === 2
          ? payoutCols
          : tab === 3
            ? topUpCols
            : auditCols

  const tabLabels = ['Ledger', 'Escrow', 'Payouts', 'Stuck top-ups', 'Audit log']

  return (
    <AdminPageShell
      title='Finance'
      subtitle='Ledger, escrow, payouts, wallet ops, and audit trail.'
      actions={
        <Stack direction='row' spacing={1}>
          <Button size='small' variant='outlined' onClick={() => setAdjustOpen(true)}>
            Adjust wallet
          </Button>
          <Button size='small' variant='outlined' onClick={() => setWalletRefundOpen(true)}>
            Wallet refund
          </Button>
          <Button
            size='small'
            variant='outlined'
            onClick={async () => {
              await reconcileStuckTopUps(30)
              load()
            }}
          >
            Reconcile top-ups
          </Button>
          <Button
            size='small'
            variant='outlined'
            onClick={async () => {
              await reconcileFailedRefunds()
            }}
          >
            Reconcile refunds
          </Button>
          <Button
            size='small'
            variant='outlined'
            onClick={async () => {
              await reconcileStuckReleasingHolds(60)
              load()
            }}
          >
            Reconcile releasing
          </Button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          {tabLabels.map(label => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight={false}
            rows={rows.map((r, i) => ({ id: r._id ?? r.entry_id ?? i, ...r }))}
            columns={cols}
            loading={loading}
          />
        </AdminGridContainer>
      </AdminPageSection>

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Wallet adjustment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Wallet account ID'
              value={adjustForm.walletAccountId}
              onChange={e => setAdjustForm(f => ({ ...f, walletAccountId: e.target.value }))}
              fullWidth
            />
            <TextField
              label='Amount (minor cents)'
              type='number'
              value={adjustForm.amount_minor}
              onChange={e => setAdjustForm(f => ({ ...f, amount_minor: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label='Direction'
              value={adjustForm.direction}
              onChange={e => setAdjustForm(f => ({ ...f, direction: e.target.value }))}
              fullWidth
            >
              <MenuItem value='credit'>Credit</MenuItem>
              <MenuItem value='debit'>Debit</MenuItem>
            </TextField>
            <TextField
              label='Reason'
              value={adjustForm.reason}
              onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={async () => {
              await adjustWallet({
                walletAccountId: adjustForm.walletAccountId,
                amount_minor: Number(adjustForm.amount_minor),
                direction: adjustForm.direction,
                reason: adjustForm.reason
              })
              setAdjustOpen(false)
              load()
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={walletRefundOpen} onClose={() => setWalletRefundOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Wallet refund (no PI)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Session ID'
              value={walletRefundForm.sessionId}
              onChange={e => setWalletRefundForm(f => ({ ...f, sessionId: e.target.value }))}
              fullWidth
            />
            <TextField
              label='Trainee ID'
              value={walletRefundForm.traineeId}
              onChange={e => setWalletRefundForm(f => ({ ...f, traineeId: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label='Kind'
              value={walletRefundForm.kind}
              onChange={e => setWalletRefundForm(f => ({ ...f, kind: e.target.value }))}
              fullWidth
            >
              <MenuItem value='booking'>Booking</MenuItem>
              <MenuItem value='extension'>Extension</MenuItem>
            </TextField>
            <TextField
              label='Reason'
              value={walletRefundForm.reason}
              onChange={e => setWalletRefundForm(f => ({ ...f, reason: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWalletRefundOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            color='warning'
            onClick={async () => {
              await refundWalletSession(walletRefundForm)
              setWalletRefundOpen(false)
            }}
          >
            Refund
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageShell>
  )
}

export default FinancePage
