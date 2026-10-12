// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

vi.mock('src/components/admin/charts/AreaTrend', () => ({ default: ({ series }) => <div data-testid='chart'>{series.map(s => s.name).join(',')}</div> }))
vi.mock('src/services/peopleApi', () => ({ getGrowthHistory: vi.fn(), getApiHistory: vi.fn() }))

import { getApiHistory, getGrowthHistory } from 'src/services/peopleApi'
import { ApiHistory, BusinessHistory } from './LongRangeTrends'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const business = (over = {}) => ({ days: 90, series: [{ date: '2026-10-10', bookings: 1 }, { date: '2026-10-11', bookings: null }], missingDays: ['2026-10-11'], ...over })

describe('BusinessHistory', () => {
  it('loads 90 days, explains gaps, and reloads for another range', async () => {
    getGrowthHistory.mockResolvedValue(business())
    renderWithProviders(<BusinessHistory />)
    expect(await screen.findByText('2026-10-11 hasn’t been summarised yet.')).toBeTruthy()
    expect(getGrowthHistory).toHaveBeenCalledWith(90)
    fireEvent.click(screen.getByRole('button', { name: '1 year' }))
    await waitFor(() => expect(getGrowthHistory).toHaveBeenCalledWith(365))
  })
  it('shows an empty state when nothing has been summarised', async () => {
    getGrowthHistory.mockResolvedValue(business({ missingDays: ['2026-10-10', '2026-10-11'] }))
    renderWithProviders(<BusinessHistory />)
    await waitFor(() => expect(getGrowthHistory).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryAllByTestId('chart')).toHaveLength(0))
  })
})

describe('ApiHistory', () => {
  it('summarises the span', async () => {
    getApiHistory.mockResolvedValue({ days: 90, series: [{ date: '2026-10-10', errorRate: 0.01, avgMs: 100 }], totals: { estRequests: 1000, errors5xx: 10, errorRate: 0.01, avgMs: 100 }, missingDays: [] })
    renderWithProviders(<ApiHistory />)
    expect(await screen.findByText('1,000 requests estimated · 1.00% failed with a server error · 100 ms average')).toBeTruthy()
    expect(getApiHistory).toHaveBeenCalledWith(90)
  })
})
