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

export async function getAdminSessionTimeline(bookingId) {
  const res = await fetch(apiUrl(`/admin/booking/${bookingId}/timeline`), {
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load session timeline')
  }
  return data?.data ?? data
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  const failed =
    !res.ok ||
    data?.code === 400 ||
    data?.code === 403 ||
    String(data?.status || '').toLowerCase() === 'fail'
  if (failed) {
    throw new Error(data?.error || data?.msg || 'Request failed')
  }
  return data?.data ?? data
}

export async function createAdminRefund({ bookingId, paymentIntentId, reason }) {
  const res = await fetch(apiUrl('/transaction/create-refund'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      booking_id: bookingId,
      payment_intent_id: paymentIntentId || undefined,
      reason
    })
  })
  return parseJson(res)
}

export async function cancelAdminBooking(bookingId, reason) {
  const res = await fetch(apiUrl(`/admin/booking/${bookingId}/cancel`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason })
  })
  return parseJson(res)
}

export async function getPaymentIntentDetails(paymentIntentId) {
  const res = await fetch(apiUrl('/transaction/get-payment-intent'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ payment_intent_id: paymentIntentId })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.code === 400) return {}
  return data?.data ?? data ?? {}
}
