// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EntityDrawerContext } from 'src/features/entity-drawers/EntityDrawerContext'
import { renderWithProviders } from 'src/test/renderWithProviders'

const push = vi.fn()
vi.mock('next/router', () => ({ useRouter: () => ({ push, pathname: '/', query: {} }) }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
vi.mock('src/configs/observability', () => ({ sentryIssuesUrl: () => null }))
vi.mock('src/services/commandApi', () => ({ searchAdmin: vi.fn() }))

import { searchAdmin } from 'src/services/commandApi'
import AdminCommandPalette from './AdminCommandPalette'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const drawerOpen = vi.fn()
const setup = (props = {}) =>
  renderWithProviders(
    <EntityDrawerContext.Provider value={{ current: null, open: drawerOpen, close: vi.fn(), hrefFor: () => '#' }}>
      <AdminCommandPalette open onClose={props.onClose || vi.fn()} />
    </EntityDrawerContext.Provider>
  )

describe('AdminCommandPalette', () => {
  it('suggests pages from the sidebar before anything is typed', () => {
    setup()
    expect(screen.getByText('Command Center')).toBeTruthy()
    expect(screen.getByText('Live Ops')).toBeTruthy()
  })

  it('searches as you type and opens a person in the drawer with Enter', async () => {
    searchAdmin.mockResolvedValue({ users: [{ id: 'u1', name: 'Olivia Trainee', email: 'o@example.com', accountType: 'Trainee', status: 'approved' }], bookings: [], sentry: [] })
    const onClose = vi.fn()
    setup({ onClose })
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'olivia' } })

    expect(await screen.findByText('Olivia Trainee')).toBeTruthy()
    expect(searchAdmin.mock.calls[0][0]).toBe('olivia')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(drawerOpen).toHaveBeenCalledWith('user', 'u1')
    expect(onClose).toHaveBeenCalled()
  })

  it('moves with the arrow keys and opens a lesson found by payment intent', async () => {
    searchAdmin.mockResolvedValue({
      users: [],
      bookings: [{ id: 'b1', status: 'confirmed', paymentIntentId: 'pi_9', trainer: { name: 'Tara' }, trainee: { name: 'Tim' } }],
      sentry: []
    })
    setup()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'pi_9' } })
    await screen.findByText('Tara with Tim')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(drawerOpen).toHaveBeenCalledWith('lesson', 'b1')
  })

  it('jumps straight to a typed path', async () => {
    setup()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: '/apps/ops' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/apps/ops')
    expect(searchAdmin).not.toHaveBeenCalled()
  })

  it('navigates to a page by name', async () => {
    setup()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'alerts' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/apps/alerts')
  })

  it('says when search fails instead of hanging', async () => {
    searchAdmin.mockRejectedValue(new Error('boom'))
    setup()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzzqq' } })
    await waitFor(() => expect(screen.getByText('Search is unavailable right now.')).toBeTruthy())
  })

  it('does not search for a single character', () => {
    setup()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } })
    expect(searchAdmin).not.toHaveBeenCalled()
  })
})
