import { adminFetch } from 'src/services/http'

async function request(path) {
  const res = await adminFetch(path)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || String(data?.status || '').toLowerCase() === 'fail') {
    throw new Error(data?.error || data?.message || 'Request failed')
  }
  return data?.data ?? data
}

export const fetchLoadTestRuns = (limit = 25) => request(`/admin/load-tests/runs?limit=${encodeURIComponent(limit)}`)

export const fetchLoadTestRun = id => request(`/admin/load-tests/runs/${encodeURIComponent(id)}`)
