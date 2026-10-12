/**
 * Entity drawers are addressed as `?drawer=<type>:<id>` so any id, anywhere, can be a link and the
 * browser Back button closes the drawer.
 */
export const DRAWER_QUERY_KEY = 'drawer'

const TYPE_RE = /^[a-z][a-z0-9-]{1,23}$/
// Ids are ObjectIds, Stripe ids (pi_…), Sentry short ids (NETQWIX-API-1A) or similar tokens.
const ID_RE = /^[A-Za-z0-9._\-@:]{1,128}$/

/** 'lesson:64b…' -> { type: 'lesson', id: '64b…' }, or null when it is not a valid drawer param. */
export function parseDrawerParam(value) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  const i = raw.indexOf(':')
  if (i < 1) return null
  const type = raw.slice(0, i)
  const id = raw.slice(i + 1)
  if (!TYPE_RE.test(type) || !ID_RE.test(id)) return null
  return { type, id }
}

export function formatDrawerParam(type, id) {
  return `${type}:${id}`
}

/** Same page, same filters, plus the drawer. Pass null to produce the URL with the drawer closed. */
export function withDrawerQuery(query, drawer) {
  const next = { ...query }
  delete next[DRAWER_QUERY_KEY]
  if (drawer) next[DRAWER_QUERY_KEY] = formatDrawerParam(drawer.type, drawer.id)
  return next
}
