// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

const routerState = { query: {}, replace: vi.fn() }
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/apps/delivery', push: vi.fn(), isReady: true, ...routerState }) }))
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
vi.mock('src/services/deliveryApi', () => ({ getDeliveryStats: vi.fn(), listDeliveries: vi.fn() }))

import { getDeliveryStats, listDeliveries } from 'src/services/deliveryApi'
import DeliveryPage from './DeliveryPage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  routerState.query = {}
})

const stats = {
  hours: 24,
  channels: [
    { channel: 'email', sent: 190, failed: 10, total: 200, failureRate: 0.05 },
    { channel: 'sms', sent: 50, failed: 50, total: 100, failureRate: 0.5 },
    { channel: 'whatsapp', sent: 1, failed: 1, total: 2, failureRate: 0.5 },
    { channel: 'push', sent: 0, failed: 0, total: 0, failureRate: null }
  ],
  topErrors: [{ channel: 'sms', error: 'The number [number] is not a mobile number', count: 40 }]
}
const row = (over = {}) => ({ _id: 'r1', channel: 'email', status: 'sent', recipient_masked: 'ta***@gmail.com', recipient_count: 1, subject: 'Welcome to NetQwix', provider_message_id: '<m1@ses>', createdAt: new Date(Date.now() - 120_000).toISOString(), ...over })
const page = items => ({ items, total: items.length, page: 1, pageSize: 30 })

describe('DeliveryPage', () => {
  it('rates each channel, ignoring a tiny sample, and hides an unused channel', async () => {
    getDeliveryStats.mockResolvedValue(stats)
    listDeliveries.mockResolvedValue(page([row()]))
    renderWithProviders(<DeliveryPage />)
    expect(await screen.findByText('Degraded')).toBeTruthy() // email 5%
    expect(screen.getByText('Failing')).toBeTruthy() // sms 50% of 100
    expect(screen.getByText('Some failed')).toBeTruthy() // whatsapp 1 of 2: not an alarm
    expect(screen.queryByText('Push sent')).toBeNull()
    expect(screen.getByText('The number [number] is not a mobile number')).toBeTruthy()
  })

  it('lists masked recipients, results and the failure reason', async () => {
    getDeliveryStats.mockResolvedValue(stats)
    listDeliveries.mockResolvedValue(
      page([row(), row({ _id: 'r2', channel: 'sms', status: 'failed', recipient_masked: '+1•••••••23', recipient_count: 1, subject: undefined, provider_message_id: undefined, error: 'Not a mobile number' }), row({ _id: 'r3', recipient_count: 3 })])
    )
    renderWithProviders(<DeliveryPage />)
    expect(await screen.findAllByText('ta***@gmail.com')).toBeTruthy()
    expect(screen.getByText('ta***@gmail.com +2 more')).toBeTruthy()
    expect(screen.getByText('+1•••••••23')).toBeTruthy()
    expect(screen.getByText('Not a mobile number')).toBeTruthy()
    // "Failed" is also a filter chip, so look inside the table.
    expect(within(screen.getByRole('table', { name: 'Delivery log' })).getByText('Failed')).toBeTruthy()
  })

  it('shows confirmed delivery, bounces and the provider reason', async () => {
    getDeliveryStats.mockResolvedValue({ ...stats, topErrors: [{ channel: 'email', status: 'bounced', error: 'Bounce: Permanent (General)', count: 4 }] })
    listDeliveries.mockResolvedValue(
      page([row({ status: 'delivered' }), row({ _id: 'r2', status: 'bounced', status_detail: 'Bounce: Permanent (General)', recipient_masked: 'zz***@x.com' })])
    )
    renderWithProviders(<DeliveryPage />)
    await screen.findByText('zz***@x.com')
    const table = screen.getByRole('table', { name: 'Delivery log' })
    expect(within(table).getByText('Delivered')).toBeTruthy()
    expect(within(table).getByText('Bounced')).toBeTruthy()
    expect(within(table).getByText('Bounce: Permanent (General)')).toBeTruthy()
    // The summary above the table names the kind of failure, not just the text.
    expect(screen.getAllByText('Bounced').length).toBeGreaterThan(1)
  })

  it('accepts the new filters from the URL', async () => {
    routerState.query = { status: 'problem' }
    getDeliveryStats.mockResolvedValue(stats)
    listDeliveries.mockResolvedValue(page([]))
    renderWithProviders(<DeliveryPage />)
    await waitFor(() => expect(listDeliveries).toHaveBeenCalled())
    expect(listDeliveries.mock.calls[0][0]).toMatchObject({ status: 'problem' })
  })

  it('searches after a short pause and passes the filters from the URL', async () => {
    routerState.query = { channel: 'sms', status: 'failed', hours: '168' }
    getDeliveryStats.mockResolvedValue(stats)
    listDeliveries.mockResolvedValue(page([]))
    renderWithProviders(<DeliveryPage />)
    await waitFor(() => expect(listDeliveries).toHaveBeenCalled())
    expect(listDeliveries.mock.calls[0][0]).toMatchObject({ channel: 'sms', status: 'failed', page: 1 })
    expect(getDeliveryStats).toHaveBeenCalledWith(168)
    fireEvent.change(screen.getByLabelText('Exact email / phone, or subject'), { target: { value: 'tara@gmail.com' } })
    await waitFor(() => expect(listDeliveries.mock.calls.some(c => c[0].q === 'tara@gmail.com')).toBe(true))
  })

  it('tells the admin how to find one person when nothing matches a search', async () => {
    getDeliveryStats.mockResolvedValue(stats)
    listDeliveries.mockResolvedValue(page([]))
    renderWithProviders(<DeliveryPage />)
    fireEvent.change(await screen.findByLabelText('Exact email / phone, or subject'), { target: { value: 'nobody@x.com' } })
    expect(await screen.findByText(/type their exact email address or phone number/)).toBeTruthy()
  })

  it('shows a readable error', async () => {
    getDeliveryStats.mockResolvedValue(stats)
    listDeliveries.mockRejectedValue(new Error('Could not load the delivery log'))
    renderWithProviders(<DeliveryPage />)
    expect(await screen.findByText('Couldn’t load the delivery log')).toBeTruthy()
  })
})
