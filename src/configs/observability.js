/**
 * Observability deep links (optional NEXT_PUBLIC_*).
 * Leave unset → buttons hide. Never embeds secrets.
 */

const sentryOrg = () => (process.env.NEXT_PUBLIC_SENTRY_ORG || '').trim()
const sentryProject = () => (process.env.NEXT_PUBLIC_SENTRY_PROJECT || '').trim()
const logRocketApp = () => (process.env.NEXT_PUBLIC_LOGROCKET_APP_ID || '').trim()

export function sentryIssuesUrl({ query } = {}) {
  const org = sentryOrg()
  const project = sentryProject()
  if (!org) return null
  // Build the query string once so `?` / `&` are always right whichever params are present.
  const params = new URLSearchParams()
  if (project) params.set('project', project)
  if (query) params.set('query', query)
  const qs = params.toString()
  return `https://${org}.sentry.io/issues/${qs ? `?${qs}` : ''}`
}

/** Errors tagged with a lesson id (the backend and apps tag events with session_id). */
export function sentrySessionUrl(sessionId) {
  return sessionId ? sentryIssuesUrl({ query: `session_id:${sessionId}` }) : sentryIssuesUrl()
}

export function sentryUserSearchUrl(userId) {
  if (!userId) return sentryIssuesUrl()
  return sentryIssuesUrl({ query: `user.id:${userId}` })
}

export function logRocketSessionsUrl({ userId } = {}) {
  const app = logRocketApp()
  if (!app) return null
  // app id form org/project
  const base = `https://app.logrocket.com/${app}/sessions`
  if (userId) return `${base}?filters=%7B%22userID%22%3A%22${encodeURIComponent(userId)}%22%7D`
  return base
}

export function hasObservabilityLinks() {
  return Boolean(sentryOrg() || logRocketApp())
}
