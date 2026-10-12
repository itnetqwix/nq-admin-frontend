// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { EntityDrawerContext } from 'src/features/entity-drawers/EntityDrawerContext'
import { renderWithProviders } from 'src/test/renderWithProviders'

const routerState = { query: {}, replace: vi.fn() }
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/apps/support', push: vi.fn(), isReady: true, ...routerState }) }))
// eslint-disable-next-line no-unused-vars
vi.mock('next/link', () => ({ default: ({ href, children, shallow, scroll, prefetch, ...rest }) => <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a> }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
vi.mock('src/hooks/useAuth', () => ({ useAuth: () => ({ user: { _id: 'me-1' } }), default: () => ({ user: { _id: 'me-1' } }) }))
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => true })) // desktop layout
vi.mock('src/layouts/components/AdminPageShell', () => ({
  default: ({ title, actions, children }) => (
    <section>
      <h1>{title}</h1>
      <div>{actions}</div>
      {children}
    </section>
  )
}))
vi.mock('src/services/inboxApi', () => ({ listInbox: vi.fn(), getInboxCounts: vi.fn(), getInboxItem: vi.fn(), updateInboxItem: vi.fn(), replyToInboxItem: vi.fn() }))

import toast from 'react-hot-toast'
import { getInboxCounts, getInboxItem, listInbox, replyToInboxItem, updateInboxItem } from 'src/services/inboxApi'
import InboxPage from './InboxPage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  routerState.query = {}
})

const ago = h => new Date(Date.now() - h * 3_600_000).toISOString()
const item = (over = {}) => ({
  id: 'c1', type: 'concern', subject: 'Coach never joined', preview: 'I waited 20 minutes', status: 'open', nativeStatus: 'open', priority: 'high',
  userId: 'u1', userName: 'Tia Trainee', userEmail: 'tia@x.com', assigneeId: null, bookingId: 'b1', createdAt: ago(30), lastActivityAt: ago(2), sla: 'breached', slaDueAt: ago(-1), ...over
})
const page = (items, total = items.length) => ({ items, total, page: 1, pageSize: 30, capped: false })
const detail = (over = {}) => ({
  item: item(), body: 'Coach never joined, I want a refund.',
  details: { reason: 'No show', refundRelated: 'yes', phone: null, company: null, pageUrl: null, appVersion: null, platform: null, flagType: null, reportedUserId: null },
  reporter: { id: 'u1', name: 'Tia Trainee', email: 'tia@x.com', accountType: 'Trainee', status: 'approved' },
  assignee: null, history: [{ status: 'open', note: null, at: ago(30), by: null }], notes: [{ id: 'n1', text: 'Checked their connection', at: ago(1), by: 'Admin Amy' }],
  replies: [], reply: { allowed: true, toMasked: 'ti***@x.com', reason: null },
  firstResponseAt: null, resolvedAt: null, ...over
})
const counts = { open: 12, mine: 3, unassigned: 9, sla: 4, resolved: 40, byType: {} }

const withProviders = (ui, ability) => (
  <AbilityContext.Provider value={ability}>
    <EntityDrawerContext.Provider value={{ current: null, open: vi.fn(), close: vi.fn(), hrefFor: () => '#' }}>{ui}</EntityDrawerContext.Provider>
  </AbilityContext.Provider>
)

describe('InboxPage list', () => {
  it('shows queues with counts, and rows with who, what type and how overdue', async () => {
    listInbox.mockResolvedValue(page([item(), item({ id: 'f1', type: 'feedback', subject: 'Idea · ios', preview: 'Add dark mode', priority: 'normal', sla: 'ok', userName: null, userEmail: null })]))
    getInboxCounts.mockResolvedValue(counts)
    renderWithProviders(withProviders(<InboxPage />, undefined))

    expect(await screen.findByText('Coach never joined')).toBeTruthy()
    const nav = screen.getByRole('navigation', { name: 'Inbox queues' })
    expect(await within(nav).findByText('12')).toBeTruthy()
    expect(within(nav).getByText('Needs attention')).toBeTruthy()
    expect(screen.getByText('Overdue')).toBeTruthy()
    expect(screen.getByText('Support request')).toBeTruthy()
    expect(screen.getByText('Feedback')).toBeTruthy()
    expect(screen.getByText('Unknown')).toBeTruthy() // anonymous feedback author
  })

  it('asks the API for the queue, type and page in the URL, and ignores junk values', async () => {
    routerState.query = { queue: 'mine', type: 'feedback', page: '2' }
    listInbox.mockResolvedValue(page([]))
    getInboxCounts.mockResolvedValue(counts)
    renderWithProviders(withProviders(<InboxPage />, undefined))
    await waitFor(() => expect(listInbox).toHaveBeenCalled())
    expect(listInbox.mock.calls[0][0]).toMatchObject({ queue: 'mine', type: 'feedback', page: 2, pageSize: 30 })
    cleanup()

    routerState.query = { queue: 'DROP', type: '<x>' }
    listInbox.mockClear()
    renderWithProviders(withProviders(<InboxPage />, undefined))
    await waitFor(() => expect(listInbox).toHaveBeenCalled())
    expect(listInbox.mock.calls[0][0]).toMatchObject({ queue: 'open', type: undefined })
  })

  it('switches queue through the URL', async () => {
    listInbox.mockResolvedValue(page([]))
    getInboxCounts.mockResolvedValue(counts)
    renderWithProviders(withProviders(<InboxPage />, undefined))
    fireEvent.click(await screen.findByRole('button', { name: /Unassigned/ }))
    expect(routerState.replace.mock.calls[0][0].query.queue).toBe('unassigned')
  })

  it('selects an item into the URL when a row is clicked', async () => {
    listInbox.mockResolvedValue(page([item()]))
    getInboxCounts.mockResolvedValue(counts)
    renderWithProviders(withProviders(<InboxPage />, undefined))
    fireEvent.click(await screen.findByText('Coach never joined'))
    expect(routerState.replace.mock.calls[0][0].query.item).toBe('concern:c1')
  })

  it('shows inbox zero and a readable error', async () => {
    listInbox.mockResolvedValue(page([]))
    getInboxCounts.mockResolvedValue(counts)
    const { unmount } = renderWithProviders(withProviders(<InboxPage />, undefined))
    expect(await screen.findByText('Inbox zero')).toBeTruthy()
    unmount()
    listInbox.mockRejectedValue(new Error('Could not load the inbox'))
    renderWithProviders(withProviders(<InboxPage />, undefined))
    expect(await screen.findByText('Couldn’t load the inbox')).toBeTruthy()
  })
})

describe('InboxPage detail', () => {
  const open = async ability => {
    routerState.query = { item: 'concern:c1' }
    listInbox.mockResolvedValue(page([item()]))
    getInboxCounts.mockResolvedValue(counts)
    getInboxItem.mockResolvedValue(detail())
    renderWithProviders(withProviders(<InboxPage />, ability))
    await screen.findByText('Coach never joined, I want a refund.')
  }

  it('shows the message, sender, notes, history and where to act', async () => {
    await open(undefined)
    expect(getInboxItem).toHaveBeenCalledWith('concern', 'c1')
    expect(screen.getByText('Checked their connection')).toBeTruthy()
    expect(screen.getByText(/no response yet/)).toBeTruthy()
    expect(screen.getByText('Urgent')).toBeTruthy()
    expect(screen.getByText('Open lesson →')).toBeTruthy()
    expect(screen.getByText('Refund or release payment →').getAttribute('href')).toBe('/apps/finance?sessionId=b1')
    expect(screen.getByText(/the person never sees them/)).toBeTruthy()
  })

  it('assigns to the signed-in admin', async () => {
    await open(undefined)
    updateInboxItem.mockResolvedValue({})
    fireEvent.click(screen.getByRole('button', { name: 'Assign to me' }))
    await waitFor(() => expect(updateInboxItem).toHaveBeenCalledWith('concern', 'c1', { assignee: 'me' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Saved'))
  })

  it('toggles urgency', async () => {
    await open(undefined)
    updateInboxItem.mockResolvedValue({})
    fireEvent.click(screen.getByRole('button', { name: 'Mark normal' }))
    await waitFor(() => expect(updateInboxItem).toHaveBeenCalledWith('concern', 'c1', { priority: 'normal' }))
  })

  it('adds a note, and can resolve with it; the buttons need real text', async () => {
    await open(undefined)
    updateInboxItem.mockResolvedValue({})
    const box = screen.getByLabelText('Add a note')
    const addNote = screen.getByRole('button', { name: 'Add note' })
    const addAndResolve = screen.getByRole('button', { name: 'Add note & resolve' })
    expect(addNote.disabled).toBe(true)
    expect(addAndResolve.disabled).toBe(true)
    fireEvent.change(box, { target: { value: 'Refunded the lesson' } })
    fireEvent.click(addAndResolve)
    await waitFor(() => expect(updateInboxItem).toHaveBeenCalledWith('concern', 'c1', { note: 'Refunded the lesson', status: 'resolved' }))
    await waitFor(() => expect(box.value).toBe(''))
  })

  it('shows the server error and keeps the typed note when saving fails', async () => {
    await open(undefined)
    updateInboxItem.mockRejectedValue(new Error('This action is disabled for your admin account'))
    const box = screen.getByLabelText('Add a note')
    fireEvent.change(box, { target: { value: 'My note text' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This action is disabled for your admin account'))
    expect(box.value).toBe('My note text')
  })

  it('hides every control from a role that cannot change tickets', async () => {
    await open({ can: () => false })
    expect(screen.queryByRole('button', { name: 'Assign to me' })).toBeNull()
    expect(screen.queryByLabelText('Add a note')).toBeNull()
    expect(screen.getByText(/your role can’t change it/)).toBeTruthy()
    // They can still read everything.
    expect(screen.getByText('Checked their connection')).toBeTruthy()
  })

  it('sends a reply to the person, naming where it goes, and clears the box', async () => {
    replyToInboxItem.mockResolvedValue({ sent: true, to: 'ti***@x.com', subject: 'Re: x' })
    await open(undefined)
    expect(screen.getByText(/Goes to ti\*\*\*@x\.com/)).toBeTruthy()
    const send = screen.getByRole('button', { name: 'Send reply' })
    expect(send.disabled).toBe(true) // nothing written yet
    fireEvent.change(screen.getByLabelText('Reply by email'), { target: { value: '  We refunded you.  ' } })
    fireEvent.click(send)
    await waitFor(() => expect(replyToInboxItem).toHaveBeenCalledWith('concern', 'c1', 'We refunded you.'))
    await waitFor(() => expect(screen.getByLabelText('Reply by email').value).toBe(''))
  })

  it('shows the thread, including an attempt that did not go out', async () => {
    routerState.query = { item: 'concern:c1' }
    listInbox.mockResolvedValue(page([item()]))
    getInboxCounts.mockResolvedValue(counts)
    getInboxItem.mockResolvedValue(
      detail({ replies: [{ id: 'r1', text: 'We refunded you.', at: ago(1), outcome: 'sent', toMasked: 'ti***@x.com', by: 'Sam' }, { id: 'r2', text: 'Second try', at: ago(0.5), outcome: 'failed', error: 'Mailbox unavailable', by: 'Sam' }] })
    )
    renderWithProviders(withProviders(<InboxPage />, undefined))
    expect(await screen.findByText('We refunded you.')).toBeTruthy()
    expect(screen.getByText(/Emailed to ti\*\*\*@x\.com/)).toBeTruthy()
    expect(screen.getByText(/Not sent \(Mailbox unavailable\)/)).toBeTruthy()
  })

  it('explains why an item cannot be answered instead of showing a reply box', async () => {
    routerState.query = { item: 'feedback:f1' }
    listInbox.mockResolvedValue(page([]))
    getInboxCounts.mockResolvedValue(counts)
    getInboxItem.mockResolvedValue(detail({ item: item({ id: 'f1', type: 'feedback', bookingId: null, sla: null }), reporter: null, reply: { allowed: false, toMasked: null, reason: 'This feedback was sent anonymously.' } }))
    renderWithProviders(withProviders(<InboxPage />, undefined))
    expect(await screen.findByText('This feedback was sent anonymously.')).toBeTruthy()
    expect(screen.queryByLabelText('Reply by email')).toBeNull()
  })

  it('does not offer "resolve" for feedback, which has no such state', async () => {
    routerState.query = { item: 'feedback:f1' }
    listInbox.mockResolvedValue(page([]))
    getInboxCounts.mockResolvedValue(counts)
    getInboxItem.mockResolvedValue(detail({ item: item({ id: 'f1', type: 'feedback', bookingId: null, sla: null }), reporter: null }))
    renderWithProviders(withProviders(<InboxPage />, undefined))
    await screen.findByText('Coach never joined, I want a refund.')
    expect(screen.queryByRole('button', { name: 'Add note & resolve' })).toBeNull()
    expect(screen.getByText('Not signed in')).toBeTruthy()
  })

  it('shows a readable error when the item is gone', async () => {
    routerState.query = { item: 'concern:gone' }
    listInbox.mockResolvedValue(page([]))
    getInboxCounts.mockResolvedValue(counts)
    getInboxItem.mockRejectedValue(Object.assign(new Error('Item not found'), { status: 404, requestId: 'req-8' }))
    renderWithProviders(withProviders(<InboxPage />, undefined))
    expect(await screen.findByText('Couldn’t load this')).toBeTruthy()
    expect(screen.getByText(/request req-8/)).toBeTruthy()
  })
})
