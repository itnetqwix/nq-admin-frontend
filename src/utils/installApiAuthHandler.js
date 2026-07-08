import { getApiBaseUrl } from 'src/utils/apiBase'
import { handleSessionExpired, isUnauthorizedResponse } from 'src/utils/sessionExpired'
import { getLogRocketSessionUrlSync, LOGROCKET_SESSION_HEADER } from 'src/lib/logrocket'

let installed = false

const resolveRequestUrl = input => {
  if (typeof input === 'string') return input
  if (input instanceof Request) return input.url
  return input?.url || ''
}

const isApiRequest = (url, apiBase) => {
  if (!apiBase || !url) return false
  const normalizedUrl = String(url)
  const normalizedBase = apiBase.replace(/\/+$/, '')
  return normalizedUrl.startsWith(normalizedBase)
}

const isAuthLoginRequest = url => /\/auth\/login(?:\?|$)/.test(String(url))

export function installApiAuthHandler() {
  if (typeof window === 'undefined' || installed) return
  installed = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (...args) => {
    const url = resolveRequestUrl(args[0])
    const apiBase = getApiBaseUrl()
    const shouldTag =
      isApiRequest(url, apiBase) && !isAuthLoginRequest(url)

    if (shouldTag) {
      const sessionUrl = getLogRocketSessionUrlSync()
      if (sessionUrl) {
        const [input, init] = args
        const headers = new Headers(init?.headers || {})
        headers.set(LOGROCKET_SESSION_HEADER, sessionUrl)
        args[1] = { ...(init || {}), headers }
      }
    }

    const response = await originalFetch(...args)

    if (
      isApiRequest(url, apiBase) &&
      !isAuthLoginRequest(url) &&
      isUnauthorizedResponse(response)
    ) {
      handleSessionExpired()
    }

    return response
  }
}
