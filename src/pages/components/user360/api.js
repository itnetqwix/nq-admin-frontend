import authConfig from 'src/configs/auth'

const getAuthHeaders = () => {
  const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

export const getUser360 = async userId => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user-360/${userId}`, {
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
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user-lessons/${userId}${toQueryString(query)}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load lessons')
  return data?.result || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}

export const getUserReviews = async (userId, query = {}) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user-reviews/${userId}${toQueryString(query)}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load reviews')
  return data?.result || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}

export const getUserAssets = async (userId, query = {}) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user-assets/${userId}${toQueryString(query)}`, {
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
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/entity/${entityType}/${entityId}?${params.toString()}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    }
  )
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Delete failed')
  return data?.result
}

export const getAuditLogs = async (userId, query = {}) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/audit-logs${toQueryString({ userId, ...query })}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  const data = await response.json()
  if (!response.ok || data?.status === 'fail') throw new Error(data?.error || 'Failed to load audit logs')
  return data?.result || { items: [], pagination: { page: 1, limit: 20, total: 0 } }
}
