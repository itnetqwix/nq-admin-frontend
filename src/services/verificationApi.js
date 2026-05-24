import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
})

const api = path => `${requireApiBaseUrl()}${path}`

export async function getTrainerVerifications(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(api(`/admin/trainer-verifications?${params}`), { headers: headers() })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Failed to load queue')
  return data?.data ?? data
}

export async function getTrainerVerificationDetail(userId) {
  const res = await fetch(api(`/admin/trainer-verifications/${userId}`), { headers: headers() })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Failed to load detail')
  return data?.data ?? data
}

export async function approveTrainerVerification(userId) {
  const res = await fetch(api(`/admin/trainer-verifications/${userId}/approve`), {
    method: 'POST',
    headers: headers()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Approve failed')
  return data?.data ?? data
}

export async function rejectTrainerVerification(userId, reason) {
  const res = await fetch(api(`/admin/trainer-verifications/${userId}/reject`), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ reason })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Reject failed')
  return data?.data ?? data
}

export async function getPendingVerificationCount() {
  const res = await fetch(api('/admin/trainer-verifications/pending-count'), { headers: headers() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Failed to load pending verifications')
  }
  return Number(data?.data?.total ?? data?.result?.total ?? 0) || 0
}
