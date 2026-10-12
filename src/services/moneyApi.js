import { adminApi } from 'src/services/adminApi'

/** Money & Finance workspace endpoints (new contract: { status, data, meta }). */
export const getFinanceOverview = days => adminApi.get('/admin/finance/overview', { query: { days } })
export const getConnectGaps = () => adminApi.get('/admin/finance/connect/gaps')

/** Returns { items, total, page, pageSize } plus `summary` (open count, exposure, win rate). */
export async function listDisputes({ state, q, page = 1, pageSize = 25 } = {}) {
  const { data, meta, requestId } = await adminApi.raw('GET', '/admin/finance/disputes', { query: { state, q, page, pageSize } })
  return { items: data || [], total: meta?.total ?? 0, page: meta?.page ?? page, pageSize: meta?.pageSize ?? pageSize, summary: meta?.summary || null, requestId }
}
export const getDispute = id => adminApi.get(`/admin/finance/disputes/${encodeURIComponent(id)}`)
export const addDisputeNote = (id, text) => adminApi.post(`/admin/finance/disputes/${encodeURIComponent(id)}/note`, { text })
export const backfillDisputes = dryRun => adminApi.post('/admin/finance/disputes/backfill', { dryRun })
