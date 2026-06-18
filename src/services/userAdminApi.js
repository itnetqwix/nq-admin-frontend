import authConfig from 'src/configs/auth'
import { getApiBaseUrl } from 'src/utils/apiBase'

const headers = () => {
  const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

async function fetchUserList(path, search = '') {
  const base = getApiBaseUrl()
  if (!base) throw new Error('API base URL is not configured')
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  const res = await fetch(`${base}${path}${qs}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok || data?.status === 'fail') {
    throw new Error(data?.error || data?.message || 'Failed to load users')
  }
  return (data?.result || []).map(row => ({
    ...row,
    id: row._id || row.id
  }))
}

/** Server-paginated unified user directory (trainers + trainees). */
export async function listUsers({
  page = 1,
  limit = 25,
  search = '',
  account_type = '',
  status = ''
} = {}) {
  const base = getApiBaseUrl()
  if (!base) throw new Error('API base URL is not configured')
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (search?.trim()) params.set('search', search.trim())
  if (account_type) params.set('account_type', account_type)
  if (status) params.set('status', status)
  const res = await fetch(`${base}/admin/users?${params.toString()}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok || data?.status === 'fail') {
    throw new Error(data?.error || data?.message || 'Failed to load users')
  }
  const payload = data?.data || {}
  return {
    items: (payload.items || []).map(row => ({ ...row, id: row._id || row.id })),
    total: payload.total ?? 0,
    page: payload.page ?? page,
    limit: payload.limit ?? limit
  }
}

export async function listTrainers(search) {
  return fetchUserList('/user/get-all-trainer', search)
}

export async function listTrainees(search) {
  return fetchUserList('/user/get-all-trainee', search)
}

export async function deleteUser(userId) {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/user/delete-user/${userId}`, {
    method: 'DELETE',
    headers: headers()
  })
  const data = await res.json()
  if (!res.ok || data?.status === 'fail') {
    throw new Error(data?.error || 'Unable to delete user')
  }
  return data
}
