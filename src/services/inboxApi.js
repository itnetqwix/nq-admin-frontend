import { adminApi } from 'src/services/adminApi'

/** Unified support inbox (concerns, contact forms, product feedback, flagged chat). */
export async function listInbox({ queue = 'open', type, q, page = 1, pageSize = 30 } = {}) {
  const { data, meta } = await adminApi.raw('GET', '/admin/support/inbox', { query: { queue, type, q, page, pageSize } })
  return { items: data || [], total: meta?.total ?? 0, page: meta?.page ?? page, pageSize: meta?.pageSize ?? pageSize, capped: Boolean(meta?.capped) }
}
export const getInboxCounts = () => adminApi.get('/admin/support/counts')
export const getInboxItem = (type, id) => adminApi.get(`/admin/support/${encodeURIComponent(type)}/${encodeURIComponent(id)}`)
export const updateInboxItem = (type, id, changes) => adminApi.patch(`/admin/support/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, changes)
