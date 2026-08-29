import { resolvePublicApiBaseUrl } from 'src/utils/vercelEnv'

/**
 * Resolves the public API base URL for browser fetches.
 * NEXT_PUBLIC_* overrides; otherwise Vercel Preview → staging EC2 API.
 */
export function getApiBaseUrl() {
  return resolvePublicApiBaseUrl()
}

export function requireApiBaseUrl() {
  return getApiBaseUrl()
}
