/** Admin UI feature flags (Next.js: NEXT_PUBLIC_* only). */

export const isAdminRegisterEnabled = () =>
  String(process.env.NEXT_PUBLIC_ADMIN_REGISTER_ENABLED || '').toLowerCase() === 'true'

/** Short label for current API host (for environment banner). */
export const getAdminApiEnvLabel = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  if (!raw) return 'API URL not set'
  try {
    const u = new URL(raw)
    return u.host || raw
  } catch {
    return raw.replace(/^https?:\/\//i, '').slice(0, 48)
  }
}

/** staging | production | local | unknown — for banner color */
export const getAdminApiEnvKind = () => {
  const host = getAdminApiEnvLabel().toLowerCase()
  if (!host || host === 'api url not set') return 'unknown'
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'local'
  if (host.includes('staging') || host.includes('stg') || host.includes('dev')) return 'staging'
  if (host.includes('api.netqwix') || host.includes('prod')) return 'production'
  // Heuristic: non-local without staging keyword → treat as prod-risk
  return 'production'
}

export const getAdminApiEnvBannerCopy = () => {
  const host = getAdminApiEnvLabel()
  const kind = getAdminApiEnvKind()
  const tag =
    kind === 'production' ? 'PROD API' : kind === 'staging' ? 'STAGING API' : kind === 'local' ? 'LOCAL API' : 'API'
  return { tag, host, kind }
}

export const getWebPreviewBase = () =>
  (process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://www.netqwix.com').replace(/\/$/, '')

export const showAdminMfaNotice = () =>
  String(process.env.NEXT_PUBLIC_ADMIN_MFA_NOTICE || '').toLowerCase() === 'true'
