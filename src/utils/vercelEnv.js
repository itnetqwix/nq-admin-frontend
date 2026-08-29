/** ponytail: Vercel injects VERCEL_ENV at build — auto-pick staging EC2 API on Preview. */

const PROD_API = 'https://api-netqwix.com'
const STAGING_API = 'https://api-netqwix.online'
const PROD_WEB = 'https://www.netqwix.com'
const STAGING_WEB = 'https://staging-netqwix.com'
const STAGING_ADMIN = 'https://admin-staging.netqwix.com'

const trimSlash = (url) => String(url || '').trim().replace(/\/+$/, '')

export function resolvePublicApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL
  if (typeof raw === 'string' && raw.trim()) return trimSlash(raw)

  if (process.env.VERCEL_ENV === 'production') return PROD_API
  if (process.env.VERCEL_ENV === 'preview') return STAGING_API
  if (process.env.NODE_ENV === 'development') return STAGING_API
  return PROD_API
}

export function resolveWebAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_WEB_APP_URL
  if (typeof raw === 'string' && raw.trim()) return trimSlash(raw)

  if (process.env.VERCEL_ENV === 'production') return trimSlash(PROD_WEB)
  if (process.env.VERCEL_ENV === 'preview') {
    const branch = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim()
    if (branch === 'staging') return trimSlash(STAGING_WEB)
    const host = String(process.env.VERCEL_URL || '').trim()
    if (host) return `https://${host.replace(/\/+$/, '')}`
    return trimSlash(STAGING_WEB)
  }
  if (process.env.NODE_ENV === 'development') return trimSlash(STAGING_WEB)
  return trimSlash(PROD_WEB)
}

export function resolveAdminPublicOrigin() {
  if (process.env.VERCEL_ENV === 'production') return 'https://admin.netqwix.com'
  if (process.env.VERCEL_ENV === 'preview') {
    const branch = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim()
    if (branch === 'staging') return trimSlash(STAGING_ADMIN)
    const host = String(process.env.VERCEL_URL || '').trim()
    if (host) return `https://${host.replace(/\/+$/, '')}`
    return trimSlash(STAGING_ADMIN)
  }
  return 'http://localhost:3001'
}
