import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'
import { getFinanceOpsDashboard } from 'src/services/financeApi'
import { getOpsStats } from 'src/services/opsApi'

const getAuthHeaders = () => {
  const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

const apiUrl = path => `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

export async function getMessagingHealth() {
  const res = await fetch(apiUrl('/admin/messaging-health'), { headers: getAuthHeaders() })
  const data = await res.json()
  if (!res.ok && res.status !== 503) {
    throw new Error(data?.message || 'Failed to load messaging health')
  }
  return data?.data ?? data
}

/** Aggregates finance ops, ops stats, and messaging health for the platform hub. */
export async function getPlatformHealthSnapshot() {
  const [messaging, financeOps, opsStats] = await Promise.allSettled([
    getMessagingHealth(),
    getFinanceOpsDashboard(),
    getOpsStats()
  ])

  return {
    messaging: messaging.status === 'fulfilled' ? messaging.value : { error: messaging.reason?.message },
    financeOps: financeOps.status === 'fulfilled' ? financeOps.value : { error: financeOps.reason?.message },
    opsStats: opsStats.status === 'fulfilled' ? opsStats.value : { error: opsStats.reason?.message }
  }
}
