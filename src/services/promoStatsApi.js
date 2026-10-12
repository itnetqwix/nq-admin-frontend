import { adminApi } from 'src/services/adminApi'

/** Results for one promo code: uses, discount cost, revenue. */
export const getPromoCodeStats = id => adminApi.get(`/admin/promo-codes/${encodeURIComponent(id)}/stats`)
