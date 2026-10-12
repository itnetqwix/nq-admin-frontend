import { describe, expect, it } from 'vitest'
import { approveBlocker, canModerate, initialPlacement, nextAfter, placementLabel, queueItem, requesterLabel, shortcutFor, step } from './libraryReviewView'

const items = ['a', 'b', 'c'].map(id => ({ id }))

describe('navigation', () => {
  it('moves through the queue and stops at the ends', () => {
    expect(step(items, 'a', 1)).toBe('b')
    expect(step(items, 'c', 1)).toBe('c')
    expect(step(items, 'a', -1)).toBe('a')
    expect(step(items, 'zzz', 1)).toBe('a')
    expect(step([], 'a', 1)).toBeNull()
  })
  it('lands on the next row after acting, else the previous, else nothing', () => {
    expect(nextAfter(items, 'a')).toBe('b')
    expect(nextAfter(items, 'c')).toBe('b')
    expect(nextAfter([{ id: 'a' }], 'a')).toBeNull()
    expect(nextAfter(items, 'gone')).toBe('a')
    expect(nextAfter([], 'x')).toBeNull()
  })
})

describe('shortcutFor', () => {
  const key = (k, extra = {}) => ({ key: k, target: { tagName: 'DIV' }, ...extra })
  it('maps letters to actions', () => {
    expect([key('j'), key('K'), key('a'), key('r'), key('u'), key('x')].map(shortcutFor)).toEqual(['next', 'prev', 'approve', 'reject', 'review', null])
  })
  it('ignores typing in a field and modifier combinations', () => {
    expect(shortcutFor(key('a', { target: { tagName: 'TEXTAREA' } }))).toBeNull()
    expect(shortcutFor(key('r', { target: { tagName: 'INPUT' } }))).toBeNull()
    expect(shortcutFor(key('a', { target: { tagName: 'DIV', isContentEditable: true } }))).toBeNull()
    expect(shortcutFor(key('r', { metaKey: true }))).toBeNull() // Cmd+R reloads the page
    expect(shortcutFor(key('a', { ctrlKey: true }))).toBeNull()
  })
})

describe('labels', () => {
  it('describes people and placement', () => {
    expect(requesterLabel({ fullname: 'Jane', account_type: 'Trainer' })).toBe('Jane · Trainer')
    expect(requesterLabel({ email: 'j@x.com' })).toBe('j@x.com')
    expect(requesterLabel(null)).toBe('Unknown')
    expect(placementLabel({ proposed_category_id: { name: 'Boxing' }, proposed_subcategory_id: { name: 'Jab' } })).toBe('Boxing › Jab')
    expect(placementLabel({ proposed_category_id: { name: 'Boxing' } })).toBe('Boxing')
    expect(placementLabel({})).toBeNull()
  })
  it('builds a queue entry', () => {
    const now = Date.parse('2026-10-12T12:00:00Z')
    const q = queueItem({ _id: 's1', status: 'submitted', createdAt: '2026-10-12T10:00:00Z', source_clip_id: { title: 'Jab drill' }, requester_user_id: { fullname: 'Jane', account_type: 'Trainer' }, proposed_category_id: { name: 'Boxing' } }, now)
    expect(q).toMatchObject({ id: 's1', title: 'Jab drill', requester: 'Jane · Trainer', proposed: 'Boxing', status: 'submitted' })
    expect(queueItem({ _id: 's2', createdAt: now }, now).title).toBe('Untitled clip')
  })
})

describe('moderation rules', () => {
  it('only open requests can be acted on', () => {
    expect(['submitted', 'under_review'].every(canModerate)).toBe(true)
    expect(['accepted', 'rejected', undefined].some(canModerate)).toBe(false)
  })
  it('starts from the proposed placement, populated or bare ids', () => {
    expect(initialPlacement({ proposed_category_id: { _id: 'c1' }, proposed_subcategory_id: 's1' })).toEqual({ categoryId: 'c1', subcategoryId: 's1' })
    expect(initialPlacement(undefined)).toEqual({ categoryId: '', subcategoryId: '' })
  })
  it('says why approve is not possible', () => {
    expect(approveBlocker(undefined, 'c')).toMatch(/Pick a request/)
    expect(approveBlocker({ status: 'accepted' }, 'c')).toMatch(/already been handled/)
    expect(approveBlocker({ status: 'submitted' }, '')).toMatch(/Choose a category/)
    expect(approveBlocker({ status: 'submitted' }, 'c')).toBeNull()
  })
})
