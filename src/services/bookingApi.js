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

export async function getAdminBookingDetail(bookingId) {
  const res = await fetch(apiUrl(`/admin/booking/${bookingId}`), { headers: getAuthHeaders() })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load booking detail')
  }
  return data?.data ?? data
}
