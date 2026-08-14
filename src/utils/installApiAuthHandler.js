import { getApiBaseUrl } from 'src/utils/apiBase'
import { handleSessionExpired, isUnauthorizedResponse } from 'src/utils/sessionExpired'
import { getLogRocketSessionUrlSync, LOGROCKET_SESSION_HEADER } from 'src/lib/logrocket'
import { refreshAdminAccessToken } from 'src/utils/authRefresh'
import { readStoredToken } from 'src/utils/authStorage'

let installed = false

const resolveRequestUrl = input => {
  if (typeof input === 'string') return input
  if (input instanceof Request) return input.url
  return input?.url || ''
}

const isApiRequest = (url, apiBase) => {
  if (!apiBase || !url) return false
  return String(url).startsWith(apiBase.replace(/\/+$/, ''))
}

const isAuthSkip = url => /\/auth\/(login|refresh|logout|2fa)/.test(String(url))

export function installApiAuthHandler() {
  if (typeof window === 'undefined' || installed) return
  installed = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (...args) => {
    const url = resolveRequestUrl(args[0])
    const apiBase = getApiBaseUrl()
    const shouldTag = isApiRequest(url, apiBase) && !isAuthSkip(url)

    if (shouldTag) {
      const sessionUrl = getLogRocketSessionUrlSync()
      if (sessionUrl) {
        const [input, init] = args
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}))
        headers.set(LOGROCKET_SESSION_HEADER, sessionUrl)
        args[1] = { ...(init || {}), headers }
      }
    }

    let response = await originalFetch(...args)

    if (isApiRequest(url, apiBase) && !isAuthSkip(url) && isUnauthorizedResponse(response)) {
      const next = await refreshAdminAccessToken()
      if (next) {
        const [input, init] = args
        const headers = new Headers(init?.headers || {})
        headers.set('Authorization', `Bearer ${next}`)
        response = await originalFetch(input, { ...(init || {}), headers })
      }
      if (isUnauthorizedResponse(response)) handleSessionExpired()
    }

    return response
  }
}

export function currentAccessToken() {
  return readStoredToken()
}
