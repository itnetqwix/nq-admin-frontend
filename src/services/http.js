/**
 * Authenticated fetch with single-flight refresh on 401.
 */
import { requireApiBaseUrl } from 'src/utils/apiBase'
import { readStoredToken } from 'src/utils/authStorage'
import { refreshAdminAccessToken } from 'src/utils/authRefresh'
import { handleSessionExpired } from 'src/utils/sessionExpired'

function resolvePath(path) {
  if (/^https?:\/\//i.test(path)) return path
  const base = requireApiBaseUrl()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export async function adminFetch(path, init = {}) {
  const url = resolvePath(path)
  const headers = new Headers(init.headers || {})
  const token = readStoredToken()
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const send = t => {
    if (t) headers.set('Authorization', `Bearer ${t}`)
    return fetch(url, { ...init, headers })
  }

  let res = await send(token)
  const skipRefresh = /\/auth\/(login|refresh|logout|2fa)/.test(String(path))
  if (res.status === 401 && !skipRefresh) {
    const next = await refreshAdminAccessToken()
    if (next) res = await send(next)
    if (res.status === 401) handleSessionExpired()
  }
  return res
}
