/**
 * Shared helpers for admin paginated list API responses.
 * Shape: { items, total, page, limit, counts? }
 */
import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

export const adminAuthHeaders = (json = true) => {
  const h = {
    Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
  }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

export const adminApiUrl = path =>
  `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

export function toQueryString(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    qs.set(k, String(v))
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export async function fetchAdminList(path, params = {}) {
  const res = await fetch(adminApiUrl(`${path}${toQueryString(params)}`), {
    headers: adminAuthHeaders(false)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || String(data?.status || '').toLowerCase() === 'fail') {
    throw new Error(data?.error || data?.message || 'Failed to load list')
  }
  const payload = data?.data ?? data
  return {
    items: (payload.items || []).map(row => ({ ...row, id: row._id || row.id })),
    total: Number(payload.total) || 0,
    page: Number(payload.page) || Number(params.page) || 1,
    limit: Number(payload.limit) || Number(params.limit) || 25,
    counts: payload.counts || null,
    total_pages: payload.total_pages || null
  }
}

/** Initial state for a paginated admin list slice */
export function createListState(extra = {}) {
  return {
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    search: '',
    filters: {},
    counts: null,
    loading: false,
    error: null,
    fetchedAt: null,
    ...extra
  }
}
