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

/**
 * @param {{ kind: 'banners'|'tips'|'pages', fileName: string, contentType: string, fileSizeBytes: number }} body
 */
export async function presignCmsAsset(body) {
  const res = await fetch(apiUrl('/admin/cms/asset-presign'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok || String(data?.status ?? '').toLowerCase() === 'fail') {
    const msg = typeof data?.error === 'string' ? data.error : data?.error?.message || 'Presign failed'
    throw new Error(msg)
  }
  const payload = data?.data ?? data
  if (!payload?.uploadUrl || !payload?.key) {
    throw new Error('Invalid presign response from server')
  }
  return payload
}
