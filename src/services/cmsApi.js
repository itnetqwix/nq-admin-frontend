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

export const listCmsPages = async (type) => {
  const qs = type ? `?type=${encodeURIComponent(type)}` : ''
  const res = await fetch(apiUrl(`/admin/cms/pages${qs}`), {
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

/** Save FAQ editor state without going live. */
export const saveFaqDraft = async body => {
  const res = await fetch(apiUrl('/admin/cms/faq/draft'), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

/** Publish draft (or optional body) to all apps. */
export const publishFaq = async (body = {}) => {
  const res = await fetch(apiUrl('/admin/cms/faq/publish'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const saveLegalDraft = async (slug, body) => {
  const res = await fetch(apiUrl(`/admin/cms/legal/${slug}/draft`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const getCmsAssetHealth = async () => {
  const res = await fetch(apiUrl('/admin/cms/asset-health'), { headers: getAuthHeaders() })
  return handleRes(res)
}

export const getLegalNotifyCount = async () => {
  const res = await fetch(apiUrl('/admin/cms/legal/notify-count'), { headers: getAuthHeaders() })
  return handleRes(res)
}

export const publishLegal = async (slug, body = {}) => {
  const res = await fetch(apiUrl(`/admin/cms/legal/${slug}/publish`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const seedAdminFaq = async (body = {}) => {
  const res = await fetch(apiUrl('/admin/cms/faq/seed'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const seedLegalDocuments = async (body = {}) => {
  const res = await fetch(apiUrl('/admin/cms/legal/seed'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  return handleRes(res)
}

export const getCmsSummary = async () => {
  const res = await fetch(apiUrl('/admin/cms/summary'), { headers: getAuthHeaders() })
  return handleRes(res)
}

/**
 * Request a presigned PUT URL for a CMS asset (banner/tip/page cover).
 * `kind` must be one of: banners | tips | pages.
 */
export const presignCmsAsset = async ({ kind, contentType, fileSizeBytes, fileName }) => {
  const res = await fetch(apiUrl('/admin/cms/asset-presign'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ kind, contentType, fileSizeBytes, fileName })
  })
  return handleRes(res)
}

/**
 * Two-step upload: presign with the backend, then PUT the file directly to S3.
 * Returns the permanent mediaUrl ready to persist on the CMS entity.
 */
export const uploadCmsAsset = async (file, kind) => {
  if (!file) throw new Error('No file selected.')
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
  if (!allowed.has(file.type)) {
    throw new Error('Unsupported image type. Use JPEG, PNG, or WebP.')
  }
  const MAX = 5 * 1024 * 1024
  if (file.size > MAX) {
    throw new Error(`Image is too large (max ${Math.round(MAX / 1024 / 1024)} MB).`)
  }
  const presign = await presignCmsAsset({
    kind,
    contentType: file.type,
    fileSizeBytes: file.size,
    fileName: file.name
  })
  const { uploadUrl, mediaUrl } = presign.data || {}
  if (!uploadUrl || !mediaUrl) throw new Error('Presign response missing upload URL.')
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  })
  if (!put.ok) {
    throw new Error(`S3 upload failed (${put.status}).`)
  }
  return { mediaUrl, key: presign.data?.key }
}
