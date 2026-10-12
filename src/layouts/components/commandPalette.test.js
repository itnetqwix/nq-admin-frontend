import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('src/configs/observability', () => ({
  sentryIssuesUrl: ({ query } = {}) => (query ? `https://sentry.example/issues/?query=${query}` : null)
}))

import { buildPaletteItems, extraPages, moveIndex, pagesFromNav } from './commandPalette'

const nav = [
  { title: 'Command', children: [{ title: 'Live Ops', path: '/apps/live-lessons', subject: 'admin-nav-call-diagnostics', action: 'read' }, { title: 'Alerts', path: '/apps/alerts', subject: 'admin-nav-alerts', action: 'read' }] },
  { title: 'Money', children: [{ title: 'Finance', path: '/apps/finance', subject: 'admin-nav-finance', action: 'read' }] },
  { title: 'Home', path: '/home', subject: 'admin-nav-home', action: 'read' }
]

describe('pagesFromNav', () => {
  it('flattens groups and top-level links with their group', () => {
    const pages = pagesFromNav(nav)
    expect(pages.map(p => p.path)).toEqual(['/apps/live-lessons', '/apps/alerts', '/apps/finance', '/home'])
    expect(pages[0].group).toBe('Command')
    expect(pages[3].group).toBeNull()
  })

  it('drops pages the admin is not allowed to open', () => {
    const can = (_a, subject) => subject !== 'admin-nav-finance'
    expect(pagesFromNav(nav, can).map(p => p.path)).not.toContain('/apps/finance')
    expect(extraPages(can).some(p => p.path.includes('finance'))).toBe(false)
  })
})

describe('buildPaletteItems', () => {
  const pages = pagesFromNav(nav)

  it('suggests pages before anything is typed', () => {
    expect(buildPaletteItems({ query: '', pages })).toHaveLength(4)
  })

  it('treats a leading slash as a direct path', () => {
    expect(buildPaletteItems({ query: '/apps/ops', pages })).toEqual([
      expect.objectContaining({ action: { type: 'path', path: '/apps/ops' } })
    ])
  })

  it('puts people and lessons from search first, then matching pages', () => {
    const items = buildPaletteItems({
      query: 'live',
      pages,
      search: {
        users: [{ id: 'u1', name: 'Olivia', email: 'o@x.com', accountType: 'Trainee', status: 'approved' }],
        bookings: [{ id: 'b1', status: 'confirmed', paymentIntentId: 'pi_1', trainer: { name: 'Tara' }, trainee: { name: 'Tim' } }]
      }
    })
    expect(items.map(i => i.key)).toEqual(['user:u1', 'lesson:b1', 'page:/apps/live-lessons'])
    expect(items[0].action).toEqual({ type: 'drawer', drawerType: 'user', id: 'u1' })
    expect(items[1].label).toBe('Tara with Tim')
    expect(items[1].secondary).toBe('confirmed · pi_1 · b1')
  })

  it('falls back to the booking id when there are no names', () => {
    const items = buildPaletteItems({ query: 'zz', pages: [], search: { bookings: [{ id: 'b9', status: 'confirmed' }] } })
    expect(items[0].label).toBe('Booking b9')
  })

  it('links a Sentry short id out only when Sentry links are configured', () => {
    const items = buildPaletteItems({ query: 'NETQWIX-API-1A', pages: [], search: { sentry: [{ shortId: 'NETQWIX-API-1A' }] } })
    expect(items[0].action).toEqual({ type: 'external', url: 'https://sentry.example/issues/?query=NETQWIX-API-1A' })
  })

  it('matches pages by label or path, case-insensitively, and caps them', () => {
    expect(buildPaletteItems({ query: 'FINANCE', pages }).map(i => i.label)).toEqual(['Finance'])
    expect(buildPaletteItems({ query: 'zzz-nothing', pages })).toEqual([])
  })

  it('is safe while the search response is still loading', () => {
    expect(() => buildPaletteItems({ query: 'tara', pages, search: null })).not.toThrow()
  })
})

describe('moveIndex', () => {
  it('wraps both ways and handles empty lists', () => {
    expect(moveIndex(0, -1, 3)).toBe(2)
    expect(moveIndex(2, 1, 3)).toBe(0)
    expect(moveIndex(1, 1, 3)).toBe(2)
    expect(moveIndex(0, 1, 0)).toBe(0)
  })
})
