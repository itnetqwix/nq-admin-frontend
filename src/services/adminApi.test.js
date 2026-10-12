import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('src/services/http', () => ({ adminFetch: vi.fn() }))

import { adminFetch } from 'src/services/http'
import { AdminApiError, adminApi, buildQuery, normalizePage, unwrap } from './adminApi'

const response = (body, { status = 200, headers = {} } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: { get: name => headers[String(name).toLowerCase()] ?? null },
  text: async () => (body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body))
})

beforeEach(() => adminFetch.mockReset())

describe('unwrap', () => {
  it('reads the new {status,data,meta} envelope', () => {
    expect(unwrap({ status: 'SUCCESS', data: [1], meta: { total: 9 } })).toEqual({ data: [1], meta: { total: 9 } })
  })
  it('reads older {status:1,data} and {success:1,data}', () => {
    expect(unwrap({ status: 1, data: { a: 1 } }).data).toEqual({ a: 1 })
    expect(unwrap({ success: 1, data: 'x' }).data).toBe('x')
  })
  it('reads the ResponseBuilder {result} envelope', () => {
    expect(unwrap({ status: 'success', code: 200, result: { totalRevenue: 5 }, message: 'ok' }).data).toEqual({
      totalRevenue: 5
    })
  })
  it('passes a bare payload through and tolerates null', () => {
    expect(unwrap({ items: [] }).data).toEqual({ items: [] })
    expect(unwrap(null)).toEqual({ data: null, meta: null })
    expect(unwrap([1, 2]).data).toEqual([1, 2])
  })
})

describe('normalizePage', () => {
  it('handles an array plus meta', () => {
    expect(normalizePage([1, 2], { page: 3, pageSize: 2, total: 40 })).toEqual({
      items: [1, 2],
      total: 40,
      page: 3,
      pageSize: 2
    })
  })
  it('handles {items,total,page,limit}', () => {
    expect(normalizePage({ items: [1], total: 7, page: 2, limit: 25 })).toEqual({
      items: [1],
      total: 7,
      page: 2,
      pageSize: 25
    })
  })
  it('handles {items,total,pageSize}', () => {
    expect(normalizePage({ items: [1, 2, 3], total: 3, pageSize: 10 }).pageSize).toBe(10)
  })
  it('derives the page from skip/limit', () => {
    expect(normalizePage({ items: [1], total: 90, skip: 50, limit: 25 }).page).toBe(3)
  })
  it('returns an empty page for unrecognised data', () => {
    expect(normalizePage(null)).toEqual({ items: [], total: 0, page: 1, pageSize: 0 })
    expect(normalizePage({ foo: 1 }).items).toEqual([])
  })
})

describe('buildQuery', () => {
  it('drops empty values and supports arrays', () => {
    expect(buildQuery({ a: 1, b: '', c: null, d: undefined, e: 0 })).toBe('?a=1&e=0')
    expect(buildQuery({ s: ['x', 'y'] })).toBe('?s=x&s=y')
    expect(buildQuery({})).toBe('')
  })
})

describe('adminApi requests', () => {
  it('returns unwrapped data and sends the query string', async () => {
    adminFetch.mockResolvedValue(response({ status: 'SUCCESS', data: { ok: true } }))
    expect(await adminApi.get('/admin/meta', { query: { x: 1 } })).toEqual({ ok: true })
    expect(adminFetch).toHaveBeenCalledWith('/admin/meta?x=1', expect.objectContaining({ method: 'GET' }))
  })

  it('returns a normalised page from list()', async () => {
    adminFetch.mockResolvedValue(
      response({ status: 'SUCCESS', data: [{ id: 1 }], meta: { page: 1, pageSize: 50, total: 1 } })
    )
    expect(await adminApi.list('/admin/alerts')).toEqual({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 50 })
  })

  it('JSON-encodes bodies', async () => {
    adminFetch.mockResolvedValue(response({ status: 'SUCCESS', data: {} }))
    await adminApi.post('/admin/alerts/1/ack', { minutes: 5 })
    expect(adminFetch).toHaveBeenCalledWith(
      '/admin/alerts/1/ack',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ minutes: 5 }) })
    )
  })

  it('throws AdminApiError with code, status and request id from the new FAIL envelope', async () => {
    adminFetch.mockResolvedValue(
      response(
        { status: 'FAIL', error: { code: 'NOT_FOUND', message: 'No such alert' }, requestId: 'req-9' },
        { status: 404 }
      )
    )
    const err = await adminApi.get('/admin/x').catch(e => e)
    expect(err).toBeInstanceOf(AdminApiError)
    expect(err).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'No such alert', requestId: 'req-9' })
  })

  it('reads a string error from the legacy FAIL envelope', async () => {
    adminFetch.mockResolvedValue(response({ status: 'FAIL', error: 'Only admin can perform this action' }, { status: 403 }))
    const err = await adminApi.get('/admin/x').catch(e => e)
    expect(err.message).toBe('Only admin can perform this action')
    expect(err.status).toBe(403)
  })

  it('treats a 200 response with a FAIL body as a failure', async () => {
    adminFetch.mockResolvedValue(response({ status: 'FAIL', error: 'nope' }))
    await expect(adminApi.get('/admin/x')).rejects.toThrow('nope')
  })

  it('falls back to the X-Request-Id header when the body has none', async () => {
    adminFetch.mockResolvedValue(response('Bad Gateway', { status: 502, headers: { 'x-request-id': 'hdr-1' } }))
    const err = await adminApi.get('/admin/x').catch(e => e)
    expect(err.requestId).toBe('hdr-1')
    expect(err.status).toBe(502)
  })

  it('wraps network failures but lets aborts through untouched', async () => {
    adminFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await adminApi.get('/admin/x').catch(e => e)).toMatchObject({ code: 'NETWORK', name: 'AdminApiError' })

    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    adminFetch.mockRejectedValueOnce(abort)
    expect(await adminApi.get('/admin/x').catch(e => e)).toBe(abort)
  })

  it('tolerates an empty body on success', async () => {
    adminFetch.mockResolvedValue(response(undefined))
    expect(await adminApi.delete('/admin/x')).toBeNull()
  })
})
