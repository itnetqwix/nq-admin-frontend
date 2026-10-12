import { timeAgo } from 'src/utils/format'

export const QUEUES = [
  { value: 'open', label: 'Open', icon: 'mdi:inbox-outline' },
  { value: 'mine', label: 'Assigned to me', icon: 'mdi:account-check-outline' },
  { value: 'unassigned', label: 'Unassigned', icon: 'mdi:account-question-outline' },
  { value: 'sla', label: 'Needs attention', icon: 'mdi:timer-alert-outline' },
  { value: 'resolved', label: 'Resolved', icon: 'mdi:check-all' },
  { value: 'all', label: 'Everything', icon: 'mdi:format-list-bulleted' }
]
export const QUEUE_VALUES = QUEUES.map(q => q.value)

export const TYPES = [
  { value: '', label: 'All types' },
  { value: 'concern', label: 'Support requests' },
  { value: 'contact', label: 'Contact forms' },
  { value: 'feedback', label: 'Product feedback' },
  { value: 'chat_flag', label: 'Flagged chat' }
]
export const TYPE_LABEL = { concern: 'Support request', contact: 'Contact form', feedback: 'Feedback', chat_flag: 'Flagged chat' }
export const TYPE_VALUES = TYPES.map(t => t.value).filter(Boolean)

export const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
]
export const STATUS_TONE = { open: 'info', in_progress: 'warning', resolved: 'success', closed: 'neutral' }
export const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]))

/** What to show for an item's SLA: nothing once handled, otherwise how it stands. */
export function slaPill(item) {
  if (!item || item.sla === null || item.sla === undefined) return null
  if (item.sla === 'breached') return { tone: 'danger', label: 'Overdue' }
  if (item.sla === 'at_risk') return { tone: 'warning', label: 'Due soon' }
  return null
}

/** Handled feedback has no "resolved": it folds into closed, so don't offer a choice that won't stick. */
export function statusOptionsFor(type) {
  return type === 'feedback' ? STATUS_OPTIONS.filter(s => s.value !== 'resolved') : STATUS_OPTIONS
}

export function ageLabel(item, now = Date.now()) {
  return timeAgo(item.createdAt, now)
}

/** "Assign to me" / "Unassign" / "Assigned to Sam" depending on who holds it. */
export function assignmentAction(item, meId) {
  if (!item.assigneeId) return { kind: 'assign', label: 'Assign to me' }
  if (String(item.assigneeId) === String(meId)) return { kind: 'unassign', label: 'Unassign' }
  return { kind: 'takeover', label: 'Take over' }
}

/** Only these links are shown for an item, and only when the data exists to make them. */
export function relatedLinks(detail) {
  if (!detail) return []
  const links = []
  const { item, details, reporter } = detail
  if (reporter?.id) links.push({ key: 'user', label: `Open ${reporter.name || 'user'}`, drawer: { type: 'user', id: reporter.id } })
  if (item.bookingId) {
    links.push({ key: 'lesson', label: 'Open lesson', drawer: { type: 'lesson', id: item.bookingId } })
    links.push({ key: 'finance', label: 'Refund or release payment', href: `/apps/finance?sessionId=${item.bookingId}` })
  }
  if (details?.reportedUserId) links.push({ key: 'reported', label: 'Open reported user', drawer: { type: 'user', id: details.reportedUserId } })
  return links
}

/** Build the partial update for the controls; drops anything that did not change. */
export function changesFor(item, { status, priority }) {
  const out = {}
  if (status && status !== item.status) out.status = status
  if (priority && priority !== item.priority) out.priority = priority
  return out
}
