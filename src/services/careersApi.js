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

const qs = query => {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, String(v))
  })
  const s = params.toString()
  return s ? `?${s}` : ''
}

export const listCareerJobs = async (query = {}) => {
  const res = await fetch(apiUrl(`/admin/careers/jobs${qs(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const createCareerJob = async body => {
  const res = await fetch(apiUrl('/admin/careers/jobs'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const updateCareerJob = async (id, body) => {
  const res = await fetch(apiUrl(`/admin/careers/jobs/${id}`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const toggleCareerJob = async id => {
  const res = await fetch(apiUrl(`/admin/careers/jobs/${id}/toggle`), {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const deleteCareerJob = async id => {
  const res = await fetch(apiUrl(`/admin/careers/jobs/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const listCareerApplications = async (query = {}) => {
  const res = await fetch(apiUrl(`/admin/careers/applications${qs(query)}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const getCareerApplication = async id => {
  const res = await fetch(apiUrl(`/admin/careers/applications/${id}`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const updateCareerApplicationStatus = async (id, body) => {
  const res = await fetch(apiUrl(`/admin/careers/applications/${id}/status`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const getCareerApplicationResume = async id => {
  const res = await fetch(apiUrl(`/admin/careers/applications/${id}/resume`), {
    method: 'GET',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}
