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

export async function getFinanceLedger(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/finance/ledger?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  return data?.data ?? data
}

export async function getEscrowHolds(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/finance/escrow?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  return data?.data ?? data
}

export async function getPayoutQueue(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/finance/payouts?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  return data?.data ?? data
}

export async function getFinancialAuditLog(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/finance/audit-log?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  return data?.data ?? data
}

export async function releaseEscrowHold(holdId, reason) {
  const res = await fetch(apiUrl(`/admin/finance/escrow/${holdId}/release`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason })
  })
  return res.json()
}

export async function refundEscrowHold(holdId, reason) {
  const res = await fetch(apiUrl(`/admin/finance/escrow/${holdId}/refund`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason })
  })
  return res.json()
}

export async function adjustWallet(payload) {
  const res = await fetch(apiUrl('/admin/finance/wallet/adjust'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function refundWalletSession(payload) {
  const res = await fetch(apiUrl('/admin/finance/wallet/refund-session'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function getStuckTopUps(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/finance/topups/stuck?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  return data?.data ?? data
}

export async function reconcileStuckTopUps(maxAgeMinutes = 30) {
  const res = await fetch(apiUrl('/admin/finance/topups/reconcile'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maxAgeMinutes })
  })
  return res.json()
}

export async function reconcileFailedRefunds() {
  const res = await fetch(apiUrl('/admin/finance/reconcile/refunds'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({})
  })
  return res.json()
}

export async function reconcileStuckReleasingHolds(maxAgeMinutes = 60) {
  const res = await fetch(apiUrl('/admin/finance/reconcile/releasing-holds'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ maxAgeMinutes })
  })
  return res.json()
}

export async function approvePayout(payoutId, secondAdminId) {
  const res = await fetch(apiUrl(`/admin/finance/payouts/${payoutId}/approve`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ second_admin_id: secondAdminId })
  })
  return res.json()
}
