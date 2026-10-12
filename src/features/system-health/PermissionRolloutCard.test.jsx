// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

vi.mock('src/services/commandApi', () => ({ getPermissionRollout: vi.fn() }))
import { getPermissionRollout } from 'src/services/commandApi'
import PermissionRolloutCard from './PermissionRolloutCard'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PermissionRolloutCard', () => {
  it('names who would be blocked and what to do', async () => {
    getPermissionRollout.mockResolvedValue({
      mode: 'warn', days: 7, state: 'not_ready', headline: 'Not yet. 9 requests in the last 7 days would have been blocked.',
      groups: [{ permission: 'finance_read', role: 'Support', count: 8, admins: 2, routes: ['GET /admin/finance/ledger'], lastAt: new Date(Date.now() - 3_600_000).toISOString() }],
      advice: ['Re-check after a few days.']
    })
    renderWithProviders(<PermissionRolloutCard />)
    expect(await screen.findByText('Not yet')).toBeTruthy()
    expect(screen.getByText(/9 requests in the last 7 days/)).toBeTruthy()
    expect(screen.getByText('Support')).toBeTruthy()
    expect(screen.getByText('finance_read')).toBeTruthy()
    expect(screen.getByText(/8 requests from 2 admins/)).toBeTruthy()
    expect(screen.getByText('GET /admin/finance/ledger')).toBeTruthy()
  })

  it('says ready when the window is quiet', async () => {
    getPermissionRollout.mockResolvedValue({ mode: 'warn', days: 7, state: 'ready', headline: 'Ready to enforce. No admin would have been blocked in the last 7 days.', groups: [], advice: ['Set ADMIN_ENFORCE_PERMISSIONS=enforce on the API and restart it.'] })
    renderWithProviders(<PermissionRolloutCard />)
    expect(await screen.findByText('Ready to enforce')).toBeTruthy()
    expect(screen.getByText(/Set ADMIN_ENFORCE_PERMISSIONS=enforce/)).toBeTruthy()
  })

  it('renders nothing for a viewer whose role cannot see it', async () => {
    getPermissionRollout.mockRejectedValue(Object.assign(new Error('This action is disabled'), { status: 403 }))
    const { container } = renderWithProviders(<PermissionRolloutCard />)
    await new Promise(r => setTimeout(r, 50))
    expect(container.textContent).toBe('')
  })
})
