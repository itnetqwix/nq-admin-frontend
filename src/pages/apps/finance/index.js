import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import Link from 'next/link'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  getFinanceLedger,
  getEscrowHolds,
  getEscrowSummary,
  getPayoutQueue,
  getFinancialAuditLog,
  getRefundQueue,
  searchFinanceTransactions,
  releaseEscrowHold,
  refundEscrowHold,
  adjustWallet,
  refundWalletSession,
  getStuckTopUps,
  reconcileStuckTopUps,
  reconcileFailedRefunds,
  reconcileStuckReleasingHolds,
  approvePayout,
  migrateLegacyBalances,
  disputeEscrowHold,
  resolveDisputeEscrow,
  getTopUpHistory,
  getFinanceOpsDashboard
} from 'src/services/financeApi'

const TAB = {
  LEDGER: 0,
  TRANSACTIONS: 1,
  ESCROW: 2,
  REFUNDS: 3,
  PAYOUTS: 4,
  STUCK_TOPUPS: 5,
  TOPUPS: 7,
  AUDIT: 6
}

const tabLabels = [
  'Ledger',
  'Transactions',
  'Escrow',
  'Refunds',
  'Payouts',
  'Stuck top-ups',
  'Top-up history',
  'Audit log'
]

function formatMinor(minor) {
  if (minor == null) return '—'
  return (Number(minor) / 100).toFixed(2)
}

async function runReconcile(label, fn, onDone) {
  try {
    const result = await fn()
    const retried = result?.data?.retried ?? result?.retried
    const ok = result?.data?.ok ?? result?.ok
    if (retried != null) {
      toast.success(`${label}: retried ${retried}`)
    } else if (ok) {
      toast.success(`${label} completed`)
    } else {
      toast.success(label)
    }
    onDone?.()
  } catch (e) {
    toast.error(e?.message || `${label} failed`)
  }
}

const FinancePage = () => {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const canRefund = ability?.can('update', 'admin-action-refund') ?? true
  const [tab, setTab] = useState(TAB.LEDGER)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const [ledger, setLedger] = useState([])
  const [transactions, setTransactions] = useState([])
  const [escrow, setEscrow] = useState([])
  const [escrowSummary, setEscrowSummary] = useState(null)
  const [refunds, setRefunds] = useState([])
  const [payouts, setPayouts] = useState([])
  const [audit, setAudit] = useState([])
  const [stuckTopUps, setStuckTopUps] = useState([])
  const [topUpHistory, setTopUpHistory] = useState([])
  const [opsDashboard, setOpsDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [refundStatus, setRefundStatus] = useState('')
  const [escrowStatus, setEscrowStatus] = useState('')
  const [ledgerReferenceType, setLedgerReferenceType] = useState('')
  const [migrateOpen, setMigrateOpen] = useState(false)
  const [migrateDryRun, setMigrateDryRun] = useState(true)
  const [migrateResult, setMigrateResult] = useState(null)
  const [migrateBusy, setMigrateBusy] = useState(false)
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

  useEffect(() => {
    const q = router.query?.userId
    if (typeof q === 'string' && q.trim()) {
      setSearchQ(q.trim())
      setTab(TAB.TRANSACTIONS)
    }
    const sessionId = router.query?.sessionId
    if (typeof sessionId === 'string' && sessionId.trim()) {
      setSearchQ(sessionId.trim())
      const tabKey = String(router.query?.tab || '').toLowerCase()
      if (tabKey === 'escrow') {
        setTab(TAB.ESCROW)
      } else if (tabKey === 'ledger') {
        setTab(TAB.LEDGER)
      } else {
        setTab(TAB.TRANSACTIONS)
      }
    }
  }, [router.query?.userId, router.query?.sessionId, router.query?.tab])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === TAB.LEDGER) {
        const r = await getFinanceLedger({
          page,
          limit: pageSize,
          userId: searchQ || undefined,
          referenceType: ledgerReferenceType || undefined,
          sessionId: searchQ && searchQ.length === 24 ? searchQ : undefined
        })
        setLedger(r?.items ?? [])
        setTotal(r?.total ?? 0)
      } else if (tab === TAB.TRANSACTIONS) {
        const query = searchQ.trim()
        const isPi = query.startsWith('pi_')
        const r = await searchFinanceTransactions({
          page,
          limit: pageSize,
          q: query || undefined,
          paymentIntentId: isPi ? query : undefined,
          userId: !isPi && query && query.length === 24 ? query : undefined,
          sessionId: !isPi && query && query.length === 24 ? query : undefined
        })
        setTransactions(r?.items ?? [])
        setTotal(r?.total ?? 0)
      } else if (tab === TAB.ESCROW) {
        const [r, summary] = await Promise.all([
          getEscrowHolds({
            page,
            limit: pageSize,
            status: escrowStatus || undefined,
            sessionId: searchQ && searchQ.length === 24 ? searchQ : undefined
          }),
          getEscrowSummary()
        ])
        setEscrow(r?.items ?? [])
        setTotal(r?.total ?? 0)
        setEscrowSummary(summary)
      } else if (tab === TAB.REFUNDS) {
        const r = await getRefundQueue({ page, limit: pageSize, status: refundStatus || undefined })
        setRefunds(r?.items ?? [])
        setTotal(r?.total ?? 0)
      } else if (tab === TAB.PAYOUTS) {
        const r = await getPayoutQueue({ page, limit: pageSize })
        setPayouts(r?.items ?? [])
        setTotal(r?.total ?? 0)
      } else if (tab === TAB.STUCK_TOPUPS) {
        const r = await getStuckTopUps({ maxAgeMinutes: 30 })
        setStuckTopUps(r?.items ?? [])
        setTotal(r?.items?.length ?? 0)
      } else if (tab === TAB.TOPUPS) {
        const r = await getTopUpHistory({ page, limit: pageSize, userId: searchQ || undefined })
        setTopUpHistory(r?.items ?? [])
        setTotal(r?.total ?? 0)
      } else {
        const r = await getFinancialAuditLog({ page, limit: pageSize })
        setAudit(r?.items ?? [])
        setTotal(r?.total ?? 0)
      }
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }, [tab, page, searchQ, refundStatus, escrowStatus, ledgerReferenceType])

  useEffect(() => {
    void getFinanceOpsDashboard()
      .then(setOpsDashboard)
      .catch(() => setOpsDashboard(null))
  }, [tab, page])

  useEffect(() => {
    setPage(1)
  }, [tab, searchQ, refundStatus, escrowStatus, ledgerReferenceType])

  useEffect(() => {
    load()
  }, [load])

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
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'kind', headerName: 'Kind', width: 100 },
    {
      field: 'gross_minor',
      headerName: 'Gross',
      width: 100,
      valueGetter: p => formatMinor(p.row.gross_minor)
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
        if (!canRefund) return null
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
                    variant: 'warning'
                  })
                  if (!ok) return
                  try {
                    await resolveDisputeEscrow(params.row._id, 'release_trainer', 'admin_dispute_release')
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
                    variant: 'danger'
                  })
                  if (!ok) return
                  try {
                    await resolveDisputeEscrow(params.row._id, 'refund_trainee', 'admin_dispute_refund')
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
                    variant: 'default'
                  })
                  if (!ok) return
                  try {
                    await resolveDisputeEscrow(params.row._id, 'reinstate_held', 'admin_dispute_reinstate')
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
                  variant: 'warning'
                })
                if (!ok) return
                try {
                  await releaseEscrowHold(params.row._id, 'admin_release')
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
                  message: 'This starts a refund from held escrow back to the trainee wallet or card.',
                  detail: `Hold ID: ${params.row._id}`,
                  confirmLabel: 'Refund',
                  variant: 'danger'
                })
                if (!ok) return
                try {
                  await refundEscrowHold(params.row._id, 'admin_refund')
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
                  variant: 'danger'
                })
                if (!ok) return
                try {
                  await disputeEscrowHold(params.row._id, 'admin_dispute')
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
    { field: 'entry_type', headerName: 'Dr/Cr', width: 90 },
    { field: 'bucket', headerName: 'Bucket', width: 120 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    { field: 'createdAt', headerName: 'When', width: 180 }
  ]

  const transactionCols = [
    { field: 'source', headerName: 'Source', width: 110 },
    { field: 'label', headerName: 'Label', flex: 1, minWidth: 140 },
    { field: 'id', headerName: 'ID', flex: 1, minWidth: 120 },
    { field: 'session_id', headerName: 'Session', flex: 1, minWidth: 120 },
    { field: 'payment_intent_id', headerName: 'PI', flex: 1, minWidth: 120 },
    { field: 'status', headerName: 'Status', width: 110 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    { field: 'createdAt', headerName: 'When', width: 180 }
  ]

  const refundCols = [
    { field: 'source', headerName: 'Source', width: 100 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'path', headerName: 'Path', width: 100 },
    { field: 'session_id', headerName: 'Session', flex: 1 },
    { field: 'payment_intent_id', headerName: 'PI', flex: 1 },
    {
      field: 'amount_minor',
      headerName: 'Amount',
      width: 100,
      valueGetter: p => formatMinor(p.row.amount_minor)
    },
    { field: 'reason', headerName: 'Reason', flex: 1 },
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
      valueGetter: p => formatMinor(p.row.amount_minor)
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
    { field: 'createdAt', headerName: 'Created', width: 180 }
  ]

  const auditCols = [
    { field: 'action', headerName: 'Action', flex: 1 },
    { field: 'entity_type', headerName: 'Entity', width: 140 },
    { field: 'entity_id', headerName: 'Entity ID', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 1 },
    { field: 'createdAt', headerName: 'When', width: 180 }
  ]

  const rows = useMemo(() => {
    if (tab === TAB.LEDGER) return ledger
    if (tab === TAB.TRANSACTIONS) return transactions
    if (tab === TAB.ESCROW) return escrow
    if (tab === TAB.REFUNDS) return refunds
    if (tab === TAB.PAYOUTS) return payouts
    if (tab === TAB.STUCK_TOPUPS) return stuckTopUps
    if (tab === TAB.TOPUPS) return topUpHistory
    return audit
  }, [tab, ledger, transactions, escrow, refunds, payouts, stuckTopUps, topUpHistory, audit])

  const cols = useMemo(() => {
    if (tab === TAB.LEDGER) return ledgerCols
    if (tab === TAB.TRANSACTIONS) return transactionCols
    if (tab === TAB.ESCROW) return escrowCols
    if (tab === TAB.REFUNDS) return refundCols
    if (tab === TAB.PAYOUTS) return payoutCols
    if (tab === TAB.STUCK_TOPUPS) return topUpCols
    if (tab === TAB.TOPUPS) return topUpCols
    return auditCols
  }, [tab])

  const heldSummary = escrowSummary?.byStatus?.held
  const aging = escrowSummary?.aging

  return (
    <AdminPageShell
      title='Finance'
      subtitle='Ledger, escrow, payouts, wallet ops, and audit trail.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Button size='small' variant='outlined' component={Link} href='/apps/finance/connect'>
            Stripe Connect
          </Button>
          <Button size='small' variant='outlined' onClick={() => setAdjustOpen(true)}>
            Adjust wallet
          </Button>
          {canRefund ? (
            <Button size='small' variant='outlined' onClick={() => setWalletRefundOpen(true)}>
              Wallet refund
            </Button>
          ) : null}
          <Button
            size='small'
            variant='outlined'
            onClick={() => {
              setMigrateOpen(true)
              setMigrateResult(null)
            }}
          >
            Migrate legacy balances
          </Button>
          <Button
            size='small'
            variant='outlined'
            onClick={() => runReconcile('Reconcile top-ups', () => reconcileStuckTopUps(30), load)}
          >
            Reconcile top-ups
          </Button>
          <Button
            size='small'
            variant='outlined'
            onClick={() => runReconcile('Reconcile refunds', () => reconcileFailedRefunds(), load)}
          >
            Reconcile refunds
          </Button>
          <Button
            size='small'
            variant='outlined'
            onClick={() =>
              runReconcile('Reconcile releasing', () => reconcileStuckReleasingHolds(60), load)
            }
          >
            Reconcile releasing
          </Button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            size='small'
            label='Search PI, user ID, or session ID'
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Button
            size='small'
            variant='contained'
            onClick={() => {
              setTab(TAB.TRANSACTIONS)
              setPage(1)
            }}
          >
            Search
          </Button>
          {tab === TAB.REFUNDS ? (
            <TextField
              select
              size='small'
              label='Refund status'
              value={refundStatus}
              onChange={e => setRefundStatus(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='processing'>Processing</MenuItem>
              <MenuItem value='completed'>Completed</MenuItem>
              <MenuItem value='failed'>Failed</MenuItem>
            </TextField>
          ) : null}
          {tab === TAB.ESCROW ? (
            <TextField
              select
              size='small'
              label='Escrow status'
              value={escrowStatus}
              onChange={e => setEscrowStatus(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='held'>Held</MenuItem>
              <MenuItem value='released'>Released</MenuItem>
              <MenuItem value='refunded'>Refunded</MenuItem>
              <MenuItem value='releasing'>Releasing</MenuItem>
              <MenuItem value='disputed'>Disputed</MenuItem>
            </TextField>
          ) : null}
          {tab === TAB.LEDGER ? (
            <TextField
              select
              size='small'
              label='Reference type'
              value={ledgerReferenceType}
              onChange={e => setLedgerReferenceType(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='topup'>topup</MenuItem>
              <MenuItem value='booking_escrow'>booking_escrow</MenuItem>
              <MenuItem value='escrow_release'>escrow_release</MenuItem>
              <MenuItem value='escrow_refund'>escrow_refund</MenuItem>
              <MenuItem value='payout'>payout</MenuItem>
              <MenuItem value='migration_opening'>migration_opening</MenuItem>
            </TextField>
          ) : null}
        </Stack>

        {opsDashboard ? (
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
            <Chip
              label={`Releasing: ${opsDashboard.releasingCount ?? 0}`}
              color={opsDashboard.releasingCount > 0 ? 'warning' : 'default'}
              size='small'
              variant='outlined'
            />
            <Chip
              label={`Disputed: ${opsDashboard.disputedCount ?? 0}`}
              color={opsDashboard.disputedCount > 0 ? 'error' : 'default'}
              size='small'
              variant='outlined'
            />
            <Chip
              label={`Transfer failures (7d): ${opsDashboard.transferFailuresLast7d ?? 0}`}
              size='small'
              variant='outlined'
            />
            <Chip
              label={`Stuck top-ups: ${opsDashboard.stuckTopUpsPending30m ?? 0}`}
              size='small'
              variant='outlined'
            />
            <Chip
              label={`Paid-unapplied extensions: ${opsDashboard.paidUnappliedExtensions ?? 0}`}
              size='small'
              variant='outlined'
            />
          </Stack>
        ) : null}

        {tab === TAB.ESCROW && escrowSummary ? (
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
            <Chip
              label={`Held: ${heldSummary?.count ?? 0} · $${formatMinor(heldSummary?.totalMinor)}`}
              color='warning'
              variant='outlined'
            />
            <Chip label={`<24h: ${aging?.under24h ?? 0}`} size='small' />
            <Chip label={`1–7d: ${aging?.d1to7 ?? 0}`} size='small' />
            <Chip label={`7–30d: ${aging?.d7to30 ?? 0}`} size='small' />
            <Chip label={`30d+: ${aging?.over30 ?? 0}`} size='small' color='error' variant='outlined' />
            {Object.entries(escrowSummary.byStatus || {}).map(([status, row]) => (
              <Chip
                key={status}
                size='small'
                variant='outlined'
                label={`${status}: ${row.count} ($${formatMinor(row.totalMinor)})`}
              />
            ))}
          </Stack>
        ) : null}

        <AdminTabs
          value={tab}
          onChange={setTab}
          tabs={tabLabels.map((label, index) => ({ value: index, label }))}
        />
        <Stack direction='row' spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <Button size='small' disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button
            size='small'
            disabled={page * pageSize >= total || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
          <Typography variant='body2' color='text.secondary'>
            Page {page}
            {total ? ` · ${total} total` : ''}
          </Typography>
        </Stack>
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight={false}
            rows={rows.map((r, i) => ({ id: r._id ?? r.entry_id ?? r.id ?? i, ...r }))}
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
              try {
                await adjustWallet({
                  walletAccountId: adjustForm.walletAccountId,
                  amount_minor: Number(adjustForm.amount_minor),
                  direction: adjustForm.direction,
                  reason: adjustForm.reason
                })
                toast.success('Wallet adjusted')
                setAdjustOpen(false)
                load()
              } catch (e) {
                toast.error(e?.message || 'Adjustment failed')
              }
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
              try {
                await refundWalletSession(walletRefundForm)
                toast.success('Wallet refund submitted')
                setWalletRefundOpen(false)
                load()
              } catch (e) {
                toast.error(e?.message || 'Refund failed')
              }
            }}
          >
            Refund
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={migrateOpen} onClose={() => setMigrateOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Migrate legacy trainer balances</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Maps legacy <code>user.wallet_amount</code> to ledger opening balances. Run dry-run first.
          </Typography>
          <TextField
            select
            fullWidth
            size='small'
            label='Mode'
            value={migrateDryRun ? 'dry' : 'live'}
            onChange={e => setMigrateDryRun(e.target.value === 'dry')}
          >
            <MenuItem value='dry'>Dry run (preview only)</MenuItem>
            <MenuItem value='live'>Apply migration</MenuItem>
          </TextField>
          {migrateResult ? (
            <Typography variant='body2' sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(migrateResult, null, 2)}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMigrateOpen(false)}>Close</Button>
          <Button
            variant='contained'
            disabled={migrateBusy}
            onClick={async () => {
              setMigrateBusy(true)
              try {
                const result = await migrateLegacyBalances(migrateDryRun)
                setMigrateResult(result)
                toast.success(migrateDryRun ? 'Dry run complete' : 'Migration applied')
                if (!migrateDryRun) load()
              } catch (e) {
                toast.error(e?.message || 'Migration failed')
              } finally {
                setMigrateBusy(false)
              }
            }}
          >
            {migrateDryRun ? 'Run dry-run' : 'Apply migration'}
          </Button>
        </DialogActions>
      </Dialog>
      {ConfirmDialog}
    </AdminPageShell>
  )
}

export default FinancePage
