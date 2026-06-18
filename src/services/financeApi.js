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

async function parseJsonResponse(res) {
  const data = await res.json()
  const failed =
    !res.ok ||
    data?.code === 400 ||
    data?.code === 403 ||
    String(data?.status || '').toLowerCase() === 'fail'
  if (failed) {
    throw new Error(data?.error || data?.msg || 'Request failed')
  }
  return data?.data ?? data
}

async function postFinance(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return parseJsonResponse(res)
}

export async function getFinanceLedger(query = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(query).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await fetch(apiUrl(`/admin/finance/ledger?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to load ledger')
  return data?.data ?? data
}

export async function searchFinanceTransactions(query = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(query).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await fetch(apiUrl(`/admin/finance/transactions/search?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Search failed')
  return data?.data ?? data
}

export async function getRefundQueue(query = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(query).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await fetch(apiUrl(`/admin/finance/refunds?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to load refunds')
  return data?.data ?? data
}

export async function getEscrowSummary() {
  const res = await fetch(apiUrl('/admin/finance/escrow/summary'), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to load escrow summary')
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
  return postFinance(`/admin/finance/escrow/${holdId}/release`, { reason })
}

export async function refundEscrowHold(holdId, reason) {
  return postFinance(`/admin/finance/escrow/${holdId}/refund`, { reason })
}

export async function disputeEscrowHold(holdId, reason) {
  return postFinance(`/admin/finance/escrow/${holdId}/dispute`, { reason })
}

export async function resolveDisputeEscrow(holdId, resolution, reason) {
  return postFinance(`/admin/finance/escrow/${holdId}/resolve-dispute`, { resolution, reason })
}

export async function adjustWallet(payload) {
  return postFinance('/admin/finance/wallet/adjust', payload)
}

export async function refundWalletSession(payload) {
  return postFinance('/admin/finance/wallet/refund-session', payload)
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
  return postFinance('/admin/finance/topups/reconcile', { maxAgeMinutes })
}

export async function reconcileFailedRefunds() {
  return postFinance('/admin/finance/reconcile/refunds', {})
}

export async function reconcileStuckReleasingHolds(maxAgeMinutes = 60) {
  return postFinance('/admin/finance/reconcile/releasing-holds', { maxAgeMinutes })
}

export async function approvePayout(payoutId, secondAdminId) {
  return postFinance(`/admin/finance/payouts/${payoutId}/approve`, {
    second_admin_id: secondAdminId
  })
}

export async function migrateLegacyBalances(dryRun = true) {
  return postFinance('/admin/finance/migrate-legacy-balances', { dry_run: dryRun })
}

export async function getConnectAccounts(query = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(query).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await fetch(apiUrl(`/admin/finance/connect-accounts?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to load Connect accounts')
  return data?.data ?? data
}

export async function getTopUpHistory(query = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(query).filter(([, v]) => v != null && v !== ''))
  ).toString()
  const res = await fetch(apiUrl(`/admin/finance/topups?${params}`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to load top-ups')
  return data?.data ?? data
}

export async function getFinanceOpsDashboard() {
  const res = await fetch(apiUrl('/admin/finance/ops-dashboard'), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to load ops dashboard')
  return data?.data ?? data
}
