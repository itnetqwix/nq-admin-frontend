// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

const routerState = { query: {}, replace: vi.fn() }
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/apps/growth', push: vi.fn(), isReady: true, ...routerState }) }))
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
vi.mock('src/services/peopleApi', () => ({
  getGrowthOverview: vi.fn(),
  getGrowthFunnel: vi.fn(),
  getGrowthCohorts: vi.fn(),
  getGrowthSegments: vi.fn(),
  getGrowthSupply: vi.fn()
}))

import { getGrowthCohorts, getGrowthFunnel, getGrowthOverview, getGrowthSegments, getGrowthSupply } from 'src/services/peopleApi'
import GrowthPage from './GrowthPage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  routerState.query = {}
})

const overview = {
  days: 30,
  signups: { trainees: 30, trainers: 3, previousTrainees: 20, previousTrainers: 0 },
  dailySignups: [{ date: '2026-10-09', trainees: 4, trainers: 1 }, { date: '2026-10-10', trainees: 6, trainers: 0 }],
  activeTrainees7d: 12, activeTrainees30d: 40, activeTrainers30d: 5
}
const funnel = {
  days: 30, role: 'Trainee', truncated: false, scanned: 30, medianDaysToFirstBooking: 3.5,
  steps: [
    { key: 'signed_up', label: 'Signed up', users: 30, ofPrevious: null, ofSignups: 1 },
    { key: 'booked', label: 'Booked a lesson', users: 18, ofPrevious: 0.6, ofSignups: 0.6 },
    { key: 'completed', label: 'Completed a lesson', users: 12, ofPrevious: 0.6667, ofSignups: 0.4 },
    { key: 'repeat', label: 'Completed 2+ lessons', users: 6, ofPrevious: 0.5, ofSignups: 0.2 }
  ]
}
const segments = {
  total: 200,
  stages: [
    { stage: 'new', users: 20, share: 0.1 }, { stage: 'never_booked', users: 30, share: 0.15 }, { stage: 'activated', users: 40, share: 0.2 },
    { stage: 'engaged', users: 60, share: 0.3 }, { stage: 'at_risk', users: 30, share: 0.15 }, { stage: 'churned', users: 20, share: 0.1 }
  ]
}
const supply = { approvedCoaches: 20, activeCoaches30d: 10, activeShare: 0.5, newCoaches30d: 3, pendingReview: 8, oldestPendingAt: '2026-10-01T00:00:00Z', newCoachesBooked: 2, newCoachesTotal: 4, medianDaysToFirstBooking: 6 }

function mockAll() {
  getGrowthOverview.mockResolvedValue(overview)
  getGrowthFunnel.mockResolvedValue(funnel)
  getGrowthSegments.mockResolvedValue(segments)
  getGrowthSupply.mockResolvedValue(supply)
}

describe('GrowthPage overview', () => {
  it('shows signups against the previous period, the funnel and every lifecycle stage', async () => {
    mockAll()
    renderWithProviders(<GrowthPage />)
    expect(await screen.findByText('New trainees')).toBeTruthy()
    expect(screen.getByText('+50.0% vs previous')).toBeTruthy()
    expect(await screen.findByText('Booked a lesson')).toBeTruthy()
    expect(screen.getByText(/60% of previous/)).toBeTruthy()
    expect(screen.getByText(/books their first lesson 3.5 days after joining/)).toBeTruthy()
    for (const label of ['New', 'Never booked', 'Activated', 'Engaged', 'At risk', 'Churned']) {
      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('60')).toBeTruthy() // engaged count
  })

  it('flags a long verification queue and links to it', async () => {
    mockAll()
    renderWithProviders(<GrowthPage />)
    const tile = (await screen.findByText('Coaches awaiting review')).closest('a')
    expect(tile.getAttribute('href')).toBe('/apps/trainer-verifications')
    expect(within(tile).getByText('8')).toBeTruthy()
  })

  it('says the funnel is a sample when the scan was capped', async () => {
    mockAll()
    getGrowthFunnel.mockResolvedValue({ ...funnel, truncated: true })
    renderWithProviders(<GrowthPage />)
    expect(await screen.findByText(/sample of the first 50,000/)).toBeTruthy()
  })

  it('reads the range from the URL and changes it through the URL', async () => {
    routerState.query = { days: '90' }
    mockAll()
    renderWithProviders(<GrowthPage />)
    await screen.findByText('New trainees')
    expect(getGrowthOverview).toHaveBeenCalledWith(90)
    fireEvent.click(screen.getByRole('button', { name: '7 days' }))
    expect(routerState.replace.mock.calls[0][0].query.days).toBe(7)
  })

  it('ignores an invalid range in the URL', async () => {
    routerState.query = { days: '9999', tab: 'bogus' }
    mockAll()
    renderWithProviders(<GrowthPage />)
    await screen.findByText('New trainees')
    expect(getGrowthOverview).toHaveBeenCalledWith(30)
  })
})

describe('GrowthPage cohorts', () => {
  const cohorts = (metric = 'retention') => ({
    kind: 'week', role: 'Trainee', metric, definition: 'Share of a signup group that made a booking n periods after joining',
    cohorts: [
      { label: 'Sep 28', start: '2026-09-28T00:00:00.000Z', size: 10, cells: [{ n: 0, users: 6, pct: 0.6, revenueMinor: 60000 }, { n: 1, users: 3, pct: 0.3, revenueMinor: 30000 }] },
      { label: 'Oct 5', start: '2026-10-05T00:00:00.000Z', size: 8, cells: [{ n: 0, users: 4, pct: 0.5, revenueMinor: 40000 }] },
      { label: 'Oct 12', start: '2026-10-12T00:00:00.000Z', size: 0, cells: [{ n: 0, users: 0, pct: null, revenueMinor: 0 }] }
    ],
    average: [{ n: 0, users: 10, size: 18, pct: 0.5556 }, { n: 1, users: 3, size: 10, pct: 0.3 }]
  })

  it('draws the matrix: percentages, people counts, blank future cells and an all-cohorts row', async () => {
    routerState.query = { tab: 'cohorts' }
    getGrowthCohorts.mockResolvedValue(cohorts())
    renderWithProviders(<GrowthPage />)
    const table = await screen.findByRole('table', { name: 'Cohort retention' })
    expect(within(table).getByText('60%')).toBeTruthy()
    expect(within(table).getByText('Joined')).toBeTruthy()
    expect(within(table).getByText('+1 week')).toBeTruthy()
    expect(within(table).getByText('All cohorts')).toBeTruthy()
    expect(within(table).getByText('56%')).toBeTruthy() // weighted average at n0
    // Oct 5's second period hasn't happened: dashed, labelled, and NOT shown as 0%.
    expect(within(table).getAllByLabelText('not yet observed').length).toBe(2)
    expect(within(table).getByTitle('6 of 10 people')).toBeTruthy()
  })

  it('links each cohort to the people in it, but not an empty cohort', async () => {
    routerState.query = { tab: 'cohorts' }
    getGrowthCohorts.mockResolvedValue(cohorts())
    renderWithProviders(<GrowthPage />)
    const table = await screen.findByRole('table', { name: 'Cohort retention' })
    expect(within(table).getByText('Sep 28').closest('a').getAttribute('href')).toBe('/apps/users?account_type=Trainee&from=2026-09-28&to=2026-10-05')
    expect(within(table).getByText('Oct 12').closest('a')).toBeNull()
  })

  it('switches measure through the URL and asks the API for it', async () => {
    routerState.query = { tab: 'cohorts', metric: 'revenue', granularity: 'month', role: 'Trainer' }
    getGrowthCohorts.mockResolvedValue(cohorts('revenue'))
    renderWithProviders(<GrowthPage />)
    expect(await screen.findByText('Money booked by each signup group')).toBeTruthy()
    expect(getGrowthCohorts).toHaveBeenCalledWith(expect.objectContaining({ granularity: 'month', role: 'Trainer', metric: 'revenue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }))
    expect(routerState.replace.mock.calls[0][0].query.granularity).toBe('week')
  })
})

describe('GrowthPage coaches', () => {
  it('reports supply and how long new coaches wait for a first booking', async () => {
    routerState.query = { tab: 'coaches' }
    getGrowthSupply.mockResolvedValue(supply)
    renderWithProviders(<GrowthPage />)
    // Labels render before the data does, so wait for the data itself.
    expect(await screen.findByText('50% of approved')).toBeTruthy()
    expect(screen.getByText('Approved coaches')).toBeTruthy()
    expect(screen.getByText(/2 of 4 new coaches have been booked\. The typical one waited 6 days\./)).toBeTruthy()
  })

  it('handles the no-new-coaches and none-booked cases', async () => {
    routerState.query = { tab: 'coaches' }
    getGrowthSupply.mockResolvedValue({ ...supply, newCoachesTotal: 0, newCoachesBooked: 0, medianDaysToFirstBooking: null })
    const { unmount } = renderWithProviders(<GrowthPage />)
    expect(await screen.findByText('No coaches joined in the last 90 days.')).toBeTruthy()
    unmount()
    getGrowthSupply.mockResolvedValue({ ...supply, newCoachesTotal: 3, newCoachesBooked: 0, medianDaysToFirstBooking: null })
    renderWithProviders(<GrowthPage />)
    expect(await screen.findByText(/None of the 3 new coaches has a booking yet/)).toBeTruthy()
  })
})
