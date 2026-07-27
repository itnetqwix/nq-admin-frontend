import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
})

const api = path => `${requireApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

const handle = async res => {
  const data = await res.json()
  if (!res.ok || String(data?.status ?? '').toLowerCase() === 'fail') {
    const msg = typeof data?.error === 'string' ? data.error : data?.error?.message || 'Request failed'
    const err = new Error(msg)
    err.status = res.status
    err.retryAfter = res.headers.get('Retry-After')
    throw err
  }
  return data?.data ?? data?.result ?? data
}

const qs = query => {
  const p = new URLSearchParams()
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const getCmsSummary = () => fetch(api('/admin/cms/summary'), { headers: headers() }).then(handle)

export const getCmsAssetHealth = () =>
  fetch(api('/admin/cms/asset-health'), { headers: headers() }).then(handle)

export const listBanners = (query = {}) =>
  fetch(api(`/admin/banners${qs(query)}`), { headers: headers() }).then(handle)

export const createBanner = body =>
  fetch(api('/admin/banners'), { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle)

export const updateBanner = (id, body) =>
  fetch(api(`/admin/banners/${id}`), { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(
    handle
  )

export const toggleBanner = id =>
  fetch(api(`/admin/banners/${id}/toggle`), { method: 'PATCH', headers: headers() }).then(handle)

export const deleteBanner = id =>
  fetch(api(`/admin/banners/${id}`), { method: 'DELETE', headers: headers() }).then(handle)

export const listTips = (query = {}) =>
  fetch(api(`/admin/tips${qs(query)}`), { headers: headers() }).then(handle)

export const createTip = body =>
  fetch(api('/admin/tips'), { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle)

export const updateTip = (id, body) =>
  fetch(api(`/admin/tips/${id}`), { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handle)

export const toggleTip = id =>
  fetch(api(`/admin/tips/${id}/toggle`), { method: 'PATCH', headers: headers() }).then(handle)

export const deleteTip = id =>
  fetch(api(`/admin/tips/${id}`), { method: 'DELETE', headers: headers() }).then(handle)

/** Presign → PUT with progress. Returns public mediaUrl. */
export function uploadCmsAsset(file, kind = 'banners', onProgress) {
  const max = 5 * 1024 * 1024
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!file) return Promise.reject(new Error('No file'))
  if (!allowed.includes(file.type)) {
    return Promise.reject(new Error('Use JPEG, PNG, or WebP'))
  }
  if (file.size > max) {
    return Promise.reject(new Error('Image must be ≤ 5 MB'))
  }

  return fetch(api('/admin/cms/asset-presign'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      kind,
      contentType: file.type,
      fileSizeBytes: file.size,
      fileName: file.name
    })
  })
    .then(handle)
    .then(
      ({ uploadUrl, mediaUrl, expiresIn }) =>
        new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.upload.onprogress = e => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ mediaUrl, expiresIn })
            } else {
              reject(new Error(`S3 upload failed (${xhr.status})`))
            }
          }
          xhr.onerror = () => reject(new Error('S3 upload network error — retry'))
          xhr.send(file)
        })
    )
}
