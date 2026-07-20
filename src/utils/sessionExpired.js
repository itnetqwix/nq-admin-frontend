import { clearLogRocketUser } from 'src/lib/logrocket'
import { clearAuthStorage as clearStores } from 'src/utils/authStorage'

let sessionExpiredCallback = null
let handlingSessionExpired = false

export function registerSessionExpiredCallback(callback) {
  sessionExpiredCallback = callback
}

export function isUnauthorizedResponse(response) {
  return response?.status === 401
}

export function clearAuthStorage() {
  clearStores()
}

export function handleSessionExpired(message = 'Session expired. Please sign in again.') {
  if (typeof window === 'undefined' || handlingSessionExpired) return
  handlingSessionExpired = true

  clearAuthStorage()
  clearLogRocketUser()
  sessionExpiredCallback?.()

  if (!window.location.pathname.includes('/login')) {
    // lazy require avoids circular import issues in some SSR paths
    import('react-hot-toast').then(({ default: toast }) => toast.error(message)).catch(() => {})
    window.location.assign('/login')
  } else {
    handlingSessionExpired = false
  }
}
