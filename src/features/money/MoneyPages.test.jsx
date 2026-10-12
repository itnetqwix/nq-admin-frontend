// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EntityDrawerContext } from 'src/features/entity-drawers/EntityDrawerContext'
import { renderWithProviders } from 'src/test/renderWithProviders'

const routerState = { query: {}, replace: vi.fn() }
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/apps/money', push: vi.fn(), isReady: true, ...routerState }) }))
// eslint-disable-next-line no-unused-vars
vi.mock('next/link', () => ({ default: ({ href, children, shallow, scroll, prefetch, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
vi.mock('src/@core/components/react-apexcharts', () => ({ default: ({ type }) => <div data-testid={`chart-${type}`} /> }))
vi.mock('src/@core/styles/libs/react-apexcharts', () => ({ default: ({ children }) => <div>{children}</div> }))
vi.mock('src/layouts/components/AdminPageShell', () => ({
  default: ({ title, actions, children }) => (
    <section>
      <h1>{title}</h1>
      <div>{actions}</div>
      {children}
    </section>
  )
}))
vi.mock('src/services/moneyApi', () => ({
  getFinanceOverview: vi.fn(),
  getConnectGaps: vi.fn(),
  listDisputes: vi.fn(),
  getDispute: vi.fn(),
  addDisputeNote: vi.fn(),
  backfillDisputes: vi.fn()
}))
vi.mock('src/services/commandApi', () => ({ searchAdmin: vi.fn() }))

import toast from 'react-hot-toast'
import { addDisputeNote, backfillDisputes, getConnectGaps, getDispute, getFinanceOverview, listDisputes } from 'src/services/moneyApi'
import DisputeDrawer from 'src/features/entity-drawers/drawers/DisputeDrawer'
import DisputesPage from './DisputesPage'
import MoneyOverviewPage from './MoneyOverviewPage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  routerState.query = {}
})

const drawerOpen = vi.fn()
const wrap = ui => <EntityDrawerContext.Provider value={{ current: null, open: drawerOpen, close: vi.fn(), hrefFor: () => '#' }}>{ui}</EntityDrawerContext.Provider>

const overview = () => ({
  gmvMinor: 2200000, bookings: 140, completed: 120, takeRate: 0.15, bookingRevenueMinor: 500000,
  revenue: { totalMinor: 515000, rows: [{ key: 'commission', label: 'Coach commission', minor: 300000, share: 0.5825 }, { key: 'traineeFee', label: 'Trainee platform fee', minor: 100000, share: 0.1942 }, { key: 'trainerFee', label: 'Coach platform fee', minor: 100000, share: 0.1942 }, { key: 'tips', label: 'Commission on tips', minor: 15000, share: 0.0291 }] },
  tips: { totalMinor: 100000 },
  refunds: { count: 4, amountMinor: 50000, rate: 0.03 },
  escrow: { heldMinor: 800000, releasingMinor: 20000, disputedMinor: 30000 },
  payouts: { pendingMinor: 90000, pendingCount: 3, transferFailures7d: 0 },
  walletLiability: { traineeWalletMinor: 4000000, coachAvailableMinor: 2700000, coachPendingMinor: 600000, inEscrowMinor: 1100000, totalMinor: 7300000 },
  disputes: { open: 2, openMinor: 30000, needsEvidence: 1, won: 3, lost: 1, lostMinor: 5000, winRate: 0.75 },
  daily: [{ date: '2026-10-09', bookings: 5, gmvMinor: 100000, revenueMinor: 20000 }, { date: '2026-10-10', bookings: 8, gmvMinor: 180000, revenueMinor: 31000 }],
  topCoaches: [{ id: 'c1', name: 'Coach Ava', earnedMinor: 1700000, lessons: 22 }, { id: 'c2', name: 'Coach Ben', earnedMinor: 300000, lessons: 4 }],
  moneyAtRisk: { totalMinor: 1 }
})

describe('MoneyOverviewPage', () => {
  it('shows the money position, where revenue comes from and who is owed what', async () => {
    getFinanceOverview.mockResolvedValue(overview())
    getConnectGaps.mockResolvedValue({ approvedCoaches: 12, withPayoutAccount: 12, withoutPayoutAccount: 0, kycComplete: 12, owedWithoutAccount: { coaches: 0, owedMinor: 0, top: [] } })
    renderWithProviders(wrap(<MoneyOverviewPage />))

    expect(await screen.findByText('$22K')).toBeTruthy() // GMV tile
    expect(screen.getByText('Open disputes')).toBeTruthy()
    expect(screen.getByText('Where revenue comes from')).toBeTruthy()
    expect(screen.getByText('Coach commission')).toBeTruthy()
    expect(screen.getByText('$3,000.00 · 58%')).toBeTruthy()
    expect(screen.getByText('Owed to people')).toBeTruthy()
    expect(screen.getByText('Trainee wallet balances')).toBeTruthy()
    expect(screen.getByText('Coach Ava')).toBeTruthy()
    expect(screen.getByText(/22 lessons/)).toBeTruthy()
  })

  it('links tiles to the exact finance tab and filter', async () => {
    getFinanceOverview.mockResolvedValue(overview())
    getConnectGaps.mockResolvedValue({ approvedCoaches: 1, withPayoutAccount: 1, withoutPayoutAccount: 0, kycComplete: 1, owedWithoutAccount: { coaches: 0, owedMinor: 0, top: [] } })
    renderWithProviders(wrap(<MoneyOverviewPage />))
    await screen.findByText('$22K')
    const hrefs = screen.getAllByRole('link').map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/apps/finance?tab=escrow&status=held')
    expect(hrefs).toContain('/apps/finance?tab=payouts')
    expect(hrefs).toContain('/apps/finance/disputes')
    expect(hrefs.some(h => /escrowStatus/.test(h || ''))).toBe(false)
  })

  it('warns about coaches who are owed money but cannot be paid', async () => {
    getFinanceOverview.mockResolvedValue(overview())
    getConnectGaps.mockResolvedValue({ approvedCoaches: 12, withPayoutAccount: 10, withoutPayoutAccount: 2, kycComplete: 9, owedWithoutAccount: { coaches: 1, owedMinor: 8000, top: [{ userId: 'u9', name: 'Coach Ben', owedMinor: 8000 }] } })
    renderWithProviders(wrap(<MoneyOverviewPage />))
    expect(await screen.findByText(/can’t withdraw until they connect/)).toBeTruthy()
    expect(screen.getAllByText('$80.00').length).toBeGreaterThan(0)
  })

  it('reports a failure readably, with the request id', async () => {
    getFinanceOverview.mockRejectedValue(Object.assign(new Error('Could not load the money overview'), { requestId: 'req-3' }))
    getConnectGaps.mockResolvedValue(null)
    renderWithProviders(wrap(<MoneyOverviewPage />))
    expect(await screen.findByText('Couldn’t load the money overview')).toBeTruthy()
    expect(screen.getByText(/request req-3/)).toBeTruthy()
  })
})

const dispute = (over = {}) => ({
  _id: 'd1', stripe_dispute_id: 'dp_1', amount_minor: 5000, currency: 'usd', reason: 'fraudulent', state: 'open', status: 'needs_response',
  evidence_submitted: false, evidenceDaysLeft: 1, opened_at: new Date(Date.now() - 3_600_000).toISOString(),
  trainee_id: { _id: 'u1', fullname: 'Tia Trainee' }, trainer_id: { _id: 'c1', fullname: 'Coach Ava' }, ...over
})
const list = (items, summary) => ({ items, total: items.length, page: 1, pageSize: 25, summary: summary || { open: items.length, openMinor: 5000, needsEvidence: 1, won: 3, lost: 1, lostMinor: 5000, winRate: 0.75 } })

describe('DisputesPage', () => {
  it('shows urgency per dispute and the headline numbers', async () => {
    listDisputes.mockResolvedValue(list([dispute(), dispute({ _id: 'd2', stripe_dispute_id: 'dp_2', evidenceDaysLeft: -3, reason: 'product_not_received' }), dispute({ _id: 'd3', stripe_dispute_id: 'dp_3', evidence_submitted: true })]))
    renderWithProviders(wrap(<DisputesPage />))
    expect(await screen.findByText('Due in 1d')).toBeTruthy()
    expect(screen.getByText('Overdue by 3d')).toBeTruthy()
    expect(screen.getByText('Evidence submitted')).toBeTruthy()
    expect(screen.getAllByText('Fraud').length).toBe(2)
    expect(screen.getByText('Service not received')).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy() // win rate tile
    expect(screen.getByText('3 won · 1 lost')).toBeTruthy()
  })

  it('opens the dispute drawer from a row', async () => {
    listDisputes.mockResolvedValue(list([dispute()]))
    renderWithProviders(wrap(<DisputesPage />))
    const row = (await screen.findByText('dp_1')).closest('tr')
    fireEvent.click(row)
    expect(drawerOpen).toHaveBeenCalledWith('dispute', 'dp_1')
  })

  it('asks the API for the open tab by default and for closed when chosen', async () => {
    listDisputes.mockResolvedValue(list([]))
    renderWithProviders(wrap(<DisputesPage />))
    await waitFor(() => expect(listDisputes).toHaveBeenCalled())
    expect(listDisputes.mock.calls[0][0]).toMatchObject({ state: 'open', page: 1, pageSize: 25 })
    fireEvent.click(screen.getByRole('tab', { name: 'Closed' }))
    expect(routerState.replace.mock.calls[0][0].query.state).toBe('closed')
  })

  it('previews a backfill before importing', async () => {
    listDisputes.mockResolvedValue(list([]))
    backfillDisputes.mockResolvedValueOnce({ dryRun: true, events: 9, disputes: 4, applied: 0, skipped: 0 })
    renderWithProviders(wrap(<DisputesPage />))
    fireEvent.click(await screen.findByRole('button', { name: 'Check for missing' }))
    await waitFor(() => expect(backfillDisputes).toHaveBeenCalledWith(true))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Found 4 disputes in 9 stored events')))
  })

  it('shows an empty state that points at the import', async () => {
    listDisputes.mockResolvedValue(list([], { open: 0, openMinor: 0, needsEvidence: 0, won: 0, lost: 0, lostMinor: 0, winRate: null }))
    renderWithProviders(wrap(<DisputesPage />))
    expect(await screen.findByText('No open disputes')).toBeTruthy()
    // The empty state names the import action, and the toolbar offers it.
    expect(screen.getByText(/use “Import past disputes”/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Import past disputes' })).toBeTruthy()
  })
})

describe('DisputeDrawer', () => {
  const full = (over = {}) => ({
    ...dispute({ session_id: '64b000000000000000000001', payment_intent_id: 'pi_9', evidence_due_by: new Date(Date.now() + 86_400_000).toISOString(), evidence_staged: true }),
    notes: [{ _id: 'n1', text: 'Called the cardholder', at: new Date(Date.now() - 600_000).toISOString(), admin_id: { fullname: 'Admin Amy' } }],
    ...over
  })

  it('warns when no evidence is in, shows the people and existing notes', async () => {
    getDispute.mockResolvedValue(full())
    renderWithProviders(wrap(<DisputeDrawer id='dp_1' />))
    expect(await screen.findByText(/No evidence has been submitted/)).toBeTruthy()
    expect(screen.getByText(/auto-collected/)).toBeTruthy()
    expect(screen.getByText('Tia Trainee')).toBeTruthy()
    expect(screen.getByText('Open lesson')).toBeTruthy()
    expect(screen.getByText('Called the cardholder')).toBeTruthy()
    expect(screen.getByText(/Admin Amy/)).toBeTruthy()
  })

  it('does not nag about evidence once it is submitted or the dispute is closed', async () => {
    getDispute.mockResolvedValue(full({ evidence_submitted: true }))
    const { unmount } = renderWithProviders(wrap(<DisputeDrawer id='dp_1' />))
    await screen.findByText('Team notes')
    expect(screen.queryByText(/No evidence has been submitted/)).toBeNull()
    unmount()
    getDispute.mockResolvedValue(full({ state: 'closed', outcome: 'won', evidenceDaysLeft: null }))
    renderWithProviders(wrap(<DisputeDrawer id='dp_1' />))
    expect(await screen.findByText('Won')).toBeTruthy()
    expect(screen.queryByText(/No evidence has been submitted/)).toBeNull()
  })

  it('adds a note, clears the box, and only enables the button for real text', async () => {
    getDispute.mockResolvedValue(full())
    addDisputeNote.mockResolvedValue({ notes: 2 })
    renderWithProviders(wrap(<DisputeDrawer id='dp_1' />))
    const box = await screen.findByLabelText('Add a note')
    const button = screen.getByRole('button', { name: 'Add note' })
    expect(button.disabled).toBe(true)
    fireEvent.change(box, { target: { value: ' x ' } })
    expect(button.disabled).toBe(true)
    fireEvent.change(box, { target: { value: 'Evidence packet sent' } })
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    await waitFor(() => expect(addDisputeNote).toHaveBeenCalledWith('dp_1', 'Evidence packet sent'))
    await waitFor(() => expect(box.value).toBe(''))
    expect(toast.success).toHaveBeenCalledWith('Note added')
  })

  it('shows the server error when a note is rejected', async () => {
    getDispute.mockResolvedValue(full())
    addDisputeNote.mockRejectedValue(new Error('This action is disabled for your admin account'))
    renderWithProviders(wrap(<DisputeDrawer id='dp_1' />))
    fireEvent.change(await screen.findByLabelText('Add a note'), { target: { value: 'Some note here' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This action is disabled for your admin account'))
  })

  it('shows a readable error for a dispute that does not exist', async () => {
    getDispute.mockRejectedValue(Object.assign(new Error('Dispute not found'), { status: 404, requestId: 'req-5' }))
    renderWithProviders(wrap(<DisputeDrawer id='dp_nope' />))
    expect(await screen.findByText('Couldn’t load this')).toBeTruthy()
    expect(within(screen.getByText(/Dispute not found/).parentElement).getByText(/request req-5/)).toBeTruthy()
  })
})
