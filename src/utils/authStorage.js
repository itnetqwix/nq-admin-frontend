import authConfig from 'src/configs/auth'

const EPHEMERAL_KEY = 'nq_admin_ephemeral'

export function isRememberMeEnabled() {
  if (typeof window === 'undefined') return true
  const flag = window.localStorage.getItem(authConfig.storageRememberKeyName)
  if (flag === null) return true
  return flag === '1'
}

export function setRememberMeFlag(rememberMe) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(authConfig.storageRememberKeyName, rememberMe ? '1' : '0')
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('userData')
  window.localStorage.removeItem(authConfig.storageTokenKeyName)
  window.localStorage.removeItem(authConfig.storageRefreshKeyName)
  window.sessionStorage.removeItem(EPHEMERAL_KEY)
}

export function readStoredToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(authConfig.storageTokenKeyName)
}

export function readStoredRefreshToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(authConfig.storageRefreshKeyName)
}

/**
 * If remember-me is off, tokens live only for this browser session.
 * sessionStorage marker disappears when the browser is fully closed.
 */
export function purgeIfEphemeralSessionEnded() {
  if (typeof window === 'undefined') return
  if (isRememberMeEnabled()) return
  if (window.sessionStorage.getItem(EPHEMERAL_KEY) === '1') return
  clearAuthStorage()
}

export function persistSession(token, userInfo, { rememberMe, refreshToken } = {}) {
  if (typeof window === 'undefined') return
  const remember = rememberMe ?? isRememberMeEnabled()
  const keepRefresh =
    refreshToken !== undefined ? refreshToken : readStoredRefreshToken()

  setRememberMeFlag(remember)
  if (token) {
    window.localStorage.setItem(authConfig.storageTokenKeyName, token)
  }
  if (keepRefresh) {
    window.localStorage.setItem(authConfig.storageRefreshKeyName, keepRefresh)
  } else if (refreshToken === null) {
    window.localStorage.removeItem(authConfig.storageRefreshKeyName)
  }
  if (userInfo) {
    window.localStorage.setItem('userData', JSON.stringify(userInfo))
  }

  if (remember) {
    window.sessionStorage.removeItem(EPHEMERAL_KEY)
  } else {
    window.sessionStorage.setItem(EPHEMERAL_KEY, '1')
  }
}
