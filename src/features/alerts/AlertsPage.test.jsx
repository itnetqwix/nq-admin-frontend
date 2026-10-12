// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EntityDrawerContext } from 'src/features/entity-drawers/EntityDrawerContext'
import { renderWithProviders } from 'src/test/renderWithProviders'

const routerState = { query: {}, replace: vi.fn() }
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/apps/alerts', push: vi.fn(), ...routerState }) }))
// eslint-disable-next-line no-unused-vars
vi.mock('next/link', () => ({ default: ({ href, children, shallow, scroll, prefetch, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
vi.mock('src/layouts/components/AdminPageShell', () => ({
  default: ({ title, actions, children }) => (
    <section>
      <h1>{title}</h1>
      <div>{actions}</div>
      {children}
    </section>
  )
}))
vi.mock('src/services/commandApi', () => ({ listAlerts: vi.fn(), ackAlert: vi.fn(), snoozeAlert: vi.fn() }))

import toast from 'react-hot-toast'
import { ackAlert, listAlerts, snoozeAlert } from 'src/services/commandApi'
import AlertsPage from './AlertsPage'

const page = (items, total = items.length) => ({ items, total, page: 1, pageSize: 25 })
const alert = (over = {}) => ({
  _id: 'e1',
  severity: 'critical',
  stream: 'business',
  event_type: 'STRIPE_DISPUTE',
  title: 'Dispute opened on pi_123',
  summary: 'Customer disputed a $50 charge',
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  alert_status: 'open',
  resolution_status: 'open',
  suggested_actions: [{ action: 'finance', label: 'Finance / escrow', href: '/apps/finance' }],
  ...over
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  routerState.query = {}
})

const wrap = ui => <EntityDrawerContext.Provider value={{ current: null, open: vi.fn(), close: vi.fn(), hrefFor: () => '#' }}>{ui}</EntityDrawerContext.Provider>

describe('AlertsPage', () => {
  it('lists alerts with severity, area, summary and related links', async () => {
    listAlerts.mockResolvedValue(page([alert(), alert({ _id: 'e2', severity: 'warning', stream: 'lesson', title: 'Low call quality', summary: null, session_id: '64b000000000000000000002', suggested_actions: [] })]))
    renderWithProviders(wrap(<AlertsPage />))

    expect(await screen.findByText('Dispute opened on pi_123')).toBeTruthy()
    expect(screen.getByText('Customer disputed a $50 charge')).toBeTruthy()
    expect(screen.getByText('Money & ops')).toBeTruthy()
    expect(screen.getByText('Lesson')).toBeTruthy()
    expect(screen.getByText('Finance / escrow →')).toBeTruthy()
    expect(screen.getByText('Open lesson')).toBeTruthy()
  })

  it('acknowledges an alert and refreshes the list', async () => {
    listAlerts.mockResolvedValue(page([alert()]))
    ackAlert.mockResolvedValue({ state: 'acked' })
    renderWithProviders(wrap(<AlertsPage />))

    fireEvent.click(await screen.findByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(ackAlert).toHaveBeenCalledWith('e1'))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Acknowledged'))
    // Invalidation refetches the list.
    await waitFor(() => expect(listAlerts.mock.calls.length).toBeGreaterThanOrEqual(2))
  })

  it('snoozes for the chosen time', async () => {
    listAlerts.mockResolvedValue(page([alert()]))
    snoozeAlert.mockResolvedValue({ state: 'snoozed' })
    renderWithProviders(wrap(<AlertsPage />))

    fireEvent.click(await screen.findByRole('button', { name: 'Snooze' }))
    fireEvent.click(await screen.findByText('4 hours'))
    await waitFor(() => expect(snoozeAlert).toHaveBeenCalledWith('e1', 240))
  })

  it('reports a failed acknowledge without losing the alert', async () => {
    listAlerts.mockResolvedValue(page([alert()]))
    ackAlert.mockRejectedValue(new Error('Alert not found'))
    renderWithProviders(wrap(<AlertsPage />))
    fireEvent.click(await screen.findByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Alert not found'))
    expect(screen.getByText('Dispute opened on pi_123')).toBeTruthy()
  })

  it('hides triage buttons on already acknowledged alerts', async () => {
    routerState.query = { status: 'acked' }
    listAlerts.mockResolvedValue(page([alert({ alert_status: 'acked' })]))
    renderWithProviders(wrap(<AlertsPage />))
    await screen.findByText('Dispute opened on pi_123')
    expect(screen.queryByRole('button', { name: 'Acknowledge' })) .toBeNull()
    expect(screen.getByText('Acknowledged', { selector: 'span' })).toBeTruthy()
  })

  it('asks the API for the filters in the URL', async () => {
    routerState.query = { status: 'snoozed', severity: 'critical', stream: 'business', page: '2' }
    listAlerts.mockResolvedValue(page([], 0))
    renderWithProviders(wrap(<AlertsPage />))
    await waitFor(() => expect(listAlerts).toHaveBeenCalled())
    expect(listAlerts.mock.calls[0][0]).toMatchObject({ status: 'snoozed', severity: 'critical', stream: 'business', page: 2, pageSize: 25 })
  })

  it('switches status tabs through the URL (regression: AdminTabs passes only the value)', async () => {
    listAlerts.mockResolvedValue(page([], 0))
    renderWithProviders(wrap(<AlertsPage />))
    fireEvent.click(await screen.findByRole('tab', { name: 'Snoozed' }))
    expect(routerState.replace).toHaveBeenCalledTimes(1)
    expect(routerState.replace.mock.calls[0][0].query).toMatchObject({ status: 'snoozed' })
    expect(routerState.replace.mock.calls[0][0].query.status).not.toBeUndefined()
  })

  it('shows inbox zero', async () => {
    listAlerts.mockResolvedValue(page([], 0))
    renderWithProviders(wrap(<AlertsPage />))
    expect(await screen.findByText('Inbox zero')).toBeTruthy()
  })

  it('ignores junk filter values in the URL instead of passing them to the API', async () => {
    routerState.query = { status: 'DROP TABLE', severity: '<script>', stream: 'x' }
    listAlerts.mockResolvedValue(page([], 0))
    renderWithProviders(wrap(<AlertsPage />))
    await waitFor(() => expect(listAlerts).toHaveBeenCalled())
    expect(listAlerts.mock.calls[0][0]).toMatchObject({ status: 'open', severity: undefined, stream: undefined })
  })
})
