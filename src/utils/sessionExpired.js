import authConfig from 'src/configs/auth'
import toast from 'react-hot-toast'
import { clearLogRocketUser } from 'src/lib/logrocket'

let sessionExpiredCallback = null
let handlingSessionExpired = false

export function registerSessionExpiredCallback(callback) {
  sessionExpiredCallback = callback
}

export function isUnauthorizedResponse(response) {
  return response?.status === 401
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('userData')
  window.localStorage.removeItem(authConfig.storageTokenKeyName)
}

export function handleSessionExpired(message = 'Session expired. Please sign in again.') {
  if (typeof window === 'undefined' || handlingSessionExpired) return
  handlingSessionExpired = true

  clearAuthStorage()
  clearLogRocketUser()
  sessionExpiredCallback?.()

  if (!window.location.pathname.includes('/login')) {
    toast.error(message)
    window.location.assign('/login')
  } else {
    handlingSessionExpired = false
  }
}
