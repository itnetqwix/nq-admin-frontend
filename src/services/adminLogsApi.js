import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const getAuthHeaders = () => {
  const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

const apiUrl = path => `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

const toQuery = (query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const s = params.toString()
  return s ? `?${s}` : ''
}

const parse = async res => {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/csv')) {
    const text = await res.text()
    if (!res.ok) throw new Error('Export failed')
    return text
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (res.status === 404) {
    throw new Error(
      'This admin API route is missing on the server. Redeploy nq-backend (logs / roles endpoints).'
    )
  }
  if (!res.ok || String(data?.status).toLowerCase() === 'fail') {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`)
  }
  return data?.data ?? data?.result ?? data
}

export async function getDashboardSummary() {
  const res = await fetch(apiUrl('/admin/dashboard/summary'), { headers: getAuthHeaders() })
  return parse(res)
}

export async function getApiLogs(query = {}) {
  const res = await fetch(apiUrl(`/admin/logs/api${toQuery(query)}`), { headers: getAuthHeaders() })
  return parse(res)
}

export async function getSecurityLogs(query = {}) {
  const res = await fetch(apiUrl(`/admin/logs/security${toQuery(query)}`), { headers: getAuthHeaders() })
  return parse(res)
}

export async function getNotificationLogs(query = {}) {
  const res = await fetch(apiUrl(`/admin/logs/notifications${toQuery(query)}`), {
    headers: getAuthHeaders()
  })
  return parse(res)
}

export async function getFileLogs(query = {}) {
  const res = await fetch(apiUrl(`/admin/logs/files${toQuery(query)}`), { headers: getAuthHeaders() })
  return parse(res)
}

export async function getLoginHistory(query = {}) {
  const res = await fetch(apiUrl(`/admin/logs/login-history${toQuery(query)}`), {
    headers: getAuthHeaders()
  })
  return parse(res)
}

export async function exportLogs(kind = 'activity', limit = 500, filters = {}) {
  const res = await fetch(apiUrl('/admin/logs/export'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ kind, limit, filters })
  })
  const csv = await parse(res)
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `logs-${kind}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function getRolesMatrix() {
  const res = await fetch(apiUrl('/admin/roles/matrix'), { headers: getAuthHeaders() })
  return parse(res)
}

export async function listAdminRoles() {
  const res = await fetch(apiUrl('/admin/roles/admins'), { headers: getAuthHeaders() })
  return parse(res)
}

export async function assignAdminRole(userId, admin_role) {
  const res = await fetch(apiUrl(`/admin/roles/admins/${userId}`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ admin_role })
  })
  return parse(res)
}

export async function updateAdminPermissions(userId, permissions) {
  const res = await fetch(apiUrl(`/admin/roles/admins/${userId}/permissions`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissions })
  })
  return parse(res)
}

export async function createCustomRole({ name, label, permissions }) {
  const res = await fetch(apiUrl('/admin/roles/custom'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, label, permissions })
  })
  return parse(res)
}

export async function updateCustomRole(name, { label, permissions, push_to_assigned = true }) {
  const res = await fetch(apiUrl(`/admin/roles/custom/${encodeURIComponent(name)}`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ label, permissions, push_to_assigned })
  })
  return parse(res)
}

export async function deleteCustomRole(name) {
  const res = await fetch(apiUrl(`/admin/roles/custom/${encodeURIComponent(name)}`), {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return parse(res)
}

export async function getAdminNavPreferences() {
  const res = await fetch(apiUrl('/admin/me/preferences'), { headers: getAuthHeaders() })
  return parse(res)
}

export async function putAdminNavPreferences(nav_favorites) {
  const res = await fetch(apiUrl('/admin/me/preferences'), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nav_favorites })
  })
  return parse(res)
}
