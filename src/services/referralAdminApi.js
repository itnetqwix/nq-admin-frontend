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
