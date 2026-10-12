import { useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import {
  reconcileStuckTopUps,
  reconcileFailedRefunds,
  reconcileStuckReleasingHolds,
  backfillLegacyEscrowHolds,
  exportFinanceCsv
} from 'src/services/financeApi'
import { TAB, TAB_SLUG, runReconcile } from './constants'
import { buildFinanceColumns } from './columns'
import { buildExportRequest, stateFromQuery } from './financeTabs'
import useFinanceData from './useFinanceData'
import FinanceHeaderActions from './FinanceHeaderActions'
import FinancePanel from './FinancePanel'
import FinanceDialogs from './FinanceDialogs'

/**
 * Finance control room: owns the tab, the filters and the dialogs. What each tab asks the API for
 * lives in financeTabs.js / financeTabData.js, how it loads in useFinanceData, and each table's
 * columns in columns/.
 */
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
    reason: ''
  })

  useEffect(() => {
    const fromUrl = stateFromQuery(router.query)
    if (fromUrl.searchQ !== undefined) setSearchQ(fromUrl.searchQ)
    if (fromUrl.tab !== undefined) setTab(fromUrl.tab)
    if (fromUrl.escrowStatus !== undefined) setEscrowStatus(fromUrl.escrowStatus)
  }, [router.query?.userId, router.query?.sessionId, router.query?.tab, router.query?.status])

  const { rows, total, loading, load, escrowSummary, opsDashboard, pageSize } = useFinanceData({
    tab,
    page,
    searchQ,
    refundStatus,
    escrowStatus,
    ledgerReferenceType,
    setPage
  })

  const cols = useMemo(
    () => buildFinanceColumns({ allowRefund, allowPayout, confirm, load, tab }),
    [allowRefund, allowPayout, confirm, load, tab]
  )

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
    const req = buildExportRequest(tab, { searchQ, refundStatus, escrowStatus, ledgerReferenceType })
    if (req.error) {
      toast.error(req.error)
      return
    }
    try {
      toast.loading('Exporting…', { id: 'finance-csv' })
      await exportFinanceCsv(req.kind, req.params)
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
        <FinanceHeaderActions
          showExport={tab !== TAB.OVERVIEW}
          onExport={() => void exportCurrentTab()}
          allowAdjust={allowAdjust}
          onAdjust={() => setAdjustOpen(true)}
          allowRefund={allowRefund}
          onWalletRefund={() => setWalletRefundOpen(true)}
          allowReconcile={allowReconcile}
          onMigrate={() => {
            setMigrateOpen(true)
            setMigrateResult(null)
          }}
          onReconcile={handleOverviewReconcile}
          onRefresh={() => void load()}
          loading={loading}
        />
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
