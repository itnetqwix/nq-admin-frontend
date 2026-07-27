import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
})

const api = path => `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

/** GET /admin/jobs/failed — flatten queue buckets into rows. */
export async function listFailedJobs(limit = 50) {
  const res = await fetch(api(`/admin/jobs/failed?limit=${limit}`), { headers: headers() })
  const data = await res.json()
  if (!res.ok || data?.status === 0) throw new Error(data?.error || 'Failed to load jobs')
  const buckets = Array.isArray(data?.jobs) ? data.jobs : []
  const rows = buckets.map((j, i) => ({
    id: `${j.queue}:${j.id}:${i}`,
    queue: j.queue,
    jobId: j.id,
    name: j.name,
    failedReason: j.failedReason || '—',
    attemptsMade: j.attemptsMade,
    at: j.timestamp ? new Date(j.timestamp).toISOString() : null,
    data: j.data
  }))
  return {
    available: !!data.available,
    total: data.total ?? rows.length,
    queues: data.queues || [],
    rows
  }
}

export async function retryFailedJob(queue, jobId) {
  const res = await fetch(api('/admin/jobs/failed/retry'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ queue, jobId })
  })
  const data = await res.json()
  if (!res.ok || data?.status === 0) throw new Error(data?.error || 'Retry failed')
  return data
}

/** Quick lookup for command palette. */
export async function searchAdminUsers(search, limit = 8) {
  const q = new URLSearchParams({ search, limit: String(limit), page: '1' })
  const res = await fetch(api(`/admin/users?${q}`), { headers: headers() })
  const data = await res.json()
  if (!res.ok || String(data?.status ?? '').toLowerCase() === 'fail') {
    throw new Error(data?.error || 'User search failed')
  }
  const items = data?.data?.items || data?.result?.items || data?.items || []
  return Array.isArray(items) ? items : []
}
