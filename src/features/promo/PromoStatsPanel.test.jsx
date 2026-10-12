// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

vi.mock('next/link', () => ({ default: ({ children }) => <a>{children}</a> }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
vi.mock('src/services/promoStatsApi', () => ({ getPromoCodeStats: vi.fn() }))

import { getPromoCodeStats } from 'src/services/promoStatsApi'
import PromoStatsPanel from './PromoStatsPanel'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const data = {
  health: { state: 'exhausted', daysLeft: 5, remaining: 0, usedShare: 1 },
  outcome: { bookings: 3, completed: 1, canceled: 1, refunded: 0, uniqueUsers: 3, discountMinor: 2000, discountReturnedMinor: 0, revenueMinor: 10000, commissionMinor: 2000, platformFundedDiscountMinor: 2000, trainerFundedDiscountMinor: 0, averageOrderMinor: 5000, newCustomerShare: 0.5 },
  daily: [{ date: 'a', bookings: 0 }, { date: 'b', bookings: 2 }], days: 30, capped: false, redemptionsRecorded: 3
}

describe('PromoStatsPanel', () => {
  it('shows the state of the code and its results', async () => {
    getPromoCodeStats.mockResolvedValue(data)
    renderWithProviders(<PromoStatsPanel promoId='p1' />)
    expect(await screen.findByText('Fully used')).toBeTruthy()
    expect(screen.getByText('Discount given')).toBeTruthy()
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0) // discount, commission and funding all happen to be $20
    expect(screen.getByText('$100.00')).toBeTruthy()
    expect(getPromoCodeStats).toHaveBeenCalledWith('p1')
  })
  it('warns when only recent lessons were counted', async () => {
    getPromoCodeStats.mockResolvedValue({ ...data, capped: true })
    renderWithProviders(<PromoStatsPanel promoId='p1' />)
    expect(await screen.findByText(/most recent 5,000 lessons/)).toBeTruthy()
  })
  it('shows a readable error with a retry', async () => {
    getPromoCodeStats.mockRejectedValueOnce(new Error('Promo code not found'))
    renderWithProviders(<PromoStatsPanel promoId='p1' />)
    expect(await screen.findByText('Promo code not found')).toBeTruthy()
    getPromoCodeStats.mockResolvedValue(data)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Fully used')).toBeTruthy()
  })
})
