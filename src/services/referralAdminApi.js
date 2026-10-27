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

function unwrap(res) {
  const data = res?.data ?? res?.result?.data ?? res?.result ?? res
  return data?.data ?? data
}

export async function getReferralDashboard() {
  const res = await fetch(apiUrl('/admin/referrals/dashboard'), {
    headers: getAuthHeaders()
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error || 'Failed to load referral dashboard')
  return unwrap(json)
}

export async function getReferralRewards(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/referrals/rewards?${params}`), {
    headers: getAuthHeaders()
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error || 'Failed to load rewards')
  return unwrap(json)
}

async function pointsRequest(path, options = {}) {
  const res = await fetch(apiUrl(`/admin/points${path}`), { headers: getAuthHeaders(), ...options })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error || 'Points request failed')
  return unwrap(json)
}

export const getPointsConfig = () => pointsRequest('/config')

export const updatePointsConfig = body =>
  pointsRequest('/config', { method: 'PUT', body: JSON.stringify(body) })

export const adjustUserPoints = body =>
  pointsRequest('/adjust', { method: 'POST', body: JSON.stringify(body) })

export const getPointsLedger = (query = {}) =>
  pointsRequest(`/ledger?${new URLSearchParams(query).toString()}`)

export const getPointsReconcile = () => pointsRequest('/reconcile')

export const getPointsOverview = () => pointsRequest('/overview')

export const getPointsHistory = () => pointsRequest('/config/history')

export const revertPointsConfig = (id, reason) =>
  pointsRequest(`/config/revert/${id}`, { method: 'POST', body: JSON.stringify({ reason }) })

export const getPointsPreview = (query = {}) =>
  pointsRequest(`/preview?${new URLSearchParams(query).toString()}`)
