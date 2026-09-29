import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
})

const api = path => `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

async function request(path, init = {}) {
  const res = await fetch(api(path), { ...init, headers: headers() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || String(data?.status || '').toLowerCase() === 'fail') {
    throw new Error(data?.error || data?.message || 'Request failed')
  }
  return data?.data ?? data
}

export const fetchKpis = days => request(`/admin/kpis?days=${encodeURIComponent(days)}`)

export const fetchPackageCredits = ({ status = '', page = 1, limit = 25 } = {}) =>
  request(`/admin/package-credits?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`)

export const refundPackageCredit = id =>
  request(`/admin/package-credits/${encodeURIComponent(id)}/refund`, { method: 'POST' })

export const fetchFeatureFlags = () => request('/admin/feature-flags')

export const saveFeatureFlag = flag =>
  request(`/admin/feature-flags/${encodeURIComponent(flag.key)}`, {
    method: 'PUT',
    body: JSON.stringify(flag)
  })

export const deleteFeatureFlag = key =>
  request(`/admin/feature-flags/${encodeURIComponent(key)}`, { method: 'DELETE' })
