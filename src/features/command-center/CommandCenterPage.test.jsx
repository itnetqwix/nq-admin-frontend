// @vitest-environment jsdom
import { cleanup, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { commandCenterFixture, redactedForSupport } from 'src/test/fixtures/commandCenter'
import { renderWithProviders } from 'src/test/renderWithProviders'

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, pathname: '/home', replace: vi.fn(), push: vi.fn(), isReady: true })
}))
// eslint-disable-next-line no-unused-vars
vi.mock('next/link', () => ({ default: ({ href, children, shallow, scroll, prefetch, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span data-testid='icon' /> }))
vi.mock('src/@core/components/react-apexcharts', () => ({ default: ({ type }) => <div data-testid={`chart-${type}`} /> }))
vi.mock('src/@core/styles/libs/react-apexcharts', () => ({ default: ({ children }) => <div>{children}</div> }))
vi.mock('src/layouts/components/AdminPageShell', () => ({
  default: ({ title, subtitle, actions, children }) => (
    <section>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div>{actions}</div>
      {children}
    </section>
  )
}))
vi.mock('src/pages/components/tables/UsersTable', () => ({ default: () => <div data-testid='online-users' /> }))
vi.mock('src/features/command-center/GlobalCommissionCard', () => ({ default: () => <div data-testid='commission' /> }))
vi.mock('src/services/commandApi', () => ({ getCommandCenter: vi.fn(), getSentryStats: vi.fn() }))

import { getCommandCenter, getSentryStats } from 'src/services/commandApi'
import CommandCenterPage from './CommandCenterPage'

beforeEach(() => {
  getSentryStats.mockResolvedValue({
    statsPeriod: '24h',
    unresolvedIssues: 2,
    newOrRegressed: 1,
    byImpact: { payment: 1 },
    byProject: [],
    errors: [],
    topIssues: [{ id: '1', title: 'Stripe webhook failed', culprit: 'stripe', count: 12, userCount: 4, impact: 'payment', substatus: 'new', firstSeen: '2026-10-11T09:00:00Z', project: 'backend', permalink: 'https://sentry.io/i/1' }]
  })
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CommandCenterPage', () => {
  it('shows what needs attention, the live lessons, and the headline numbers', async () => {
    getCommandCenter.mockResolvedValue(commandCenterFixture())
    renderWithProviders(<CommandCenterPage />)

    expect(await screen.findByText('Open payment disputes / chargebacks')).toBeTruthy()
    expect(screen.getByText('Trainers waiting for review')).toBeTruthy()
    expect(screen.getByText('Open support tickets')).toBeTruthy()

    // Headline KPIs with their change vs the previous period.
    expect(screen.getByText('GMV')).toBeTruthy()
    expect(screen.getByText('$12.3K')).toBeTruthy()
    expect(screen.getAllByText('+25.0% vs previous').length).toBeGreaterThan(0)
    expect(screen.getByText('Completion rate')).toBeTruthy()

    // Live now and the lesson that is late.
    expect(screen.getByText('Live now')).toBeTruthy()
    // "Late" is both the counter's label and the pill on the late lesson row.
    expect(screen.getAllByText('Late')).toHaveLength(2)
    expect(screen.getByText('4 quality alerts')).toBeTruthy()
    expect(screen.getByText(/Tara Coach/)).toBeTruthy()
  })

  it('explains system trouble in words and shows money at risk', async () => {
    getCommandCenter.mockResolvedValue(commandCenterFixture())
    renderWithProviders(<CommandCenterPage />)
    expect(await screen.findByText(/Stale cron jobs: escrow-release/)).toBeTruthy()
    expect(screen.getByText('Money at risk')).toBeTruthy()
    expect(screen.getByText('$6,420.00')).toBeTruthy()
    expect(screen.getByText('Held in escrow')).toBeTruthy()
  })

  it('reads Sentry errors as sentences with impact and people affected', async () => {
    getCommandCenter.mockResolvedValue(commandCenterFixture())
    renderWithProviders(<CommandCenterPage />)
    expect(await screen.findByText('Stripe webhook failed')).toBeTruthy()
    expect(screen.getByText(/4 users affected · 12 events/)).toBeTruthy()
    expect(screen.getByText('Payments')).toBeTruthy()
    expect(screen.getByText('New')).toBeTruthy()
  })

  it('keeps the carried-over commission card and online users table', async () => {
    getCommandCenter.mockResolvedValue(commandCenterFixture())
    renderWithProviders(<CommandCenterPage />)
    await screen.findByText('Needs your attention')
    expect(screen.getByTestId('commission')).toBeTruthy()
    expect(screen.getByTestId('online-users')).toBeTruthy()
  })

  it('shows an all-clear state when nothing needs attention', async () => {
    getCommandCenter.mockResolvedValue(commandCenterFixture({ attention: [] }))
    renderWithProviders(<CommandCenterPage />)
    expect(await screen.findByText('All clear')).toBeTruthy()
  })

  it('hides every money figure for a role that cannot see finance', async () => {
    getCommandCenter.mockResolvedValue(redactedForSupport(commandCenterFixture()))
    renderWithProviders(<CommandCenterPage />)
    await screen.findByText('Open support tickets')

    expect(screen.queryByText('GMV')).toBeNull()
    expect(screen.queryByText('Platform revenue')).toBeNull()
    expect(screen.queryByText('Take rate')).toBeNull()
    expect(screen.queryByText('Money at risk')).toBeNull()
    expect(screen.queryByText('Gross booking value')).toBeNull()
    expect(screen.queryByText('Open payment disputes / chargebacks')).toBeNull()
    // Non-money numbers are still there ("Bookings" is both a tile and a chart title).
    expect(screen.getAllByText('Bookings').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Completion rate')).toBeTruthy()
    expect(screen.getByText('Active coaches')).toBeTruthy()
  })

  it('shows a readable error with the request id instead of a blank page', async () => {
    getCommandCenter.mockRejectedValue(Object.assign(new Error('Could not load the Command Center'), { status: 500, requestId: 'req-42' }))
    renderWithProviders(<CommandCenterPage />)
    await waitFor(() => expect(screen.getByText(/Couldn’t load the Command Center/)).toBeTruthy())
    expect(screen.getByText(/request req-42/)).toBeTruthy()
  })

  it('renders in dark mode too', async () => {
    getCommandCenter.mockResolvedValue(commandCenterFixture())
    renderWithProviders(<CommandCenterPage />, { mode: 'dark' })
    expect(await screen.findByText('Needs your attention')).toBeTruthy()
  })
})
