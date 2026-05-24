import { getApiBaseUrl } from 'src/utils/apiBase'
import { handleSessionExpired, isUnauthorizedResponse } from 'src/utils/sessionExpired'

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
    const response = await originalFetch(...args)
    const url = resolveRequestUrl(args[0])
    const apiBase = getApiBaseUrl()

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
