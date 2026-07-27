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
  const base = project
    ? `https://${org}.sentry.io/issues/?project=${encodeURIComponent(project)}`
    : `https://${org}.sentry.io/issues/`
  if (query) return `${base}&query=${encodeURIComponent(query)}`
  return base
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
