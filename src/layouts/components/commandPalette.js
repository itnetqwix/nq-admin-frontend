import { sentryIssuesUrl } from 'src/configs/observability'

/**
 * Pure logic behind the ⌘K palette. The component only renders `items` and runs the `action` of
 * the one the admin picks, so everything that decides *what* appears is testable here.
 *
 * action: { type: 'path', path } | { type: 'drawer', drawerType, id } | { type: 'external', url }
 */

/** Flatten the sidebar into jump targets, keeping only pages this admin may open. */
export function pagesFromNav(navItems, can = () => true) {
  const out = []
  const walk = (items, group) => {
    for (const item of items || []) {
      if (item.children) walk(item.children, item.title)
      else if (item.path && can(item.action || 'read', item.subject)) out.push({ label: item.title, path: item.path, group })
    }
  }
  walk(navItems, null)
  return out
}

/** Handy destinations that are tabs of a page rather than sidebar entries. */
export const EXTRA_PAGES = [
  { label: 'Failed jobs', path: '/apps/ops?tab=jobs', subject: 'admin-nav-ops-logs', group: 'System' },
  { label: 'Call diagnostics', path: '/apps/ops?tab=calls', subject: 'admin-nav-ops-logs', group: 'System' },
  { label: 'Open disputes', path: '/apps/finance?tab=escrow&escrowStatus=disputed', subject: 'admin-nav-finance', group: 'Money' },
  { label: 'Pending refunds', path: '/apps/finance?tab=refunds', subject: 'admin-nav-finance', group: 'Money' }
]

export function extraPages(can = () => true) {
  return EXTRA_PAGES.filter(p => can('read', p.subject)).map(({ label, path, group }) => ({ label, path, group }))
}

const matches = (page, q) => page.label.toLowerCase().includes(q) || page.path.toLowerCase().includes(q)

/**
 * @param query   what the admin typed
 * @param pages   result of pagesFromNav + extraPages
 * @param search  response of GET /admin/search ({ users, bookings, sentry }) or null while loading
 */
export function buildPaletteItems({ query, pages = [], search = null }) {
  const raw = String(query || '').trim()
  if (!raw) return pages.slice(0, 8).map(p => pageItem(p))

  if (raw.startsWith('/')) {
    return [{ key: `path:${raw}`, group: 'Go to path', label: raw, secondary: 'Open this address', action: { type: 'path', path: raw } }]
  }

  const q = raw.toLowerCase()
  const items = []

  for (const u of search?.users || []) {
    items.push({
      key: `user:${u.id}`,
      group: 'People',
      label: u.name || u.email || u.id,
      secondary: [u.accountType, u.email, u.status].filter(Boolean).join(' · '),
      action: { type: 'drawer', drawerType: 'user', id: u.id }
    })
  }
  for (const b of search?.bookings || []) {
    const who = [b.trainer?.name, b.trainee?.name].filter(Boolean).join(' with ')
    items.push({
      key: `lesson:${b.id}`,
      group: 'Lessons & payments',
      label: who || `Booking ${b.id}`,
      secondary: [b.status, b.paymentIntentId, b.id].filter(Boolean).join(' · '),
      action: { type: 'drawer', drawerType: 'lesson', id: b.id }
    })
  }
  for (const s of search?.sentry || []) {
    const url = sentryIssuesUrl({ query: s.shortId })
    if (url) {
      items.push({ key: `sentry:${s.shortId}`, group: 'Errors', label: s.shortId, secondary: 'Open in Sentry', action: { type: 'external', url } })
    }
  }
  for (const p of pages.filter(p => matches(p, q)).slice(0, 6)) items.push(pageItem(p))
  return items
}

function pageItem(p) {
  return {
    key: `page:${p.path}`,
    group: p.group ? `Pages · ${p.group}` : 'Pages',
    label: p.label,
    secondary: p.path,
    action: { type: 'path', path: p.path }
  }
}

/** Arrow-key movement that wraps, and stays 0 for an empty list. */
export function moveIndex(current, delta, length) {
  if (length <= 0) return 0
  return (current + delta + length) % length
}
