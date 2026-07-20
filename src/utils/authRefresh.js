import authConfig from 'src/configs/auth'
import { persistSession, readStoredRefreshToken, isRememberMeEnabled } from 'src/utils/authStorage'

const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || ''

let refreshInFlight = null

/**
 * Exchange refresh_token for a new access (+ rotated refresh).
 * Returns the new access token or null.
 */
export async function refreshAdminAccessToken() {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = readStoredRefreshToken()
    if (!refreshToken) return null
    try {
      const res = await fetch(`${apiBase()}${authConfig.refreshEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) return null
      const data =
        body?.result?.data ||
        body?.data?.data ||
        body?.data ||
        body
      const accessToken = data?.access_token
      const nextRefresh = data?.refresh_token || refreshToken
      if (!accessToken) return null
      persistSession(accessToken, null, {
        rememberMe: isRememberMeEnabled(),
        refreshToken: nextRefresh
      })
      return accessToken
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}
