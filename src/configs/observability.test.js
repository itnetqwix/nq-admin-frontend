import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllEnvs())

async function load(env) {
  vi.resetModules()
  Object.entries(env).forEach(([k, v]) => vi.stubEnv(k, v))
  return import('./observability')
}

describe('sentryIssuesUrl', () => {
  it('is null when no org is configured', async () => {
    const m = await load({ NEXT_PUBLIC_SENTRY_ORG: '' })
    expect(m.sentryIssuesUrl()).toBeNull()
  })

  it('builds a valid URL with only an org, with or without a query', async () => {
    const m = await load({ NEXT_PUBLIC_SENTRY_ORG: 'netqwix', NEXT_PUBLIC_SENTRY_PROJECT: '' })
    expect(m.sentryIssuesUrl()).toBe('https://netqwix.sentry.io/issues/')
    // Regression: this used to produce ".../issues/&query=…" (no "?").
    expect(m.sentryIssuesUrl({ query: 'user.id:abc' })).toBe('https://netqwix.sentry.io/issues/?query=user.id%3Aabc')
  })

  it('adds the project and the query together', async () => {
    const m = await load({ NEXT_PUBLIC_SENTRY_ORG: 'netqwix', NEXT_PUBLIC_SENTRY_PROJECT: '123' })
    expect(m.sentryIssuesUrl({ query: 'is:unresolved' })).toBe('https://netqwix.sentry.io/issues/?project=123&query=is%3Aunresolved')
  })

  it('searches a lesson by the session_id tag the apps and API actually set', async () => {
    const m = await load({ NEXT_PUBLIC_SENTRY_ORG: 'netqwix', NEXT_PUBLIC_SENTRY_PROJECT: '' })
    expect(m.sentrySessionUrl('64b0')).toBe('https://netqwix.sentry.io/issues/?query=session_id%3A64b0')
    expect(m.sentrySessionUrl()).toBe('https://netqwix.sentry.io/issues/')
  })
})
