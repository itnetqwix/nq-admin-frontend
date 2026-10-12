import { TAB, TAB_SLUG } from './constants'

export const PAGE_SIZE = 50

const SLUG_TO_TAB = Object.fromEntries(Object.entries(TAB_SLUG).map(([tab, slug]) => [slug, Number(tab)]))

const isObjectId = v => typeof v === 'string' && v.length === 24
const nonEmpty = v => (typeof v === 'string' && v.trim() ? v.trim() : '')

/**
 * What a finance URL asks for. Returns only the parts the URL sets, so the page leaves the rest alone:
 * ?userId and ?sessionId pre-fill the search and open Transactions (or Escrow / Ledger with ?tab);
 * ?tab picks a tab; ?status filters escrow.
 */
export function stateFromQuery(query = {}) {
  const out = {}
  const userId = nonEmpty(query.userId)
  if (userId) {
    out.searchQ = userId
    out.tab = TAB.TRANSACTIONS
  }
  const sessionId = nonEmpty(query.sessionId)
  const tabKey = String(query.tab || '').toLowerCase()
  if (sessionId) {
    out.searchQ = sessionId
    out.tab = tabKey === 'escrow' ? TAB.ESCROW : tabKey === 'ledger' ? TAB.LEDGER : TAB.TRANSACTIONS
  }
  if (Object.prototype.hasOwnProperty.call(SLUG_TO_TAB, tabKey)) out.tab = SLUG_TO_TAB[tabKey]
  const status = nonEmpty(query.status)
  if (status) out.escrowStatus = status
  return out
}

/**
 * The API call each tab makes and its arguments. `filters` are the page's search box and dropdowns.
 * A 24-character search is read as an id (user or booking); `pi_…` is a Stripe payment intent.
 */
export function buildTabRequest(tab, { page, pageSize = PAGE_SIZE, searchQ = '', refundStatus = '', escrowStatus = '', ledgerReferenceType = '' }) {
  switch (tab) {
    case TAB.LEDGER:
      return { call: 'ledger', args: { page, limit: pageSize, userId: searchQ || undefined, referenceType: ledgerReferenceType || undefined, sessionId: isObjectId(searchQ) ? searchQ : undefined } }
    case TAB.TRANSACTIONS: {
      const query = searchQ.trim()
      const isPi = query.startsWith('pi_')
      const id = !isPi && query && query.length === 24 ? query : undefined
      return { call: 'transactions', args: { page, limit: pageSize, q: query || undefined, paymentIntentId: isPi ? query : undefined, userId: id, sessionId: id } }
    }
    case TAB.ESCROW:
      return { call: 'escrow', args: { page, limit: pageSize, status: escrowStatus || undefined, sessionId: isObjectId(searchQ) ? searchQ : undefined } }
    case TAB.REFUNDS:
      return { call: 'refunds', args: { page, limit: pageSize, status: refundStatus || undefined, q: searchQ || undefined } }
    case TAB.PAYOUTS:
      return { call: 'payouts', args: { page, limit: pageSize } }
    case TAB.STUCK_TOPUPS:
      return { call: 'stuckTopUps', args: { maxAgeMinutes: 30 } }
    case TAB.TOPUPS:
      return { call: 'topUps', args: { page, limit: pageSize, userId: searchQ || undefined } }
    case TAB.AUDIT:
      return { call: 'audit', args: { page, limit: pageSize } }
    default:
      return { call: 'overview', args: {} }
  }
}

/** CSV export for the visible tab: its kind and the filters that are in effect. Or why there is nothing to export. */
export function buildExportRequest(tab, { searchQ = '', refundStatus = '', escrowStatus = '', ledgerReferenceType = '' }) {
  if (tab === TAB.OVERVIEW) return { error: 'Switch to a data tab to export' }
  const kind = TAB_SLUG[tab]
  if (!kind || kind === 'overview') return { error: 'Nothing to export on this tab' }
  return {
    kind,
    params: {
      q: searchQ || undefined,
      userId: searchQ || undefined,
      sessionId: isObjectId(searchQ) ? searchQ : undefined,
      status: tab === TAB.ESCROW ? escrowStatus || undefined : tab === TAB.REFUNDS ? refundStatus || undefined : undefined,
      referenceType: tab === TAB.LEDGER ? ledgerReferenceType || undefined : undefined,
      maxAgeMinutes: tab === TAB.STUCK_TOPUPS ? 30 : undefined
    }
  }
}
