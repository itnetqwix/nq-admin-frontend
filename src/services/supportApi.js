import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
})

const api = path => `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

export async function patchWriteUsTicket(id, ticket_status, note = '') {
  const res = await fetch(api(`/admin/write-us/${id}`), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ ticket_status, note })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || String(data?.status || '').toLowerCase() === 'fail') {
    throw new Error(data?.error || data?.message || 'Update failed')
  }
  return data?.data ?? data
}

export async function patchRaiseConcernTicket(id, ticket_status, note = '') {
  const res = await fetch(api(`/admin/raise-concern/${id}`), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ ticket_status, note })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || String(data?.status || '').toLowerCase() === 'fail') {
    throw new Error(data?.error || data?.message || 'Update failed')
  }
  return data?.data ?? data
}
