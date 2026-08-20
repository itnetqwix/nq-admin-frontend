import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import Link from 'next/link'
import Chip from '@mui/material/Chip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Stack from '@mui/material/Stack'
import toast from 'react-hot-toast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import {
  getFinanceLedger,
  getEscrowHolds,
  getEscrowSummary,
  getPayoutQueue,
  getFinancialAuditLog,
  getRefundQueue,
  searchFinanceTransactions,
  getStuckTopUps,
  reconcileStuckTopUps,
  reconcileFailedRefunds,
  reconcileStuckReleasingHolds,
  backfillLegacyEscrowHolds,
  getTopUpHistory,
  getFinanceOpsDashboard,
  exportFinanceCsv
} from 'src/services/financeApi'
import { TAB, TAB_SLUG, runReconcile } from './constants'
import { buildFinanceColumns } from './columns'
import FinancePanel from './FinancePanel'
import FinanceDialogs from './FinanceDialogs'

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
    reason: ''
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
        const r = await getRefundQueue({
          page,
          limit: pageSize,
          status: refundStatus || undefined,
          q: searchQ || undefined
        })
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

  const cols = useMemo(
    () => buildFinanceColumns({ allowRefund, allowPayout, confirm, load, tab }),
    [allowRefund, allowPayout, confirm, load, tab]
  )

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
      (opsDashboard.chargebackCount ?? 0) > 0 ||
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
      <FinancePanel
        stuckStripVisible={stuckStripVisible}
        moneyAtRisk={moneyAtRisk}
        opsDashboard={opsDashboard}
        heldSummary={heldSummary}
        aging={aging}
        escrowSummary={escrowSummary}
        tab={tab}
        syncTab={syncTab}
        handleGoTab={handleGoTab}
        handleOverviewReconcile={handleOverviewReconcile}
        page={page}
        loading={loading}
        pageSize={pageSize}
        total={total}
        setPage={setPage}
        searchQ={searchQ}
        setSearchQ={setSearchQ}
        refundStatus={refundStatus}
        setRefundStatus={setRefundStatus}
        escrowStatus={escrowStatus}
        setEscrowStatus={setEscrowStatus}
        ledgerReferenceType={ledgerReferenceType}
        setLedgerReferenceType={setLedgerReferenceType}
        rows={rows}
        cols={cols}
        onSearch={() => {
          setPage(1)
          void load()
        }}
      />
      <FinanceDialogs
        adjustOpen={adjustOpen}
        setAdjustOpen={setAdjustOpen}
        adjustForm={adjustForm}
        setAdjustForm={setAdjustForm}
        load={load}
        walletRefundOpen={walletRefundOpen}
        setWalletRefundOpen={setWalletRefundOpen}
        walletRefundForm={walletRefundForm}
        setWalletRefundForm={setWalletRefundForm}
        migrateOpen={migrateOpen}
        setMigrateOpen={setMigrateOpen}
        migrateDryRun={migrateDryRun}
        setMigrateDryRun={setMigrateDryRun}
        migrateBusy={migrateBusy}
        setMigrateBusy={setMigrateBusy}
        migrateResult={migrateResult}
        setMigrateResult={setMigrateResult}
        ConfirmDialog={ConfirmDialog}
      />
    </AdminPageShell>
  )
}

export default FinancePage
