import LogRocket from 'logrocket'

export const LOGROCKET_SESSION_HEADER = 'X-LogRocket-URL'
const DEFAULT_APP_ID = 'kzg9vc/netqwix'

function readAppId() {
  return String(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID ?? DEFAULT_APP_ID)
    .replace(/^['"]|['"]$/g, '')
    .trim()
}

export function initLogRocket() {
  const appId = readAppId()
  if (!appId || typeof window === 'undefined') return

  try {
    LogRocket.init(appId, {
      network: {
        requestSanitizer: request => {
          const headers = { ...request.headers }
          if (headers.authorization) headers.authorization = ''
          if (headers.Authorization) headers.Authorization = ''
          return { ...request, headers }
        }
      }
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[LogRocket] init failed:', err)
    }
  }
}

export function getLogRocketSessionUrlSync() {
  if (typeof window === 'undefined') return null
  try {
    const sync = LogRocket.sessionURL
    return typeof sync === 'string' && sync.trim() ? sync.trim() : null
  } catch {
    return null
  }
}

export function identifyLogRocketUser(user) {
  if (!user || typeof window === 'undefined') return

  const userId = String(user._id ?? user.id ?? '').trim()
  if (!userId) return

  try {
    LogRocket.identify(userId, {
      email: user.email ? String(user.email) : undefined,
      name: String(user.fullname ?? user.fullName ?? '').trim() || undefined,
      accountType: String(user.account_type ?? user.accountType ?? '').trim() || undefined
    })
  } catch {
    // SDK still warming up.
  }
}

export function clearLogRocketUser() {
  if (typeof window === 'undefined') return
  try {
    LogRocket.identify(null)
  } catch {
    // ignore
  }
}
