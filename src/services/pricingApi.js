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

export async function fetchPricingConfig() {
  const res = await fetch(apiUrl('/admin/pricing-config'), { headers: getAuthHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.msg || json?.error || 'Failed to load pricing config')
  return json?.data
}

export async function updatePricingConfig(payload) {
  const res = await fetch(apiUrl('/admin/pricing-config'), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.msg || json?.error || 'Save failed')
  return json?.data
}

export async function fetchPricingDefaults() {
  const res = await fetch(apiUrl('/admin/pricing-config/defaults'), { headers: getAuthHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.msg || json?.error || 'Failed to load defaults')
  return json?.data
}

export async function previewPricingQuote(payload) {
  const res = await fetch(apiUrl('/admin/pricing-config/preview-quote'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.msg || json?.error || 'Preview failed')
  return json?.data
}

export async function fetchPricingHistory(limit = 10) {
  const res = await fetch(
    apiUrl(`/admin/pricing-config/history?limit=${encodeURIComponent(limit)}`),
    { headers: getAuthHeaders() }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json?.msg || json?.error || 'Failed to load history')
  return json?.data
}
