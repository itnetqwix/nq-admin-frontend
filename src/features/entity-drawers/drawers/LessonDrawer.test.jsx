// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EntityDrawerContext } from 'src/features/entity-drawers/EntityDrawerContext'
import { renderWithProviders } from 'src/test/renderWithProviders'

// eslint-disable-next-line no-unused-vars
vi.mock('next/link', () => ({ default: ({ href, children, shallow, scroll, prefetch, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }))
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/', query: {}, push: vi.fn(), replace: vi.fn() }) }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
vi.mock('src/services/commandApi', () => ({
  getBookingDetail: vi.fn(),
  getLessonJourney: vi.fn(),
  getCallQualitySummary: vi.fn(),
  getSessionOpsEvents: vi.fn(),
  searchSentry: vi.fn()
}))

import { getBookingDetail, getCallQualitySummary, getLessonJourney, getSessionOpsEvents, searchSentry } from 'src/services/commandApi'
import LessonDrawer from './LessonDrawer'

const ID = '64b000000000000000000002'
const ago = m => new Date(Date.now() - m * 60_000).toISOString()

const booking = (over = {}) => ({
  session: { _id: ID, status: 'completed', is_instant: true, start_time: ago(60), both_joined_at: ago(55), actual_end_at: ago(25), total_extended_minutes: 10, refund_status: null, refund_reason_label: null },
  trainer: { _id: 't1', fullname: 'Tara Coach' },
  trainee: { _id: 'u1', fullname: 'Tim Trainee' },
  escrow: {
    status: 'held',
    charge_total_minor: 11000,
    session_subtotal_minor: 10000,
    surge_minor: 0,
    trainee_platform_fee_minor: 500,
    trainer_platform_fee_minor: 500,
    processing_fee_minor: 320,
    tax_minor: 0,
    trainer_net_minor: 8500,
    platform_fee_minor: 2500,
    release_eligible_at: ago(-60),
    released_at: null,
    release_blockers: ['Clearance period not elapsed']
  },
  refund: { status: null },
  payment: { method_label: 'Wallet' },
  amounts: { currency: 'usd' },
  ops_events: [{ _id: 'o1', title: 'Low call quality', createdAt: ago(30) }],
  ...over
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const wrap = () => (
  <EntityDrawerContext.Provider value={{ current: null, open: vi.fn(), close: vi.fn(), hrefFor: () => '#' }}>
    <LessonDrawer id={ID} />
  </EntityDrawerContext.Provider>
)

describe('LessonDrawer', () => {
  it('overview names both people, the times and the talk time', async () => {
    getBookingDetail.mockResolvedValue(booking())
    renderWithProviders(wrap())
    expect(await screen.findByText('Tara Coach')).toBeTruthy()
    expect(screen.getByText('Tim Trainee')).toBeTruthy()
    // "Ended" is both the status pill and the label of the end-time row.
    expect(screen.getAllByText('Ended').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Instant')).toBeTruthy()
    expect(screen.getByText('30m 00s')).toBeTruthy()
    expect(screen.getByText('10 min')).toBeTruthy()
    expect(screen.getByText('Low call quality', { exact: false })).toBeTruthy()
    expect(screen.getByText('Full debug view →').getAttribute('href')).toBe(`/apps/live-lessons/history?sessionId=${ID}`)
  })

  it('journey tab shows every step, marking missing ones as not yet', async () => {
    getBookingDetail.mockResolvedValue(booking())
    getLessonJourney.mockResolvedValue({
      journey: {
        steps: [
          { step: 'lesson', state: 'succeeded', createdAt: ago(25) },
          { step: 'recording', state: 'pending', title: 'Processing video', createdAt: ago(24) },
          { step: 'settlement', state: 'failed', title: 'Transfer failed', detail: 'card_declined', createdAt: ago(20) }
        ],
        pending: [{ step: 'recording' }],
        blocked: [{ step: 'settlement' }],
        ended: true,
        complete: false
      }
    })
    renderWithProviders(wrap())
    fireEvent.click(await screen.findByRole('tab', { name: 'Journey' }))
    expect(await screen.findByText('1 step failed or blocked')).toBeTruthy()
    expect(screen.getByText('Processing video')).toBeTruthy()
    expect(screen.getByText('Transfer failed — card_declined')).toBeTruthy()
    expect(screen.getAllByText('Not yet').length).toBeGreaterThan(3)
    expect(screen.getByText('Payment settled')).toBeTruthy()
  })

  it('quality tab shows score band, relay share and a sane RTT', async () => {
    getBookingDetail.mockResolvedValue(booking())
    getCallQualitySummary.mockResolvedValue({
      summary: { totalSamples: 12, averageOverallScore: 62.4, averageAudioScore: 70, averageVideoScore: 55, averageRtt: 0.085, relayUsagePercentage: 25 }
    })
    getSessionOpsEvents.mockResolvedValue([{ _id: 'c1', event_type: 'CALL_QUALITY_LOW', title: 'Low call quality', createdAt: ago(10) }])
    renderWithProviders(wrap())
    fireEvent.click(await screen.findByRole('tab', { name: 'Call quality' }))
    expect(await screen.findByText('Fair')).toBeTruthy()
    expect(screen.getByText('62')).toBeTruthy()
    expect(screen.getByText('85 ms')).toBeTruthy() // 0.085 s normalised
    expect(screen.getByText('25% of samples')).toBeTruthy()
  })

  it('quality tab explains when nothing was recorded', async () => {
    getBookingDetail.mockResolvedValue(booking())
    getCallQualitySummary.mockResolvedValue({ message: 'No quality stats found for this session', stats: [] })
    getSessionOpsEvents.mockResolvedValue([])
    renderWithProviders(wrap())
    fireEvent.click(await screen.findByRole('tab', { name: 'Call quality' }))
    expect(await screen.findByText(/No call quality samples were recorded/)).toBeTruthy()
  })

  it('errors tab searches Sentry by this lesson id and reads results as sentences', async () => {
    getBookingDetail.mockResolvedValue(booking())
    searchSentry.mockResolvedValue({
      query: `session_id:${ID}`,
      errors: [],
      items: [{ id: '9', title: 'WebRTC offer failed', culprit: 'lessonCallJoinHandler', count: 5, userCount: 2, impact: 'call', substatus: null, project: 'backend', firstSeen: ago(40), permalink: 'https://sentry.io/i/9' }]
    })
    renderWithProviders(wrap())
    fireEvent.click(await screen.findByRole('tab', { name: 'Errors' }))
    expect(await screen.findByText('WebRTC offer failed')).toBeTruthy()
    expect(screen.getByText('Live calls')).toBeTruthy()
    expect(searchSentry).toHaveBeenCalledWith(`session_id:${ID}`)
  })

  it('errors tab says so when there are none', async () => {
    getBookingDetail.mockResolvedValue(booking())
    searchSentry.mockResolvedValue({ query: 'x', errors: [], items: [] })
    renderWithProviders(wrap())
    fireEvent.click(await screen.findByRole('tab', { name: 'Errors' }))
    expect(await screen.findByText('No errors were reported for this lesson.')).toBeTruthy()
  })

  it('money tab shows the breakdown, the escrow state and why it has not released', async () => {
    getBookingDetail.mockResolvedValue(booking())
    renderWithProviders(wrap())
    fireEvent.click(await screen.findByRole('tab', { name: 'Money' }))
    expect(await screen.findByText('Escrow: held')).toBeTruthy()
    expect(screen.getByText('$110.00')).toBeTruthy()
    expect(screen.getByText('$85.00')).toBeTruthy()
    expect(screen.getByText('Clearance period not elapsed', { exact: false })).toBeTruthy()
    expect(screen.getByText('Open in Finance (release, refund, ledger) →').getAttribute('href')).toBe(`/apps/finance?sessionId=${ID}`)
  })

  it('money tab handles a lesson with no payment', async () => {
    getBookingDetail.mockResolvedValue(booking({ escrow: null }))
    renderWithProviders(wrap())
    fireEvent.click(await screen.findByRole('tab', { name: 'Money' }))
    expect(await screen.findByText('No payment is attached to this lesson.')).toBeTruthy()
  })

  it('shows the error with the request id when the booking cannot be loaded', async () => {
    getBookingDetail.mockRejectedValue(Object.assign(new Error('Booking not found'), { status: 404, requestId: 'req-7' }))
    renderWithProviders(wrap())
    expect(await screen.findByText('Couldn’t load this')).toBeTruthy()
    expect(screen.getByText(/Booking not found/)).toBeTruthy()
    await waitFor(() => expect(screen.getByText(/request req-7/)).toBeTruthy())
  })
})
