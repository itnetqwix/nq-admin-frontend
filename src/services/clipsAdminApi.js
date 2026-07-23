import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const headers = (json = true) => {
  const h = {
    Authorization: `Bearer ${window.localStorage.getItem(authConfig.storageTokenKeyName)}`
  }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

const api = path => `${requireApiBaseUrl()}${path}`

async function parseJson(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed')
  return data?.data ?? data
}

export async function getClipTaxonomyAdmin() {
  const res = await fetch(api('/admin/clip-categories'), { headers: headers() })
  return parseJson(res)
}

export async function createClipCategory(name) {
  const res = await fetch(api('/admin/clip-categories'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name })
  })
  return parseJson(res)
}

export async function updateClipCategory(id, body) {
  const res = await fetch(api(`/admin/clip-categories/${id}`), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body)
  })
  return parseJson(res)
}

export async function deleteClipCategory(id) {
  const res = await fetch(api(`/admin/clip-categories/${id}`), {
    method: 'DELETE',
    headers: headers()
  })
  return parseJson(res)
}

export async function createClipSubcategory(categoryId, name) {
  const res = await fetch(api('/admin/clip-subcategories'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ category_id: categoryId, name })
  })
  return parseJson(res)
}

export async function updateClipSubcategory(id, body) {
  const res = await fetch(api(`/admin/clip-subcategories/${id}`), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body)
  })
  return parseJson(res)
}

export async function deleteClipSubcategory(id) {
  const res = await fetch(api(`/admin/clip-subcategories/${id}`), {
    method: 'DELETE',
    headers: headers()
  })
  return parseJson(res)
}

export async function getLibraryClipsGrouped() {
  const res = await fetch(api('/admin/library/clips'), { headers: headers() })
  return parseJson(res)
}

export async function presignLibraryClip(body) {
  const res = await fetch(api('/admin/library/clips/presign'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || 'Presign failed')
  if (!data?.videoUploadUrl || !data?.videoKey) {
    throw new Error('Invalid presign response from server')
  }
  return data
}

export async function confirmLibraryClip(body) {
  const res = await fetch(api('/admin/library/clips/confirm'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || 'Confirm failed')
  return data
}

export async function deleteLibraryClip(clipId) {
  const res = await fetch(api(`/admin/library/clips/${clipId}`), {
    method: 'DELETE',
    headers: headers()
  })
  return parseJson(res)
}

export async function updateLibraryClip(clipId, body) {
  const res = await fetch(api(`/admin/library/clips/${clipId}`), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || 'Update failed')
  return data?.clip ?? data?.data ?? data
}

export async function getLibrarySubmissions(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(api(`/admin/library-submissions?${params}`), { headers: headers() })
  return parseJson(res)
}

export async function getClipPlayUrl(clipId) {
  if (!clipId) throw new Error('Invalid clip id')
  const res = await fetch(api(`/admin/clip-play-url/${clipId}`), { headers: headers() })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || data?.message || 'Could not load clip')
  return data?.result ?? data?.data ?? data
}

export async function approveLibrarySubmission(id, categoryId, subcategoryId) {
  const res = await fetch(api(`/admin/library-submissions/${id}/approve`), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ category_id: categoryId, subcategory_id: subcategoryId })
  })
  return parseJson(res)
}

export async function rejectLibrarySubmission(id, reason) {
  const res = await fetch(api(`/admin/library-submissions/${id}/reject`), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ reason })
  })
  return parseJson(res)
}

export async function markLibrarySubmissionUnderReview(id) {
  const res = await fetch(api(`/admin/library-submissions/${id}/under-review`), {
    method: 'POST',
    headers: headers()
  })
  return parseJson(res)
}

export async function rejectTraineeAccount(userId, reason) {
  const res = await fetch(api(`/admin/trainee-accounts/${userId}/reject`), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ reason })
  })
  return parseJson(res)
}

export async function approveTraineeAccount(userId) {
  const res = await fetch(api(`/admin/trainee-accounts/${userId}/approve`), {
    method: 'POST',
    headers: headers()
  })
  return parseJson(res)
}

export async function getPendingTraineeAccounts(query = {}) {
  const params = new URLSearchParams(query).toString()
  const res = await fetch(api(`/admin/trainee-accounts/pending?${params}`), { headers: headers() })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to load pending trainees')
  return data?.data ?? data
}

export async function getPendingTraineeCount() {
  const res = await fetch(api('/admin/trainee-accounts/pending-count'), { headers: headers() })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to load pending trainee count')
  return data?.data?.total ?? data?.total ?? 0
}
