/**
 * Resolves the public API base URL for browser fetches.
 * NEXT_PUBLIC_* is inlined at build time — ensure it is set in the env used for `next build`.
 */
export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL
  if (typeof raw !== 'string' || !raw.trim()) {
    return null
  }
  return raw.replace(/\/+$/, '')
}

export function requireApiBaseUrl() {
  const base = getApiBaseUrl()
  if (!base) {
    throw new Error(
      'API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL for this build (e.g. https://api-netqwix.com).'
    )
  }
  return base
}
