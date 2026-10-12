// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

vi.mock('src/services/peopleApi', () => ({ getUserTrajectory: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))

import { getUserTrajectory } from 'src/services/peopleApi'
import User360JourneyTab from './User360JourneyTab'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const ago = d => new Date(Date.now() - d * 86_400_000).toISOString()

describe('User360JourneyTab', () => {
  it('shows the stage, the counts and which milestones are done or still ahead', async () => {
    getUserTrajectory.mockResolvedValue({
      role: 'Trainee',
      stage: 'at_risk',
      stats: { bookings: 4, completed: 3, cancelled: 1, refunds: 0 },
      milestones: [
        { key: 'signup', label: 'Signed up', at: ago(100), done: true, detail: 'Invited by another user' },
        { key: 'first_booking', label: 'First booking', at: ago(95), done: true },
        { key: 'first_refund', label: 'First refund', at: null, done: false },
        { key: 'last_booking', label: 'Most recent booking', at: ago(45), done: true }
      ]
    })
    renderWithProviders(<User360JourneyTab userId='u1' />)
    expect(await screen.findByText('At risk')).toBeTruthy()
    expect(screen.getByText('Last booked 30–90 days ago')).toBeTruthy()
    expect(screen.getByText('Invited by another user')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy() // bookings
    // The refund milestone is shown as not reached, not hidden.
    const refund = screen.getByText('First refund')
    expect(refund.parentElement.textContent).toContain('not yet')
    expect(screen.getByText('From signing up to coming back.')).toBeTruthy()
  })

  it('shows an undated milestone as done without inventing a date', async () => {
    getUserTrajectory.mockResolvedValue({
      role: 'Trainer',
      stage: 'new',
      stats: { bookings: 0, completed: 0, cancelled: 0, refunds: 0 },
      milestones: [
        { key: 'signup', label: 'Signed up', at: ago(3), done: true },
        { key: 'approved', label: 'Approved to coach', at: null, done: true }
      ]
    })
    renderWithProviders(<User360JourneyTab userId='u2' />)
    expect(await screen.findByText('Approved to coach')).toBeTruthy()
    expect(screen.getByText('Done')).toBeTruthy()
    expect(screen.queryByText('Invalid Date')).toBeNull()
    expect(screen.getByText('From signing up to teaching lessons.')).toBeTruthy()
  })

  it('explains a failure instead of crashing', async () => {
    getUserTrajectory.mockRejectedValue(Object.assign(new Error('User not found'), { status: 404 }))
    renderWithProviders(<User360JourneyTab userId='nope' />)
    expect(await screen.findByText('User not found')).toBeTruthy()
  })
})
