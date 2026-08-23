import authConfig from 'src/configs/auth'
import { getApiBaseUrl } from 'src/utils/apiBase'

const headers = () => {
  const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

/** Server-paginated unified user directory (trainers + trainees). */
export async function listUsers({
  page = 1,
  limit = 25,
  search = '',
  account_type = '',
  status = '',
  category = '',
  login_type = '',
  time_zone = '',
  country = '',
  from = '',
  to = '',
  min_sessions = '',
  max_sessions = '',
  kyc = ''
} = {}) {
  const base = getApiBaseUrl()
  if (!base) throw new Error('API base URL is not configured')
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (search?.trim()) params.set('search', search.trim())
  if (account_type) params.set('account_type', account_type)
  if (status) params.set('status', status)
  if (category?.trim()) params.set('category', category.trim())
  if (login_type) params.set('login_type', login_type)
  if (time_zone?.trim()) params.set('time_zone', time_zone.trim())
  if (country?.trim()) params.set('country', country.trim())
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (min_sessions !== '' && min_sessions != null) params.set('min_sessions', String(min_sessions))
  if (max_sessions !== '' && max_sessions != null) params.set('max_sessions', String(max_sessions))
  if (kyc) params.set('kyc', kyc)
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
    limit: payload.limit ?? limit,
    counts: payload.counts || null
  }
}

export async function updateTrainerCommission(payload) {
  const base = getApiBaseUrl()
  if (!base) throw new Error('API base URL is not configured')
  const trainerId = payload.trainer_id
  const res = await fetch(`${base}/admin/users/${trainerId}/commission`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.status === 'fail') {
    throw new Error(data?.error || data?.message || 'Failed to update commission')
  }
  return data
}

export async function updateTrainerStatus(trainerId, status) {
  const base = getApiBaseUrl()
  if (!base) throw new Error('API base URL is not configured')
  const res = await fetch(`${base}/admin/users/${trainerId}/status`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.status === 'fail') {
    throw new Error(data?.error || data?.message || 'Failed to update status')
  }
  return data
}

export async function deleteUser(userId) {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: headers()
  })
  const data = await res.json()
  if (!res.ok || data?.status === 'fail') {
    throw new Error(data?.error || 'Unable to delete user')
  }
  return data
}
