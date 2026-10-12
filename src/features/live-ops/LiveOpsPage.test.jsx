// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EntityDrawerContext } from 'src/features/entity-drawers/EntityDrawerContext'
import { renderWithProviders } from 'src/test/renderWithProviders'

const routerState = { query: {}, replace: vi.fn() }
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/apps/live-lessons', push: vi.fn(), isReady: true, ...routerState }) }))
// eslint-disable-next-line no-unused-vars
vi.mock('next/link', () => ({ default: ({ href, children, shallow, scroll, prefetch, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }))
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
vi.mock('src/services/commandApi', () => ({ getLiveOps: vi.fn() }))

import { getLiveOps } from 'src/services/commandApi'
import LiveOpsPage from './LiveOpsPage'

const iso = minAgo => new Date(Date.now() - minAgo * 60_000).toISOString()
const fixture = () => ({
  generatedAt: iso(0),
  summary: { live: 2, waiting: 1, late: 1, upcoming: 1, withQualityIssues: 1, instantPending: 0, noShows24h: 2 },
  lessons: [
    { sessionId: 'late1', state: 'late', trainer: { id: 't1', name: 'Lee Coach' }, trainee: { id: 'u1', name: 'Pat Trainee' }, isInstant: false, startsAt: iso(8), startedAt: null, firstJoinedAt: null, lowQualityEvents30m: 0, lastEventType: null, lastEventAt: null },
    { sessionId: 'live1', state: 'live', trainer: { id: 't2', name: 'Tara Coach' }, trainee: { id: 'u2', name: 'Tim Trainee' }, isInstant: true, startsAt: iso(20), startedAt: iso(18), firstJoinedAt: iso(19), lowQualityEvents30m: 3, lastEventType: 'CALL_QUALITY_LOW', lastEventAt: iso(1) },
    { sessionId: 'live2', state: 'live', trainer: { id: 't3', name: 'Sam Coach' }, trainee: { id: 'u3', name: 'Tina Trainee' }, isInstant: false, startsAt: iso(40), startedAt: iso(38), firstJoinedAt: iso(39), lowQualityEvents30m: 0, lastEventType: 'LESSON_STARTED', lastEventAt: iso(30) },
    { sessionId: 'up1', state: 'upcoming', trainer: { id: 't4', name: 'Kim Coach' }, trainee: null, isInstant: false, startsAt: new Date(Date.now() + 10 * 60_000).toISOString(), startedAt: null, firstJoinedAt: null, lowQualityEvents30m: 0, lastEventType: null, lastEventAt: null }
  ]
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  routerState.query = {}
})

const withDrawer = (ui, open) => (
  <EntityDrawerContext.Provider value={{ current: null, open, close: vi.fn(), hrefFor: () => '#' }}>{ui}</EntityDrawerContext.Provider>
)

describe('LiveOpsPage', () => {
  it('lists lessons with problems first and shows the headline counts', async () => {
    getLiveOps.mockResolvedValue(fixture())
    renderWithProviders(withDrawer(<LiveOpsPage />, vi.fn()))

    const table = await screen.findByRole('table', { name: 'Lessons in progress' })
    const rows = within(table).getAllByRole('button')
    expect(rows[0].textContent).toContain('Lee Coach') // late sorts first from the API
    expect(within(table).getByText('3 alerts')).toBeTruthy()
    expect(screen.getByText('Live now')).toBeTruthy()
    expect(screen.getByText('2 no-shows in 24h')).toBeTruthy()
    // Counts on the filter chips.
    expect(screen.getByText('All · 4')).toBeTruthy()
    expect(screen.getByText('Live · 2')).toBeTruthy()
    expect(screen.getByText('Late · 1')).toBeTruthy()
  })

  it('opens the lesson drawer when a row is clicked or Enter is pressed', async () => {
    getLiveOps.mockResolvedValue(fixture())
    const open = vi.fn()
    renderWithProviders(withDrawer(<LiveOpsPage />, open))
    const table = await screen.findByRole('table', { name: 'Lessons in progress' })
    const rows = within(table).getAllByRole('button')

    fireEvent.click(rows[1])
    expect(open).toHaveBeenCalledWith('lesson', 'live1')
    fireEvent.keyDown(rows[0], { key: 'Enter' })
    expect(open).toHaveBeenCalledWith('lesson', 'late1')
  })

  it('filters by search text and by call issues, and explains an empty result', async () => {
    getLiveOps.mockResolvedValue(fixture())
    renderWithProviders(withDrawer(<LiveOpsPage />, vi.fn()))
    await screen.findByRole('table', { name: 'Lessons in progress' })

    fireEvent.change(screen.getByLabelText('Search coach, trainee or id'), { target: { value: 'sam' } })
    expect(screen.getByText('Showing 1 of 4', { exact: false })).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Search coach, trainee or id'), { target: { value: 'nobody-here' } })
    expect(await screen.findByText('No lessons match these filters')).toBeTruthy()
  })

  it('handles a lesson with no trainee yet', async () => {
    getLiveOps.mockResolvedValue(fixture())
    renderWithProviders(withDrawer(<LiveOpsPage />, vi.fn()))
    const table = await screen.findByRole('table', { name: 'Lessons in progress' })
    expect(within(table).getByText('Kim Coach')).toBeTruthy()
  })

  it('shows a friendly empty state when nothing is happening', async () => {
    getLiveOps.mockResolvedValue({ ...fixture(), lessons: [], summary: { live: 0, waiting: 0, late: 0, upcoming: 0, withQualityIssues: 0, instantPending: 0, noShows24h: 0 } })
    renderWithProviders(withDrawer(<LiveOpsPage />, vi.fn()))
    expect(await screen.findByText('No lessons right now')).toBeTruthy()
  })

  it('shows the error and a retry instead of a blank screen', async () => {
    getLiveOps.mockRejectedValue(new Error('Could not load live lessons'))
    renderWithProviders(withDrawer(<LiveOpsPage />, vi.fn()))
    expect(await screen.findByText('Couldn’t load lessons')).toBeTruthy()
  })
})
