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

async function send(path, body) {
  const res = await adminFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || String(data?.status || '').toLowerCase() === 'fail') {
    throw new Error(data?.error || data?.message || 'Request failed')
  }
  return data?.data ?? data
}

export const fetchLoadTestControl = () => request('/admin/load-tests/control/status')

export const startLoadTest = (config, confirm) => send('/admin/load-tests/control/start', { config, confirm })

export const stopLoadTest = () => send('/admin/load-tests/control/stop')

export const cleanupLoadTestData = () => send('/admin/load-tests/control/cleanup')
