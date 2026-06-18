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

const parse = async res => {
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed')
  return data?.data ?? data
}

export async function getOpsEvents(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/ops-events?${params}`), { headers: getAuthHeaders() })
  return parse(res)
}

export async function getOpsEventsForUser(userId, query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(apiUrl(`/admin/ops-events/user/${userId}?${params}`), {
    headers: getAuthHeaders()
  })
  return parse(res)
}

export async function getOpsEventDetail(eventId) {
  const res = await fetch(apiUrl(`/admin/ops-events/${eventId}`), { headers: getAuthHeaders() })
  return parse(res)
}

export async function resolveOpsEvent(eventId, body) {
  const res = await fetch(apiUrl(`/admin/ops-events/${eventId}`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return parse(res)
}

export async function getOpsStats() {
  const res = await fetch(apiUrl('/admin/ops-events/stats'), { headers: getAuthHeaders() })
  return parse(res)
}

export async function runOpsBackfill(body = {}) {
  const res = await fetch(apiUrl('/admin/ops-events/backfill'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return parse(res)
}

export async function getOpsPlaybook() {
  const res = await fetch(apiUrl('/admin/ops-events/playbook'), { headers: getAuthHeaders() })
  return parse(res)
}
