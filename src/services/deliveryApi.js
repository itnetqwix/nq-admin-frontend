import { adminApi } from 'src/services/adminApi'

export const getDeliveryStats = hours => adminApi.get('/admin/delivery/stats', { query: { hours } })
export async function listDeliveries({ channel, status, q, page = 1, pageSize = 30 } = {}) {
  const { data, meta } = await adminApi.raw('GET', '/admin/delivery', { query: { channel, status, q, page, pageSize } })
  return { items: data || [], total: meta?.total ?? 0, page: meta?.page ?? page, pageSize: meta?.pageSize ?? pageSize }
}
