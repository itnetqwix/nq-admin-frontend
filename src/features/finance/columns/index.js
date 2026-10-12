import { TAB } from '../constants'
import { buildEscrowColumns } from './escrow'
import { buildLedgerColumns } from './ledger'
import { buildTransactionColumns } from './transaction'
import { buildRefundColumns } from './refund'
import { buildPayoutColumns } from './payout'
import { buildTopUpColumns } from './topUp'
import { buildAuditColumns } from './audit'

/** Columns for the active finance tab. Each tab's table lives in its own file beside this one. */
export function buildFinanceColumns({ allowRefund, allowPayout, confirm, load, tab }) {
  if (tab === TAB.LEDGER) return buildLedgerColumns()
  if (tab === TAB.TRANSACTIONS) return buildTransactionColumns()
  if (tab === TAB.ESCROW) return buildEscrowColumns({ allowRefund, confirm, load })
  if (tab === TAB.REFUNDS) return buildRefundColumns({ allowRefund, confirm, load })
  if (tab === TAB.PAYOUTS) return buildPayoutColumns({ allowPayout, confirm, load })
  if (tab === TAB.STUCK_TOPUPS || tab === TAB.TOPUPS) return buildTopUpColumns()
  return buildAuditColumns()
}
