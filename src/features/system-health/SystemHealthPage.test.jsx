// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

vi.mock('next/router', () => ({ useRouter: () => ({ query: {}, pathname: '/apps/system-health', push: vi.fn(), replace: vi.fn() }) }))
// eslint-disable-next-line no-unused-vars
vi.mock('next/link', () => ({ default: ({ href, children, shallow, scroll, prefetch, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }))
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
vi.mock('src/services/commandApi', () => ({ getSystemHealth: vi.fn(), getApiHealth: vi.fn(), getSentryStats: vi.fn() }))

import { getApiHealth, getSentryStats, getSystemHealth } from 'src/services/commandApi'
import SystemHealthPage from './SystemHealthPage'

const ago = s => new Date(Date.now() - s * 1000).toISOString()
const health = (over = {}) => ({
  generatedAt: ago(5),
  overall: { level: 'degraded', reasons: ['Stale cron jobs: escrow-release', '2 Stripe webhook failures in 24h'] },
  mongo: { ok: true, readyState: 1 },
  redis: { enabled: true, ok: true, latencyMs: 3 },
  queues: {
    available: true,
    items: [
      { name: 'nq-clip-transcode', waiting: 4, active: 1, delayed: 0, failed: 0, paused: 0 },
      { name: 'nq-game-plan-pdf-stitch', waiting: 0, active: 0, delayed: 0, failed: 3, paused: 0 },
      { name: 'nq-data-export', waiting: 900, active: 0, delayed: 0, failed: 0, paused: 0 }
    ]
  },
  workers: [
    { id: 'api:host:1', role: 'api', pid: 1, host: 'host-a', startedAt: ago(7200), lastSeenAt: ago(8), ageSec: 8 },
    { id: 'worker:host:2', role: 'worker', pid: 2, host: 'host-b', startedAt: ago(7200), lastSeenAt: ago(120), ageSec: 120 }
  ],
  crons: [
    { name: 'escrow-release', pattern: '*/15 * * * *', expectedIntervalSec: 900, lastRunAt: ago(3600), lastStatus: 'ok', lastDurationMs: 420, lastError: null, stale: true },
    { name: 'trainer-grace', pattern: '* * * * *', expectedIntervalSec: 60, lastRunAt: ago(30), lastStatus: 'ok', lastDurationMs: 12, lastError: null, stale: false },
    { name: 'verification-sla', pattern: '0 * * * *', expectedIntervalSec: 3600, lastRunAt: ago(100), lastStatus: 'error', lastDurationMs: 5, lastError: 'db timeout', stale: false },
    { name: 'log-retention-purge', pattern: '0 4 * * *', expectedIntervalSec: 86400, lastRunAt: null, lastStatus: 'never', lastDurationMs: null, lastError: null, stale: false }
  ],
  webhooks: { lastReceivedAt: ago(60), lagSec: 0, failed24h: 2, unprocessed: 0 },
  ...over
})
const apiHealth = {
  hours: 24,
  sampleRate: 0.15,
  buckets: [{ hour: '2026-10-11T10:00:00Z', estRequests: 2000, errors5xx: 10, errors4xx: 1, errorRate: 0.005, avgMs: 150, slowShare: 0.01 }],
  summary: { estRequests: 2000, errors5xx: 10, errorRate: 0.005, avgMs: 150 }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SystemHealthPage', () => {
  it('says plainly what is wrong and why', async () => {
    getSystemHealth.mockResolvedValue(health())
    getApiHealth.mockResolvedValue(apiHealth)
    getSentryStats.mockResolvedValue({ unresolvedIssues: 0, newOrRegressed: 0, byImpact: {}, byProject: [], topIssues: [], errors: [] })
    renderWithProviders(<SystemHealthPage />)

    expect(await screen.findByText('Something needs a look')).toBeTruthy()
    expect(screen.getByText('Stale cron jobs: escrow-release')).toBeTruthy()
    expect(screen.getByText('2 Stripe webhook failures in 24h')).toBeTruthy()
  })

  it('classifies each queue and process', async () => {
    getSystemHealth.mockResolvedValue(health())
    getApiHealth.mockResolvedValue(apiHealth)
    getSentryStats.mockResolvedValue({ unresolvedIssues: 0, newOrRegressed: 0, byImpact: {}, byProject: [], topIssues: [], errors: [] })
    renderWithProviders(<SystemHealthPage />)

    // The section title renders before the data, so wait for the data itself.
    expect(await screen.findByText('3 failed')).toBeTruthy()
    expect(screen.getByText('Backed up')).toBeTruthy()
    expect(screen.getByText('Working')).toBeTruthy()
    expect(screen.getByText('Alive')).toBeTruthy()
    expect(screen.getByText('Stale')).toBeTruthy()
    // Queue names are humanised.
    expect(screen.getByText('clip transcode')).toBeTruthy()
  })

  it('shows scheduled tasks as overdue, failed, on time or not yet run', async () => {
    getSystemHealth.mockResolvedValue(health())
    getApiHealth.mockResolvedValue(apiHealth)
    getSentryStats.mockResolvedValue({ unresolvedIssues: 0, newOrRegressed: 0, byImpact: {}, byProject: [], topIssues: [], errors: [] })
    renderWithProviders(<SystemHealthPage />)

    const row = async name => (await screen.findByText(name)).closest('tr')
    expect(within(await row('escrow-release')).getByText('Overdue')).toBeTruthy()
    expect(within(await row('trainer-grace')).getByText('On time')).toBeTruthy()
    expect(within(await row('verification-sla')).getByText('Failed')).toBeTruthy()
    expect(within(await row('verification-sla')).getByText('db timeout')).toBeTruthy()
    expect(within(await row('log-retention-purge')).getByText('No run yet')).toBeTruthy()
  })

  it('is calm when everything is fine', async () => {
    getSystemHealth.mockResolvedValue(health({ overall: { level: 'ok', reasons: [] }, crons: [], webhooks: { lastReceivedAt: ago(5), lagSec: 0, failed24h: 0, unprocessed: 0 }, queues: { available: true, items: [] } }))
    getApiHealth.mockResolvedValue(apiHealth)
    getSentryStats.mockResolvedValue({ unresolvedIssues: 0, newOrRegressed: 0, byImpact: {}, byProject: [], topIssues: [], errors: [] })
    renderWithProviders(<SystemHealthPage />)
    expect(await screen.findByText('All systems normal')).toBeTruthy()
  })

  it('explains that queues are off when Redis is disabled (local dev)', async () => {
    getSystemHealth.mockResolvedValue(health({ redis: { enabled: false, ok: true }, queues: { available: false, items: [] }, workers: [] }))
    getApiHealth.mockResolvedValue(apiHealth)
    getSentryStats.mockRejectedValue(Object.assign(new Error('Sentry admin integration is not configured'), { status: 500 }))
    renderWithProviders(<SystemHealthPage />)
    expect(await screen.findByText(/Queues are off in this environment/)).toBeTruthy()
    expect(screen.getByText('Disabled in this environment')).toBeTruthy()
    expect(screen.getByText(/No process has reported in/)).toBeTruthy()
    // A missing Sentry setup reads as a setup hint, not a stack trace.
    expect((await screen.findAllByText(/Sentry isn’t connected/)).length).toBeGreaterThan(0)
  })

  it('shows a retry when the health check itself fails', async () => {
    getSystemHealth.mockRejectedValue(new Error('Could not load system health'))
    getApiHealth.mockResolvedValue(apiHealth)
    getSentryStats.mockResolvedValue({ unresolvedIssues: 0, newOrRegressed: 0, byImpact: {}, byProject: [], topIssues: [], errors: [] })
    renderWithProviders(<SystemHealthPage />)
    expect(await screen.findByText('Couldn’t load system health')).toBeTruthy()
  })
})
