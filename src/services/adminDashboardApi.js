import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
})

const apiUrl = path => `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

/** Strip ResponseBuilder wrapper fields from `result` payloads. */
export function unwrapAdminResult(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload
  }
  const { message, status, msg, ...rest } = payload
  return rest
}

export async function fetchDashboardMetrics() {
  const res = await fetch(apiUrl('/admin/dashboard-metrics'), { headers: authHeaders() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error || json?.message || 'Failed to load dashboard metrics')
  }
  return unwrapAdminResult(json?.result) || null
}

export async function fetchGlobalCommission() {
  const res = await fetch(apiUrl('/admin/get-global-commission'), { headers: authHeaders() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error || json?.message || 'Failed to load commission')
  }
  const result = json?.result
  if (Array.isArray(result)) {
    return result.filter(item => item && typeof item === 'object' && item._id != null)
  }
  return []
}

export async function fetchOnlineUsers() {
  const res = await fetch(apiUrl('/admin/online-users'), { headers: authHeaders() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.error || json?.message || 'Failed to load online users')
  }
  const payload = unwrapAdminResult(json?.result) || json?.result
  return Array.isArray(payload?.users) ? payload.users : []
}
