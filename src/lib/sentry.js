import * as Sentry from '@sentry/nextjs'

let inited = false

/** Optional — set NEXT_PUBLIC_SENTRY_DSN to enable browser error reporting. */
export function initSentry() {
  const dsn = String(process.env.NEXT_PUBLIC_SENTRY_DSN ?? '').trim()
  if (!dsn || inited || typeof window === 'undefined') return
  inited = true
  try {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      initialScope: { tags: { app: 'nq-admin' } }
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[Sentry] init failed:', err)
    }
  }
}
