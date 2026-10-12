import { timeAgo } from 'src/utils/format'

export const QUEUE_TABS = [
  { value: '', label: 'Needs review' },
  { value: 'submitted', label: 'New' },
  { value: 'under_review', label: 'In review' },
  { value: 'accepted', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'Everything' }
]

export const STATUS_META = {
  submitted: { label: 'New', tone: 'warning' },
  under_review: { label: 'In review', tone: 'info' },
  accepted: { label: 'Published', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' }
}

/** Reasons admins give most; one click fills the box and they can still edit it. The user sees this text. */
export const QUICK_REASONS = [
  'The video is too short or unclear to teach from.',
  'This does not match the category you chose.',
  'The video quality is too low for the public library.',
  'The video shows personal details or contact information.'
]

export const canModerate = status => status === 'submitted' || status === 'under_review'

export function requesterLabel(user) {
  if (!user) return 'Unknown'
  const name = user.fullname || user.email || 'User'
  return user.account_type ? `${name} · ${user.account_type}` : name
}

export function placementLabel(sub, which = 'proposed') {
  const cat = sub?.[`${which}_category_id`]?.name
  const subcat = sub?.[`${which}_subcategory_id`]?.name
  if (cat && subcat) return `${cat} › ${subcat}`
  return cat || subcat || null
}

const idOf = v => (v && typeof v === 'object' ? v._id || v.id : v) || ''

/** One queue entry from an API submission. */
export function queueItem(sub, now = Date.now()) {
  return {
    id: String(sub._id),
    title: sub.source_clip_id?.title || 'Untitled clip',
    requester: requesterLabel(sub.requester_user_id),
    proposed: placementLabel(sub),
    status: sub.status,
    age: timeAgo(sub.createdAt, now),
    raw: sub
  }
}

/** Where to land after acting on `currentId`: the next row, else the previous, else nothing. */
export function nextAfter(items, currentId) {
  const i = items.findIndex(x => x.id === currentId)
  if (i === -1) return items[0]?.id ?? null
  return items[i + 1]?.id ?? items[i - 1]?.id ?? null
}

/** J / K move through the queue; clamps at the ends. */
export function step(items, currentId, dir) {
  if (!items.length) return null
  const i = items.findIndex(x => x.id === currentId)
  if (i === -1) return items[0].id
  return items[Math.min(items.length - 1, Math.max(0, i + dir))].id
}

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** Keyboard shortcut -> action name, ignoring keystrokes meant for a field or combined with a modifier. */
export function shortcutFor(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return null
  const t = e.target
  if (t && (TYPING.has(t.tagName) || t.isContentEditable)) return null
  switch (String(e.key).toLowerCase()) {
    case 'j': return 'next'
    case 'k': return 'prev'
    case 'a': return 'approve'
    case 'r': return 'reject'
    case 'u': return 'review'
    default: return null
  }
}

/** Starting placement for the form: what the person proposed, which the admin may change. */
export function initialPlacement(sub) {
  return { categoryId: String(idOf(sub?.proposed_category_id) || ''), subcategoryId: String(idOf(sub?.proposed_subcategory_id) || '') }
}

/** Why approve is not available yet, or null when it is. */
export function approveBlocker(sub, categoryId) {
  if (!sub) return 'Pick a request first.'
  if (!canModerate(sub.status)) return 'This request has already been handled.'
  if (!categoryId) return 'Choose a category for the library.'
  return null
}
