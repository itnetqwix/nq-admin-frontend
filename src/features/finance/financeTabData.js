import {
  getEscrowHolds,
  getEscrowSummary,
  getFinancialAuditLog,
  getFinanceLedger,
  getPayoutQueue,
  getRefundQueue,
  getStuckTopUps,
  getTopUpHistory,
  searchFinanceTransactions
} from 'src/services/financeApi'
import { buildTabRequest } from './financeTabs'

const page = r => ({ rows: r?.items ?? [], total: r?.total ?? 0 })

/** Load one tab. `escrowSummary` is returned by the two tabs that show it. */
export async function fetchTabData(tab, filters) {
  const { call, args } = buildTabRequest(tab, filters)
  switch (call) {
    case 'overview':
      return { rows: [], total: 0, escrowSummary: await getEscrowSummary() }
    case 'ledger':
      return page(await getFinanceLedger(args))
    case 'transactions':
      return page(await searchFinanceTransactions(args))
    case 'escrow': {
      const [r, escrowSummary] = await Promise.all([getEscrowHolds(args), getEscrowSummary()])
      return { ...page(r), escrowSummary }
    }
    case 'refunds':
      return page(await getRefundQueue(args))
    case 'payouts':
      return page(await getPayoutQueue(args))
    case 'stuckTopUps': {
      const r = await getStuckTopUps(args)
      return { rows: r?.items ?? [], total: r?.items?.length ?? 0 }
    }
    case 'topUps':
      return page(await getTopUpHistory(args))
    default:
      return page(await getFinancialAuditLog(args))
  }
}
