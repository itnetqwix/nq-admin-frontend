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

const handleRes = async response => {
  const data = await response.json()
  if (!response.ok || String(data?.status ?? '').toLowerCase() === 'fail') {
    const msg = typeof data?.error === 'string' ? data.error : data?.error?.message || 'Request failed'
    throw new Error(msg)
  }
  return data
}

export const listTips = async (query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, String(v))
  })
  const qs = params.toString()
  const url = apiUrl(`/admin/tips${qs ? `?${qs}` : ''}`)
  const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() })
  return handleRes(res)
}

export const createTip = async body => {
  const res = await fetch(apiUrl('/admin/tips'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const updateTip = async (id, body) => {
  const res = await fetch(apiUrl(`/admin/tips/${id}`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const toggleTip = async id => {
  const res = await fetch(apiUrl(`/admin/tips/${id}/toggle`), {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const deleteTip = async id => {
  const res = await fetch(apiUrl(`/admin/tips/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}
