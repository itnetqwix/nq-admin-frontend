// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'src/test/renderWithProviders'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toast }))
vi.mock('next/link', () => ({ default: ({ children, href }) => <a href={href}>{children}</a> }))
vi.mock('src/@core/components/icon', () => ({ default: () => <span /> }))
const confirmFn = vi.hoisted(() => vi.fn())
vi.mock('src/components/admin', () => ({ useAdminConfirm: () => ({ confirm: confirmFn, ConfirmDialog: null }) }))
vi.mock('src/services/clipsAdminApi', () => ({
  getLibrarySubmissions: vi.fn(),
  getClipTaxonomyAdmin: vi.fn(),
  getClipPlayUrl: vi.fn(),
  approveLibrarySubmission: vi.fn(),
  rejectLibrarySubmission: vi.fn(),
  markLibrarySubmissionUnderReview: vi.fn()
}))

import { approveLibrarySubmission, getClipPlayUrl, getClipTaxonomyAdmin, getLibrarySubmissions, markLibrarySubmissionUnderReview, rejectLibrarySubmission } from 'src/services/clipsAdminApi'
import LibraryReviewPanel from './LibraryReviewPanel'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const sub = (id, over = {}) => ({
  _id: id, status: 'submitted', createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  source_clip_id: { _id: `clip-${id}`, title: `Clip ${id}` },
  requester_user_id: { fullname: 'Jane Coach', account_type: 'Trainer', email: 'jane@x.com' },
  proposed_category_id: { _id: 'cat1', name: 'Boxing' }, proposed_subcategory_id: { _id: 'sub1', name: 'Jab' }, ...over
})
const queue = (...items) => ({ items, pendingCount: items.length, underReviewCount: 0 })
const taxonomy = [{ id: 'cat1', name: 'Boxing', subcategories: [{ id: 'sub1', name: 'Jab' }] }, { id: 'cat2', name: 'Yoga', subcategories: [] }]

const setup = async (data = queue(sub('a'), sub('b')), { first = 'a', ready = true } = {}) => {
  getLibrarySubmissions.mockResolvedValue(data)
  getClipTaxonomyAdmin.mockResolvedValue(taxonomy)
  getClipPlayUrl.mockResolvedValue({ videoUrl: 'https://cdn/x.mp4', thumbnailUrl: 'https://cdn/x.jpg' })
  const onCountsChange = vi.fn()
  renderWithProviders(<LibraryReviewPanel onCountsChange={onCountsChange} />)
  await screen.findAllByText(`Clip ${first}`)
  // The placement is prefilled a moment after the request is shown; wait so a click is not swallowed by a disabled button.
  if (ready) await waitFor(() => expect(screen.getByRole('button', { name: 'Approve & publish' }).disabled).toBe(false))
  return { onCountsChange }
}

describe('LibraryReviewPanel', () => {
  it('shows the queue and the first request with its video, requester and suggested placement', async () => {
    const { onCountsChange } = await setup()
    const list = screen.getByRole('list', { name: 'Library requests' })
    expect(within(list).getAllByRole('button')).toHaveLength(2)
    await waitFor(() => expect(getClipPlayUrl).toHaveBeenCalledWith('clip-a'))
    expect(screen.getByText(/They suggested:/).parentElement.textContent).toContain('Boxing › Jab')
    expect(screen.getByText(/jane@x\.com/)).toBeTruthy()
    expect(onCountsChange).toHaveBeenCalledWith({ pending: 2, underReview: 0 })
  })

  it('approves with the suggested placement, then moves on to the next request', async () => {
    confirmFn.mockResolvedValue(true)
    approveLibrarySubmission.mockResolvedValue({})
    await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Approve & publish' }))
    await waitFor(() => expect(approveLibrarySubmission).toHaveBeenCalledWith('a', 'cat1', 'sub1'))
    expect(confirmFn.mock.calls[0][0].detail).toBe('Clip a → Boxing › Jab')
    // After the action the list reloads without it; stay in the flow.
    getLibrarySubmissions.mockResolvedValue(queue(sub('b')))
    await waitFor(() => expect(screen.getAllByText('Clip b').length).toBeGreaterThan(1)) // list row and the open request
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Published to the NetQwix Library'))
  })

  it('does nothing when the confirmation is declined', async () => {
    confirmFn.mockResolvedValue(false)
    await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Approve & publish' }))
    await waitFor(() => expect(confirmFn).toHaveBeenCalled())
    expect(approveLibrarySubmission).not.toHaveBeenCalled()
  })

  it('will not reject without a reason, and sends the reason when there is one', async () => {
    confirmFn.mockResolvedValue(true)
    rejectLibrarySubmission.mockResolvedValue({})
    await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Write the reason first — the person will see it'))
    expect(rejectLibrarySubmission).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('The video quality is too low for the public library.'))
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(rejectLibrarySubmission).toHaveBeenCalledWith('a', 'The video quality is too low for the public library.'))
  })

  it('lets the admin change the category before publishing', async () => {
    confirmFn.mockResolvedValue(true)
    approveLibrarySubmission.mockResolvedValue({})
    await setup()
    fireEvent.mouseDown(screen.getByLabelText('Category'))
    fireEvent.click(await screen.findByRole('option', { name: 'Yoga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Approve & publish' }))
    await waitFor(() => expect(approveLibrarySubmission).toHaveBeenCalledWith('a', 'cat2', null)) // subcategory reset
  })

  it('moves through the queue with J and K, and claims a request with U', async () => {
    markLibrarySubmissionUnderReview.mockResolvedValue({})
    await setup()
    fireEvent.keyDown(window, { key: 'j' })
    await waitFor(() => expect(getClipPlayUrl).toHaveBeenCalledWith('clip-b'))
    expect(screen.getAllByText('Clip b').length).toBeGreaterThan(0)
    fireEvent.keyDown(window, { key: 'k' })
    await waitFor(() => expect(getClipPlayUrl).toHaveBeenLastCalledWith('clip-a'))
    fireEvent.keyDown(window, { key: 'u' })
    await waitFor(() => expect(markLibrarySubmissionUnderReview).toHaveBeenCalledWith('a'))
  })

  it('ignores shortcuts typed into the reason box', async () => {
    await setup()
    const box = screen.getByLabelText(/Reason for rejecting/)
    fireEvent.keyDown(box, { key: 'a' })
    fireEvent.keyDown(box, { key: 'j' })
    expect(confirmFn).not.toHaveBeenCalled()
  })

  it('shows a finished request read-only, with its outcome', async () => {
    await setup(queue(sub('z', { status: 'rejected', rejection_reason: 'Too dark' })), { first: 'z', ready: false })
    expect(await screen.findByText('Rejected: Too dark')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve & publish' })).toBeNull()
  })

  it('says so when nothing is waiting, and when the list fails to load', async () => {
    getClipTaxonomyAdmin.mockResolvedValue(taxonomy)
    getLibrarySubmissions.mockResolvedValue(queue())
    const { unmount } = renderWithProviders(<LibraryReviewPanel />)
    expect(await screen.findByText('Nothing waiting for review')).toBeTruthy()
    unmount()
    getLibrarySubmissions.mockRejectedValue(new Error('Server unavailable'))
    renderWithProviders(<LibraryReviewPanel />)
    expect(await screen.findByText('Server unavailable')).toBeTruthy()
  })
})
