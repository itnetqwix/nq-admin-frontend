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

export const getUser360 = async userId => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-360/${userId}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load user details')
  return data?.result
}

const toQueryString = query => {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const str = params.toString()
  return str ? `?${str}` : ''
}

export const getUserLessons = async (userId, query = {}) => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-lessons/${userId}${toQueryString(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load lessons')
  return data?.result || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}

export const getUserReviews = async (userId, query = {}) => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-reviews/${userId}${toQueryString(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load reviews')
  return data?.result || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}

export const getUserAssets = async (userId, query = {}) => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-assets/${userId}${toQueryString(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load assets')
  return (
    data?.result || {
      clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
      reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
      savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
    }
  )
}

export const deleteAdminEntity = async ({ entityType, entityId, mode = 'soft', reason = '' }) => {
  const params = new URLSearchParams()
  if (mode) params.set('mode', mode)
  if (reason) params.set('reason', reason)
  const response = await fetch(apiUrl(`/admin/entity/${entityType}/${entityId}?${params.toString()}`), {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Delete failed')
  return data?.result
}

export const getAuditLogs = async (userId, query = {}) => {
  const q = { ...query }
  if (userId && userId !== 'undefined') q.userId = userId
  const response = await fetch(apiUrl(`/admin/audit-logs${toQueryString(q)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load audit logs')
  return data?.result || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}
