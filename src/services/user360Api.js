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

const isApiFailure = (data, response) =>
  !response.ok || String(data?.status ?? '').toLowerCase() === 'fail'

const readError = data => {
  const e = data?.error
  if (typeof e === 'string') return e
  if (e?.message) return String(e.message)
  try {
    if (e != null) return JSON.stringify(e)
  } catch (_) {
    /* ignore */
  }
  return 'Request failed'
}

/** Handles occasional double-wrapped `result.result` payloads. */
const unwrap = data => {
  let r = data?.result
  if (r && typeof r === 'object' && r.result != null && r.user == null && typeof r.result === 'object') {
    return r.result
  }
  return r
}

const toQueryString = query => {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const str = params.toString()
  return str ? `?${str}` : ''
}

export const getUser360 = async userId => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-360/${userId}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return unwrap(data)
}

export const getUserLessons = async (userId, query = {}) => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-lessons/${userId}${toQueryString(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return unwrap(data) || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}

export const getUserReviews = async (userId, query = {}) => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-reviews/${userId}${toQueryString(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return unwrap(data) || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}

export const getUserAssets = async (userId, query = {}) => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-assets/${userId}${toQueryString(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return (
    unwrap(data) || {
      clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
      reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
      savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
    }
  )
}

export const getUserTimeline = async (userId, query = {}) => {
  if (!userId || userId === 'undefined') throw new Error('Invalid user id')
  const response = await fetch(apiUrl(`/admin/user-timeline/${userId}${toQueryString(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return unwrap(data) || { items: [], pagination: { page: 1, limit: 30, total: 0 } }
}

export const getClipPlayUrl = async clipId => {
  if (!clipId || clipId === 'undefined') throw new Error('Invalid clip id')
  const response = await fetch(apiUrl(`/admin/clip-play-url/${clipId}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return unwrap(data) || {}
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
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return unwrap(data)
}

export const getAuditLogs = async (userId, query = {}) => {
  const q = { ...query }
  if (userId && userId !== 'undefined') q.userId = userId
  const response = await fetch(apiUrl(`/admin/audit-logs${toQueryString(q)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (isApiFailure(data, response)) throw new Error(readError(data))
  return unwrap(data) || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}
