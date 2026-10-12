/**
 * One client for new admin screens.
 *
 * The API grew four success envelopes and three pagination shapes. Rather than rewriting ~90
 * endpoints (nq-mobile depends on 14 of them), `unwrap` normalises them here so a screen never
 * parses an envelope itself:
 *
 *   { status:'SUCCESS', data, meta? }     new endpoints (see backend adminResponse.ts)
 *   { status:1 | success:1, data }        older controllers
 *   { status, code, result, message }     ResponseBuilder
 *   bare payload                          a few legacy routes
 *
 * Failures throw AdminApiError with the HTTP status, a machine code and the request id so an
 * admin can quote it to engineering (it is also the `request_id` tag in Sentry).
 */
import { adminFetch } from 'src/services/http'

export class AdminApiError extends Error {
  constructor(message, { status = 0, code = 'ERROR', requestId = null, body = null } = {}) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
    this.body = body
  }
}

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v)

function isFailureBody(body) {
  if (!isObject(body)) return false
  const status = body.status
  if (typeof status === 'string' && status.toUpperCase() === 'FAIL') return true
  if (status === 0 || body.success === 0 || body.success === false) return true
  return false
}

function failureMessage(body, fallback) {
  const e = body?.error
  if (typeof e === 'string' && e) return e
  if (isObject(e) && e.message) return String(e.message)
  return body?.message || body?.msg || fallback
}

function failureCode(body) {
  return isObject(body?.error) && body.error.code ? String(body.error.code) : 'ERROR'
}

/** Pure: turn any response body into { data, meta }. Does not look at HTTP status. */
export function unwrap(body) {
  if (!isObject(body)) return { data: body ?? null, meta: null }
  if ('data' in body) return { data: body.data, meta: isObject(body.meta) ? body.meta : null }
  if ('result' in body) return { data: body.result, meta: null }
  return { data: body, meta: null }
}

/**
 * Pure: normalise the paging shapes into { items, total, page, pageSize }.
 *   array + meta                  new endpoints
 *   { items, total, page, limit } fetchAdminList style
 *   { items, total, pageSize }    careers / deletions
 *   { items, skip, limit, total } skip/limit style
 */
export function normalizePage(data, meta = null) {
  if (Array.isArray(data)) {
    const pageSize = Number(meta?.pageSize) || data.length || 0
    return {
      items: data,
      total: Number(meta?.total ?? data.length),
      page: Number(meta?.page) || 1,
      pageSize
    }
  }
  if (isObject(data) && Array.isArray(data.items)) {
    const pageSize = Number(data.pageSize ?? data.limit ?? meta?.pageSize) || data.items.length || 0
    const skip = Number(data.skip)
    const page = Number(data.page ?? meta?.page) || (Number.isFinite(skip) && pageSize > 0 ? Math.floor(skip / pageSize) + 1 : 1)
    return { items: data.items, total: Number(data.total ?? meta?.total ?? data.items.length), page, pageSize }
  }
  return { items: [], total: 0, page: 1, pageSize: 0 }
}

export function buildQuery(query = {}) {
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) value.forEach(v => qs.append(key, String(v)))
    else qs.set(key, String(value))
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

async function request(method, path, { query, body, signal } = {}) {
  let res
  try {
    res = await adminFetch(`${path}${buildQuery(query)}`, {
      method,
      signal,
      ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {})
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new AdminApiError(err?.message || 'Network error', { code: 'NETWORK' })
  }

  const requestId = res.headers?.get?.('x-request-id') || null
  const text = await res.text().catch(() => '')
  let parsed = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
  }

  if (!res.ok || isFailureBody(parsed)) {
    throw new AdminApiError(failureMessage(parsed, res.statusText || `Request failed (${res.status})`), {
      status: res.status,
      code: failureCode(parsed),
      requestId: parsed?.requestId || requestId,
      body: parsed
    })
  }
  return { ...unwrap(parsed), requestId }
}

export const adminApi = {
  /** GET -> data */
  get: async (path, opts) => (await request('GET', path, opts)).data,
  /** GET a paginated list -> { items, total, page, pageSize } */
  list: async (path, opts) => {
    const { data, meta } = await request('GET', path, opts)
    return normalizePage(data, meta)
  },
  post: async (path, body, opts) => (await request('POST', path, { ...opts, body: body ?? {} })).data,
  put: async (path, body, opts) => (await request('PUT', path, { ...opts, body: body ?? {} })).data,
  patch: async (path, body, opts) => (await request('PATCH', path, { ...opts, body: body ?? {} })).data,
  delete: async (path, opts) => (await request('DELETE', path, opts)).data,
  /** Full result including meta and request id, for the rare caller that needs them. */
  raw: request
}

export default adminApi
