import * as Sentry from '@sentry/nextjs'

let inited = false

/** Optional — set NEXT_PUBLIC_SENTRY_DSN (project netqwix-admin) to enable browser error reporting. */
export function initSentry() {
  const dsn = String(process.env.NEXT_PUBLIC_SENTRY_DSN ?? '').trim()
  if (!dsn || inited || typeof window === 'undefined') return
  inited = true
  const environment = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV
  const isProd = environment === 'production'
  try {
    Sentry.init({
      dsn,
      environment,
      sendDefaultPii: false,
      enableLogs: true,
      tracesSampleRate: isProd ? 0.2 : 1.0,
      // Admin screens show customer PII — keep replays fully masked.
      replaysSessionSampleRate: isProd ? 0.1 : 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
        Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] })
      ],
      initialScope: { tags: { app: 'nq-admin' } }
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[Sentry] init failed:', err)
    }
  }
}
