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

export const listLegalDocuments = async () => {
  const res = await fetch(apiUrl('/admin/cms/legal'), { headers: getAuthHeaders() })
  return handleRes(res)
}

export const upsertLegalDocument = async (slug, body) => {
  const res = await fetch(apiUrl(`/admin/cms/legal/${slug}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const listCmsPages = async (type = 'blog') => {
  const res = await fetch(apiUrl(`/admin/cms/pages?type=${encodeURIComponent(type)}`), {
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const createCmsPage = async body => {
  const res = await fetch(apiUrl('/admin/cms/pages'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const updateCmsPage = async (id, body) => {
  const res = await fetch(apiUrl(`/admin/cms/pages/${id}`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const toggleCmsPage = async id => {
  const res = await fetch(apiUrl(`/admin/cms/pages/${id}/toggle`), {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const deleteCmsPage = async id => {
  const res = await fetch(apiUrl(`/admin/cms/pages/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return handleRes(res)
}

export const getAdminFaq = async () => {
  const res = await fetch(apiUrl('/admin/cms/faq'), { headers: getAuthHeaders() })
  return handleRes(res)
}

export const publishAdminFaq = async body => {
  const res = await fetch(apiUrl('/admin/cms/faq'), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const seedAdminFaq = async body = {}) => {
  const res = await fetch(apiUrl('/admin/cms/faq/seed'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}
