import { createContext, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import authConfig from 'src/configs/auth'
import toast from 'react-hot-toast'
import {
  clearAuthStorage,
  persistSession,
  purgeIfEphemeralSessionEnded,
  readStoredRefreshToken,
  readStoredToken
} from 'src/utils/authStorage'
import { installApiAuthHandler } from 'src/utils/installApiAuthHandler'
import { registerSessionExpiredCallback } from 'src/utils/sessionExpired'
import { isAdminAccount } from 'src/auth'

const MFA_ENROLL_PATH = '/pages/mfa-enroll'
const LOGIN_PATHS = ['/login', '/login/mfa', '/forgot-password', '/register', '/pages/reset-password']
const CHALLENGE_KEY = 'nq_admin_mfa_challenge'

const defaultProvider = {
  user: null,
  loading: true,
  bootstrapped: false,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  loginWithGoogle: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  completeTwoFactor: () => Promise.resolve(),
  mfaEnrollmentRequired: false,
  clearMfaEnrollment: () => null
}

const AuthContext = createContext(defaultProvider)

function isLoginRoute(path) {
  return LOGIN_PATHS.some(p => path === p || path.startsWith(`${p}/`))
}

function readChallenge() {
  try {
    return window.sessionStorage.getItem(CHALLENGE_KEY)
  } catch {
    return null
  }
}

function writeChallenge(token) {
  try {
    if (token) window.sessionStorage.setItem(CHALLENGE_KEY, token)
    else window.sessionStorage.removeItem(CHALLENGE_KEY)
  } catch {
    /* ignore */
  }
}

function pickTokens(response) {
  return response?.result?.data ?? response?.data?.data ?? response?.data ?? {}
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false)
  const [pendingChallengeToken, setPendingChallengeToken] = useState(null)

  const router = useRouter()

  const clearMfaEnrollment = useCallback(() => {
    setMfaEnrollmentRequired(false)
    try {
      window.localStorage.removeItem('nq:admin_mfa_enroll')
    } catch {
      /* ignore */
    }
  }, [])

  const markMfaEnrollment = useCallback(required => {
    setMfaEnrollmentRequired(!!required)
    try {
      if (required) window.localStorage.setItem('nq:admin_mfa_enroll', '1')
      else window.localStorage.removeItem('nq:admin_mfa_enroll')
    } catch {
      /* ignore */
    }
  }, [])

  const applyMeResponse = useCallback(
    (response, opts = {}) => {
      const userInfo = response?.userInfo
      if (!userInfo) return false

      const apiRequires = !!(
        response?.mfa_enrollment_required === true ||
        response?.result?.mfa_enrollment_required === true
      )
      const force = opts.forceEnroll === true
      const sticky =
        typeof window !== 'undefined' && window.localStorage.getItem('nq:admin_mfa_enroll') === '1'
      const enroll = force || apiRequires || (sticky && apiRequires)

      if (!apiRequires && !force) markMfaEnrollment(false)
      else markMfaEnrollment(enroll)

      persistSession(opts.token, userInfo, {
        rememberMe: opts.rememberMe,
        refreshToken: opts.refreshToken
      })
      setUser({ ...userInfo })

      if (force || apiRequires) {
        if (!router.pathname.startsWith(MFA_ENROLL_PATH)) {
          void router.replace(MFA_ENROLL_PATH)
        }
      }
      return true
    },
    [markMfaEnrollment, router]
  )

  const getUserDetails = useCallback(
    async (storedToken, opts = {}) => {
      if (!storedToken) {
        setUser(null)
        markMfaEnrollment(false)
        setLoading(false)
        setBootstrapped(true)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
        const response = await res.json().catch(() => ({}))
        if (!res.ok || !response?.userInfo) {
          throw new Error(response?.error || 'session')
        }
        applyMeResponse(response, {
          token: storedToken,
          forceEnroll: opts.forceEnroll,
          rememberMe: opts.rememberMe,
          refreshToken: opts.refreshToken
        })

        if (opts.redirectHome && !opts.forceEnroll && !response.mfa_enrollment_required) {
          const returnUrl = router.query.returnUrl
          const redirectURL = returnUrl && returnUrl !== '/' ? String(returnUrl) : '/home'
          if (!router.pathname.startsWith('/home') && router.pathname !== redirectURL) {
            void router.replace(redirectURL)
          }
        }
      } catch {
        try {
          clearAuthStorage()
        } catch {
          /* ignore */
        }
        setUser(null)
        markMfaEnrollment(false)
        if (
          authConfig.onTokenExpiration === 'logout' &&
          !isLoginRoute(router.pathname) &&
          !router.pathname.startsWith(MFA_ENROLL_PATH)
        ) {
          toast.error('Session expired. Please sign in again.')
          void router.replace('/login')
        }
      } finally {
        setLoading(false)
        setBootstrapped(true)
      }
    },
    [applyMeResponse, markMfaEnrollment, router]
  )

  useEffect(() => {
    installApiAuthHandler()
    registerSessionExpiredCallback(() => {
      setUser(null)
      setPendingChallengeToken(null)
      writeChallenge(null)
    })
    purgeIfEphemeralSessionEnded()
    const storedToken = readStoredToken()
    if (storedToken) {
      void getUserDetails(storedToken, { redirectHome: false })
    } else {
      setPendingChallengeToken(readChallenge())
      setLoading(false)
      setBootstrapped(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finishWithToken = (accessToken, extras = {}) => {
    markMfaEnrollment(!!extras.mfa_enrollment_required)
    persistSession(accessToken, null, {
      rememberMe: extras.rememberMe,
      refreshToken: extras.refreshToken ?? null
    })
    void getUserDetails(accessToken, {
      forceEnroll: !!extras.mfa_enrollment_required,
      redirectHome: true,
      rememberMe: extras.rememberMe,
      refreshToken: extras.refreshToken
    })
  }

  const goMfa = (challengeToken, rememberMe) => {
    setPendingChallengeToken(challengeToken)
    writeChallenge(challengeToken)
    const returnUrl = router.query.returnUrl
    const q = new URLSearchParams()
    if (returnUrl) q.set('returnUrl', String(returnUrl))
    if (rememberMe === false) q.set('remember', '0')
    const qs = q.toString()
    void router.push(qs ? `/login/mfa?${qs}` : '/login/mfa')
  }

  const handleLogin = (params, errorCallback) => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${authConfig.loginEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
      .then(data => data.json())
      .then(response => {
        if (response?.code === 400 || response?.status === 'fail') {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback(response?.error || 'Email or Password is invalid')
          return
        }

        const payload = pickTokens(response)
        if (payload.two_factor_required && payload.challenge_token) {
          setLoading(false)
          setBootstrapped(true)
          goMfa(payload.challenge_token, params.rememberMe)
          return
        }

        const accountType = payload?.account_type
        const accessToken = payload?.access_token
        if (!accessToken) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('Login failed: access token not found.')
          return
        }
        if (!isAdminAccount(accountType, payload)) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('Please login with admin account')
          return
        }
        finishWithToken(accessToken, {
          mfa_enrollment_required: !!payload.mfa_enrollment_required,
          rememberMe: params.rememberMe,
          refreshToken: payload.refresh_token || null
        })
      })
      .catch(e => {
        setLoading(false)
        setBootstrapped(true)
        if (errorCallback) errorCallback(e?.error || e?.message || 'Unable to login right now.')
      })
  }

  const handleLoginWithGoogle = (payload, errorCallback) => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload?.email, id_token: payload?.id_token, rememberMe: payload?.rememberMe })
    })
      .then(r => r.json())
      .then(response => {
        if (response?.data?.isRegistered === false) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('No NetQwix admin account for this Google email.')
          return
        }
        if (!response || response?.status === 'fail' || response?.status === 'FAIL') {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback(response?.error || response?.msg || 'Google sign-in failed')
          return
        }
        const body = pickTokens(response)
        const accessToken = body?.access_token
        const accountType = body?.account_type
        if (!accessToken) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('Google sign-in failed: no access token.')
          return
        }
        if (!isAdminAccount(accountType, body)) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('This Google account is not an administrator.')
          return
        }
        finishWithToken(accessToken, {
          mfa_enrollment_required: !!body?.mfa_enrollment_required,
          rememberMe: payload?.rememberMe,
          refreshToken: body.refresh_token || null
        })
      })
      .catch(e => {
        setLoading(false)
        setBootstrapped(true)
        if (errorCallback) errorCallback(e?.message || 'Google sign-in failed')
      })
  }

  const completeTwoFactor = (code, errorCallback) => {
    const challenge = pendingChallengeToken || readChallenge()
    if (!challenge) {
      if (errorCallback) errorCallback('No pending MFA challenge. Sign in again.')
      return
    }
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/2fa/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_token: challenge, code })
    })
      .then(r => r.json())
      .then(response => {
        if (response?.status === 'fail' || response?.code === 400) {
          setLoading(false)
          if (errorCallback) errorCallback(response?.error || 'Invalid code')
          return
        }
        const payload = pickTokens(response)
        const accessToken = payload?.access_token
        const accountType = payload?.account_type
        if (!accessToken || !isAdminAccount(accountType, payload)) {
          setLoading(false)
          if (errorCallback) errorCallback('MFA succeeded but admin session missing.')
          return
        }
        setPendingChallengeToken(null)
        writeChallenge(null)
        const rememberMe = router.query.remember !== '0'
        finishWithToken(accessToken, {
          mfa_enrollment_required: !!payload.mfa_enrollment_required,
          rememberMe,
          refreshToken: payload.refresh_token || null
        })
      })
      .catch(e => {
        setLoading(false)
        if (errorCallback) errorCallback(e?.message || 'MFA failed')
      })
  }

  const handleLogout = () => {
    const refresh = readStoredRefreshToken()
    const base = process.env.NEXT_PUBLIC_API_BASE_URL
    if (refresh && base) {
      void fetch(`${base}${authConfig.logoutEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh })
      }).catch(() => {})
    }
    setUser(null)
    setPendingChallengeToken(null)
    writeChallenge(null)
    markMfaEnrollment(false)
    try {
      clearAuthStorage()
      window.localStorage.removeItem('nq:admin_mfa_enroll')
    } catch {
      /* ignore */
    }
    setLoading(false)
    setBootstrapped(true)
    void router.push('/login')
  }

  const values = {
    user,
    loading,
    bootstrapped,
    setUser,
    setLoading,
    login: handleLogin,
    loginWithGoogle: handleLoginWithGoogle,
    logout: handleLogout,
    completeTwoFactor,
    mfaEnrollmentRequired,
    clearMfaEnrollment
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
