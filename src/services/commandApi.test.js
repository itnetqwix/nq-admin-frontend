import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('src/services/adminApi', () => ({
  adminApi: { get: vi.fn().mockResolvedValue({}), list: vi.fn().mockResolvedValue({}), post: vi.fn().mockResolvedValue({}) }
}))

import { adminApi } from 'src/services/adminApi'
import * as api from './commandApi'
import { queryKeys } from './queryKeys'

beforeEach(() => vi.clearAllMocks())

describe('commandApi', () => {
  it('calls the documented paths with query params', async () => {
    await api.getCommandCenter(30)
    expect(adminApi.get).toHaveBeenCalledWith('/admin/command-center', { query: { days: 30 } })
    await api.getSystemHealth()
    expect(adminApi.get).toHaveBeenCalledWith('/admin/system/health')
    await api.getSentryStats('7d')
    expect(adminApi.get).toHaveBeenCalledWith('/admin/sentry/stats', { query: { range: '7d' } })
  })

  it('lists alerts as a page and drops unset filters at the client layer', async () => {
    await api.listAlerts({ status: 'acked', severity: 'critical', page: 2 })
    expect(adminApi.list).toHaveBeenCalledWith('/admin/alerts', {
      query: { status: 'acked', severity: 'critical', stream: undefined, page: 2, pageSize: 25 }
    })
  })

  it('url-encodes ids so a hostile id cannot change the path', async () => {
    await api.ackAlert('abc/../x')
    expect(adminApi.post).toHaveBeenCalledWith('/admin/alerts/abc%2F..%2Fx/ack')
    await api.getBookingDetail('a b')
    expect(adminApi.get).toHaveBeenCalledWith('/admin/booking/a%20b')
  })

  it('sends the snooze duration in the body', async () => {
    await api.snoozeAlert('1', 60)
    expect(adminApi.post).toHaveBeenCalledWith('/admin/alerts/1/snooze', { minutes: 60 })
  })
})

describe('queryKeys', () => {
  it('nest under shared prefixes so one invalidation covers related queries', () => {
    expect(queryKeys.alerts({ a: 1 })[0]).toBe(queryKeys.alertsAll[0])
    expect(queryKeys.alertCount[0]).toBe(queryKeys.alertsAll[0])
    expect(queryKeys.commandCenter(7)[0]).toBe(queryKeys.commandCenterAll[0])
    expect(queryKeys.apiHealth(24)[0]).toBe(queryKeys.systemHealth[0])
  })
})
