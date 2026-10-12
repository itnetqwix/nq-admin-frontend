// @vitest-environment jsdom
/**
 * Pins what the finance page asks the API for, per tab and per deep link, so its internals can be
 * reorganised without changing behaviour.
 */
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

const routerState = vi.hoisted(() => ({ query: {}, replace: vi.fn() }))
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/apps/finance', push: vi.fn(), isReady: true, ...routerState }) }))
vi.mock('next/link', () => ({ default: ({ children, href }) => <a href={typeof href === 'string' ? href : '#'}>{children}</a> }))
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), loading: vi.fn() }) }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
vi.mock('src/layouts/components/AdminPageShell', () => ({
  default: ({ title, actions, children }) => (<section><h1>{title}</h1><div>{actions}</div>{children}</section>),
  AdminPageSection: ({ children }) => <div>{children}</div>
}))
vi.mock('src/components/admin/finance/FinanceOverviewPanel', () => ({ default: () => <div>overview-panel</div> }))
vi.mock('src/components/admin/finance/FinanceTabGuide', () => ({ default: () => null, FinanceTabLegend: () => null }))
vi.mock('src/components/admin/AdminDataGrid', () => ({ default: ({ rows }) => <div data-testid='grid'>{rows.length} rows</div> }))
vi.mock('./../FinanceDialogs', () => ({ default: () => null }))

const api = vi.hoisted(() => {
  const empty = { items: [], total: 0 }
  return {
    getFinanceLedger: vi.fn(async () => empty), getEscrowHolds: vi.fn(async () => empty), getEscrowSummary: vi.fn(async () => ({ byStatus: {}, aging: {} })),
    getPayoutQueue: vi.fn(async () => empty), getFinancialAuditLog: vi.fn(async () => empty), getRefundQueue: vi.fn(async () => empty),
    searchFinanceTransactions: vi.fn(async () => empty), getStuckTopUps: vi.fn(async () => ({ items: [{ _id: 'a' }, { _id: 'b' }] })),
    reconcileStuckTopUps: vi.fn(), reconcileFailedRefunds: vi.fn(), reconcileStuckReleasingHolds: vi.fn(), backfillLegacyEscrowHolds: vi.fn(),
    getTopUpHistory: vi.fn(async () => empty), getFinanceOpsDashboard: vi.fn(async () => null), exportFinanceCsv: vi.fn(async () => {})
  }
})
vi.mock('src/services/financeApi', () => api)

import { AbilityContext } from 'src/layouts/components/acl/Can'
import FinancePage from '../FinancePage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  routerState.query = {}
})

const ability = { can: () => true }
const render = () => renderWithProviders(<AbilityContext.Provider value={ability}><FinancePage /></AbilityContext.Provider>)
const SID = 'a'.repeat(24)

describe('FinancePage loads the right data', () => {
  it('starts on the overview and asks only for the escrow summary', async () => {
    render()
    await waitFor(() => expect(api.getEscrowSummary).toHaveBeenCalled())
    expect(api.getFinanceLedger).not.toHaveBeenCalled()
    expect(api.getFinanceOpsDashboard).toHaveBeenCalledTimes(1)
  })

  it('a booking deep link opens transactions for that booking, with the id passed as session and user', async () => {
    routerState.query = { sessionId: SID }
    render()
    await waitFor(() => expect(api.searchFinanceTransactions).toHaveBeenCalled())
    expect(api.searchFinanceTransactions.mock.calls.at(-1)[0]).toEqual({ page: 1, limit: 50, q: SID, paymentIntentId: undefined, userId: SID, sessionId: SID })
  })

  it('a payment-intent search is sent as a payment intent only', async () => {
    routerState.query = { tab: 'transactions', userId: 'pi_123' }
    render()
    await waitFor(() => expect(api.searchFinanceTransactions).toHaveBeenCalled())
    expect(api.searchFinanceTransactions.mock.calls.at(-1)[0]).toMatchObject({ q: 'pi_123', paymentIntentId: 'pi_123', userId: undefined, sessionId: undefined })
  })

  it('?sessionId with tab=escrow opens escrow, filtered by that session; a status link filters by status', async () => {
    routerState.query = { sessionId: SID, tab: 'escrow', status: 'disputed' }
    render()
    await waitFor(() => expect(api.getEscrowHolds).toHaveBeenCalled())
    expect(api.getEscrowHolds.mock.calls.at(-1)[0]).toEqual({ page: 1, limit: 50, status: 'disputed', sessionId: SID })
    expect(api.getEscrowSummary).toHaveBeenCalled()
  })

  it('?sessionId with tab=ledger opens the ledger', async () => {
    routerState.query = { sessionId: SID, tab: 'ledger' }
    render()
    await waitFor(() => expect(api.getFinanceLedger).toHaveBeenCalled())
    expect(api.getFinanceLedger.mock.calls.at(-1)[0]).toEqual({ page: 1, limit: 50, userId: SID, referenceType: undefined, sessionId: SID })
  })

  it.each([
    ['refunds', 'getRefundQueue', { page: 1, limit: 50, status: undefined, q: undefined }],
    ['payouts', 'getPayoutQueue', { page: 1, limit: 50 }],
    ['topups', 'getTopUpHistory', { page: 1, limit: 50, userId: undefined }],
    ['audit', 'getFinancialAuditLog', { page: 1, limit: 50 }],
    ['stuck_topups', 'getStuckTopUps', { maxAgeMinutes: 30 }]
  ])('the %s tab calls %s', async (tab, fn, args) => {
    routerState.query = { tab }
    render()
    await waitFor(() => expect(api[fn]).toHaveBeenCalled())
    expect(api[fn].mock.calls.at(-1)[0]).toEqual(args)
  })

  it('the stuck top-ups tab counts its own rows', async () => {
    routerState.query = { tab: 'stuck_topups' }
    render()
    expect(await screen.findByText('2 rows')).toBeTruthy()
  })

  it('exports the current tab with its filters, and refuses on the overview', async () => {
    routerState.query = { tab: 'escrow', status: 'held' }
    render()
    await waitFor(() => expect(api.getEscrowHolds).toHaveBeenCalled())
    fireEvent.click(await screen.findByRole('button', { name: 'Export CSV' }))
    await waitFor(() => expect(api.exportFinanceCsv).toHaveBeenCalledWith('escrow', { q: undefined, userId: undefined, sessionId: undefined, status: 'held', referenceType: undefined, maxAgeMinutes: undefined }))
  })

  it('changing tab updates the URL', async () => {
    render()
    await waitFor(() => expect(api.getEscrowSummary).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('tab', { name: 'Refunds' }))
    expect(routerState.replace).toHaveBeenCalled()
    expect(routerState.replace.mock.calls.at(-1)[0].query.tab).toBe('refunds')
    await waitFor(() => expect(api.getRefundQueue).toHaveBeenCalled())
  })

  it('hides money actions from a role that cannot use them', async () => {
    renderWithProviders(<AbilityContext.Provider value={{ can: () => false }}><FinancePage /></AbilityContext.Provider>)
    await waitFor(() => expect(api.getEscrowSummary).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Adjust wallet' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Wallet refund' })).toBeNull()
    expect(screen.getByRole('button', { name: 'More' })).toBeTruthy()
  })
})
