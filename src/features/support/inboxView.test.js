import { describe, expect, it } from 'vitest'
import { assignmentAction, changesFor, QUEUE_VALUES, relatedLinks, slaPill, statusOptionsFor, TYPE_VALUES } from './inboxView'

describe('queues and types', () => {
  it('matches what the API accepts', () => {
    expect(QUEUE_VALUES).toEqual(['open', 'mine', 'unassigned', 'sla', 'resolved', 'all'])
    expect(TYPE_VALUES).toEqual(['concern', 'contact', 'feedback', 'chat_flag'])
  })
})

describe('slaPill', () => {
  it('shows overdue and due-soon, nothing otherwise', () => {
    expect(slaPill({ sla: 'breached' })).toEqual({ tone: 'danger', label: 'Overdue' })
    expect(slaPill({ sla: 'at_risk' })).toEqual({ tone: 'warning', label: 'Due soon' })
    expect(slaPill({ sla: 'ok' })).toBeNull()
    expect(slaPill({ sla: null })).toBeNull()
    expect(slaPill(null)).toBeNull()
  })
})

describe('statusOptionsFor', () => {
  it('does not offer resolved for feedback, which has no such state', () => {
    expect(statusOptionsFor('feedback').map(s => s.value)).toEqual(['open', 'in_progress', 'closed'])
    expect(statusOptionsFor('concern').map(s => s.value)).toEqual(['open', 'in_progress', 'resolved', 'closed'])
  })
})

describe('assignmentAction', () => {
  it('offers the right move for who holds the item', () => {
    expect(assignmentAction({ assigneeId: null }, 'me').kind).toBe('assign')
    expect(assignmentAction({ assigneeId: 'me' }, 'me').kind).toBe('unassign')
    expect(assignmentAction({ assigneeId: 'sam' }, 'me').kind).toBe('takeover')
  })
})

describe('relatedLinks', () => {
  it('links the person, the lesson and the money only when they exist', () => {
    const links = relatedLinks({ item: { bookingId: 'b1' }, details: { reportedUserId: 'r1' }, reporter: { id: 'u1', name: 'Tia' } })
    expect(links.map(l => l.key)).toEqual(['user', 'lesson', 'finance', 'reported'])
    expect(links[0]).toMatchObject({ label: 'Open Tia', drawer: { type: 'user', id: 'u1' } })
    expect(links[2].href).toBe('/apps/finance?sessionId=b1')
  })
  it('is empty for a guest enquiry with nothing attached', () => {
    expect(relatedLinks({ item: {}, details: {}, reporter: null })).toEqual([])
    expect(relatedLinks(null)).toEqual([])
  })
})

describe('changesFor', () => {
  const item = { status: 'open', priority: 'normal' }
  it('keeps only what changed', () => {
    expect(changesFor(item, { status: 'resolved', priority: 'normal' })).toEqual({ status: 'resolved' })
    expect(changesFor(item, { status: 'open', priority: 'high' })).toEqual({ priority: 'high' })
    expect(changesFor(item, { status: 'open', priority: 'normal' })).toEqual({})
    expect(changesFor(item, {})).toEqual({})
  })
})
