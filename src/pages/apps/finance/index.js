import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import Link from 'next/link'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import toast from 'react-hot-toast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import FinanceOverviewPanel from 'src/components/admin/finance/FinanceOverviewPanel'
import FinanceTabGuide, { FinanceTabLegend } from 'src/components/admin/finance/FinanceTabGuide'
import { ops } from 'src/styles/opsSurface'
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
  backfillLegacyEscrowHolds,
  disputeEscrowHold,
  resolveDisputeEscrow,
  getTopUpHistory,
  getFinanceOpsDashboard,
  exportFinanceCsv
} from 'src/services/financeApi'

const TAB = {
  OVERVIEW: 0,
  LEDGER: 1,
  TRANSACTIONS: 2,
  ESCROW: 3,
  REFUNDS: 4,
  PAYOUTS: 5,
  STUCK_TOPUPS: 6,
  TOPUPS: 7,
  AUDIT: 8
}

const tabLabels = [
  'Overview',
  'Ledger',
  'Transactions',
  'Escrow',
  'Refunds',
  'Payouts',
  'Stuck top-ups',
  'Top-up history',
  'Audit log'
]

const TAB_SLUG = {
  [TAB.OVERVIEW]: 'overview',
  [TAB.LEDGER]: 'ledger',
  [TAB.TRANSACTIONS]: 'transactions',
  [TAB.ESCROW]: 'escrow',
  [TAB.REFUNDS]: 'refunds',
  [TAB.PAYOUTS]: 'payouts',
  [TAB.STUCK_TOPUPS]: 'stuck_topups',
  [TAB.TOPUPS]: 'topups',
  [TAB.AUDIT]: 'audit'
}

const searchPlaceholder = tab => {
  if (tab === TAB.LEDGER) return 'User ID or session ID'
  if (tab === TAB.ESCROW) return 'Session ID'
  if (tab === TAB.TOPUPS) return 'User ID'
  if (tab === TAB.TRANSACTIONS) return 'PI (pi_…), user ID, or session ID'
  return 'Search…'
}

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
  const canRefund = ability?.can('update', 'admin-action-refund') ?? false
  const canAdjust = ability?.can('update', 'admin-action-wallet-adjust') ?? false
  const canPayout = ability?.can('update', 'admin-action-payout') ?? false
  const canReconcile = ability?.can('update', 'admin-action-reconcile') ?? false
  // SuperAdmin has manage all — treat unrestricted ability as full access
  const fullAccess = ability?.can('manage', 'all') ?? false
  const allowRefund = fullAccess || canRefund
  const allowAdjust = fullAccess || canAdjust
  const allowPayout = fullAccess || canPayout
  const allowReconcile = fullAccess || canReconcile
  const [tab, setTab] = useState(TAB.OVERVIEW)
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
  const [opsMenuAnchor, setOpsMenuAnchor] = useState(null)
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
    const tabKey = String(router.query?.tab || '').toLowerCase()
    if (tabKey === 'overview') setTab(TAB.OVERVIEW)
    else if (tabKey === 'ledger') setTab(TAB.LEDGER)
    else if (tabKey === 'transactions') setTab(TAB.TRANSACTIONS)
    else if (tabKey === 'escrow') setTab(TAB.ESCROW)
    else if (tabKey === 'refunds') setTab(TAB.REFUNDS)
    else if (tabKey === 'payouts') setTab(TAB.PAYOUTS)
    else if (tabKey === 'stuck_topups') setTab(TAB.STUCK_TOPUPS)
    else if (tabKey === 'topups') setTab(TAB.TOPUPS)
    else if (tabKey === 'audit') setTab(TAB.AUDIT)
    const status = router.query?.status
    if (typeof status === 'string' && status.trim()) {
      setEscrowStatus(status.trim())
    }
  }, [router.query?.userId, router.query?.sessionId, router.query?.tab, router.query?.status])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === TAB.OVERVIEW) {
        const summary = await getEscrowSummary()
        setEscrowSummary(summary)
        setTotal(0)
      } else if (tab === TAB.LEDGER) {
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
      } else if (tab === TAB.AUDIT) {
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
    { field: 'createdAt', headerName: 'When', width: 180 }
  ]

  const transactionCols = [
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
      field: 'stripe_transfer_id',
      headerName: 'Stripe transfer',
      flex: 1,
      minWidth: 120,
      valueGetter: p => p.row.stripe_transfer_id || '—'
    },
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
    if (tab === TAB.OVERVIEW) return []
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

  const syncTab = nextTab => {
    setTab(nextTab)
    const slug = TAB_SLUG[nextTab] || 'overview'
    const q = { ...router.query, tab: slug }
    void router.replace({ pathname: '/apps/finance', query: q }, undefined, { shallow: true })
  }

  const handleGoTab = (key, opts = {}) => {
    const map = {
      escrow: TAB.ESCROW,
      stuck_topups: TAB.STUCK_TOPUPS,
      ledger: TAB.LEDGER,
      transactions: TAB.TRANSACTIONS,
      refunds: TAB.REFUNDS,
      payouts: TAB.PAYOUTS,
      topups: TAB.TOPUPS,
      audit: TAB.AUDIT
    }
    if (map[key] != null) syncTab(map[key])
    if (opts.status) setEscrowStatus(opts.status)
  }

  const handleOverviewReconcile = kind => {
    if (!allowReconcile) {
      toast.error('Reconcile is disabled for your role')
      return
    }
    if (kind === 'topups') {
      void runReconcile('Reconcile top-ups', () => reconcileStuckTopUps(30), load)
    } else if (kind === 'refunds') {
      void runReconcile('Reconcile refunds', () => reconcileFailedRefunds(), load)
    } else if (kind === 'releasing') {
      void runReconcile('Reconcile releasing', () => reconcileStuckReleasingHolds(60), load)
    } else if (kind === 'escrow_backfill_dry') {
      void runReconcile('Preview escrow backfill', () => backfillLegacyEscrowHolds({ dryRun: true, limit: 50 }), load)
    } else if (kind === 'escrow_backfill') {
      void runReconcile('Backfill legacy escrow', () => backfillLegacyEscrowHolds({ dryRun: false, limit: 50 }), load)
    }
  }

  const heldSummary = escrowSummary?.byStatus?.held
  const aging = escrowSummary?.aging
  const moneyAtRisk = opsDashboard?.moneyAtRisk
  const stuckStripVisible =
    opsDashboard &&
    ((opsDashboard.heldCount ?? 0) > 0 ||
      (opsDashboard.releasingCount ?? 0) > 0 ||
      (opsDashboard.disputedCount ?? 0) > 0 ||
      (opsDashboard.openRefundCount ?? 0) > 0 ||
      (opsDashboard.pendingPayoutCount ?? 0) > 0 ||
      (opsDashboard.stuckTopUpsPending30m ?? 0) > 0)

  const exportCurrentTab = async () => {
    if (tab === TAB.OVERVIEW) {
      toast.error('Switch to a data tab to export')
      return
    }
    const kind = TAB_SLUG[tab]
    if (!kind || kind === 'overview') {
      toast.error('Nothing to export on this tab')
      return
    }
    try {
      toast.loading('Exporting…', { id: 'finance-csv' })
      await exportFinanceCsv(kind, {
        q: searchQ || undefined,
        userId: searchQ || undefined,
        sessionId: searchQ && searchQ.length === 24 ? searchQ : undefined,
        status: tab === TAB.ESCROW ? escrowStatus || undefined : tab === TAB.REFUNDS ? refundStatus || undefined : undefined,
        referenceType: tab === TAB.LEDGER ? ledgerReferenceType || undefined : undefined,
        maxAgeMinutes: tab === TAB.STUCK_TOPUPS ? 30 : undefined
      })
      toast.success('CSV downloaded', { id: 'finance-csv' })
    } catch (e) {
      toast.error(e?.message || 'Export failed', { id: 'finance-csv' })
    }
  }

  return (
    <AdminPageShell
      bare
      eyebrow='Revenue · finance'
      icon='mdi:wallet-outline'
      title='Finance.'
      subtitle='Escrow, ledger, payouts, refunds — tabs sync to the URL. Money actions respect your RBAC.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
          <Chip component={Link} href='/apps/finance/connect' label='Stripe Connect' clickable variant='outlined' size='small' />
          <Chip component={Link} href='/apps/pricing' label='Pricing' clickable variant='outlined' size='small' />
          {tab !== TAB.OVERVIEW ? (
            <Button size='small' variant='outlined' onClick={() => void exportCurrentTab()} sx={{ textTransform: 'none' }}>
              Export CSV
            </Button>
          ) : null}
          {allowAdjust ? (
            <Button
              size='small'
              variant='contained'
              onClick={() => setAdjustOpen(true)}
              sx={{ textTransform: 'none', bgcolor: ops?.ink || '#171717' }}
            >
              Adjust wallet
            </Button>
          ) : null}
          {allowRefund ? (
            <Button size='small' variant='outlined' onClick={() => setWalletRefundOpen(true)} sx={{ textTransform: 'none' }}>
              Wallet refund
            </Button>
          ) : null}
          <Button
            size='small'
            variant='outlined'
            endIcon={<ExpandMoreIcon />}
            onClick={e => setOpsMenuAnchor(e.currentTarget)}
            sx={{ textTransform: 'none' }}
          >
            More
          </Button>
          <Menu
            anchorEl={opsMenuAnchor}
            open={Boolean(opsMenuAnchor)}
            onClose={() => setOpsMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem component={Link} href='/apps/platform-health' onClick={() => setOpsMenuAnchor(null)}>
              <ListItemText primary='Platform health' secondary='Messaging & service checks' />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setOpsMenuAnchor(null)
                setMigrateOpen(true)
                setMigrateResult(null)
              }}
            >
              <ListItemText primary='Migrate legacy balances' secondary='One-time wallet migration' />
            </MenuItem>
            {allowReconcile ? (
              <>
                <MenuItem
                  onClick={() => {
                    setOpsMenuAnchor(null)
                    void runReconcile('Reconcile top-ups', () => reconcileStuckTopUps(30), load)
                  }}
                >
                  <ListItemText primary='Reconcile top-ups' />
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOpsMenuAnchor(null)
                    void runReconcile('Reconcile refunds', () => reconcileFailedRefunds(), load)
                  }}
                >
                  <ListItemText primary='Reconcile refunds' />
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOpsMenuAnchor(null)
                    void runReconcile('Reconcile releasing', () => reconcileStuckReleasingHolds(60), load)
                  }}
                >
                  <ListItemText primary='Reconcile releasing holds' />
                </MenuItem>
              </>
            ) : null}
          </Menu>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
    >
      <AdminPageSection>
        {stuckStripVisible ? (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: ops.radiusMd,
              border: `1px solid ${ops.hairline}`,
              bgcolor: ops.canvasSoft
            }}
          >
            <Stack direction='row' justifyContent='space-between' alignItems='baseline' flexWrap='wrap' gap={1} sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Stuck money</Typography>
              {moneyAtRisk?.totalMinor != null ? (
                <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>
                  At risk · ${(Number(moneyAtRisk.totalMinor) / 100).toFixed(2)}
                </Typography>
              ) : null}
            </Stack>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Chip
                component={Link}
                href='/apps/finance?tab=escrow'
                clickable
                label={`Held: ${opsDashboard.heldCount ?? 0}${
                  moneyAtRisk?.heldMinor != null ? ` · $${(moneyAtRisk.heldMinor / 100).toFixed(0)}` : ''
                }`}
                color={(opsDashboard.heldCount ?? 0) > 0 ? 'warning' : 'default'}
                size='small'
                variant='outlined'
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=escrow'
                clickable
                label={`Releasing: ${opsDashboard.releasingCount ?? 0}`}
                color={(opsDashboard.releasingCount ?? 0) > 0 ? 'warning' : 'default'}
                size='small'
                variant='outlined'
                onClick={e => {
                  e.preventDefault()
                  handleGoTab('escrow', { status: 'releasing' })
                }}
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=escrow'
                clickable
                label={`Disputed: ${opsDashboard.disputedCount ?? 0}`}
                color={(opsDashboard.disputedCount ?? 0) > 0 ? 'error' : 'default'}
                size='small'
                variant='outlined'
                onClick={e => {
                  e.preventDefault()
                  handleGoTab('escrow', { status: 'disputed' })
                }}
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=refunds'
                clickable
                label={`Open refunds: ${opsDashboard.openRefundCount ?? 0}${
                  moneyAtRisk?.openRefundMinor != null
                    ? ` · $${(moneyAtRisk.openRefundMinor / 100).toFixed(0)}`
                    : ''
                }`}
                color={(opsDashboard.openRefundCount ?? 0) > 0 ? 'error' : 'default'}
                size='small'
                variant='outlined'
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=payouts'
                clickable
                label={`Pending payouts: ${opsDashboard.pendingPayoutCount ?? 0}${
                  moneyAtRisk?.pendingPayoutMinor != null
                    ? ` · $${(moneyAtRisk.pendingPayoutMinor / 100).toFixed(0)}`
                    : ''
                }`}
                color={(opsDashboard.pendingPayoutCount ?? 0) > 0 ? 'warning' : 'default'}
                size='small'
                variant='outlined'
              />
              <Chip
                component={Link}
                href='/apps/finance?tab=stuck_topups'
                clickable
                label={`Stuck top-ups: ${opsDashboard.stuckTopUpsPending30m ?? 0}`}
                size='small'
                variant='outlined'
              />
            </Stack>
          </Box>
        ) : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
          {tab !== TAB.OVERVIEW ? (
            <>
          <TextField
            size='small'
            label={searchPlaceholder(tab)}
            placeholder={searchPlaceholder(tab)}
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
            </>
          ) : null}
        </Stack>

        {tab !== TAB.OVERVIEW && opsDashboard ? (
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
            <Chip
              label={`Transfer failures (7d): ${opsDashboard.transferFailuresLast7d ?? 0}`}
              size='small'
              variant='outlined'
            />
            <Chip
              label={`Extension reconcile alerts (7d): ${opsDashboard.extensionReconcileAlerts7d ?? 0}`}
              color={(opsDashboard.extensionReconcileAlerts7d ?? 0) > 0 ? 'error' : 'default'}
              size='small'
              variant='outlined'
              component='a'
              href='/apps/ops-logs?category=payment&event_type=EXTENSION_RECONCILE_ALERT'
              clickable
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
          onChange={syncTab}
          tabs={tabLabels.map((label, index) => ({ value: index, label }))}
        />
        <FinanceTabGuide tab={tab} />
        {tab === TAB.OVERVIEW ? <FinanceTabLegend /> : null}
        {tab !== TAB.OVERVIEW ? (
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
        ) : null}
        {tab === TAB.OVERVIEW ? (
          <FinanceOverviewPanel
            opsDashboard={opsDashboard}
            escrowSummary={escrowSummary}
            onGoTab={handleGoTab}
            onReconcile={handleOverviewReconcile}
          />
        ) : (
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight={false}
            rows={rows.map((r, i) => ({ id: r._id ?? r.entry_id ?? r.id ?? i, ...r }))}
            columns={cols}
            loading={loading}
          />
        </AdminGridContainer>
        )}
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
