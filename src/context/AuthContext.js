// ** React Imports
import { createContext, useCallback, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Config
import authConfig from 'src/configs/auth'
import toast from 'react-hot-toast'

const MFA_ENROLL_PATH = '/pages/mfa-enroll'
const LOGIN_PATHS = ['/login', '/login/mfa', '/forgot-password', '/register', '/pages/reset-password']

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

function isAdminAccount(accountType) {
  return String(accountType || '')
    .trim()
    .toLowerCase() === 'admin'
}

function isLoginRoute(path) {
  return LOGIN_PATHS.some(p => path === p || path.startsWith(`${p}/`))
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

      // Prefer live API flag. Sticky localStorage alone must not override a clear API "not required".
      const apiRequires = !!(
        response?.mfa_enrollment_required === true ||
        response?.result?.mfa_enrollment_required === true
      )
      const force = opts.forceEnroll === true
      // Sticky flag only extends require when API also agrees OR we just got force from login.
      const sticky =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('nq:admin_mfa_enroll') === '1'
      const enroll = force || apiRequires || (sticky && apiRequires)

      // If API says MFA not required, always clear stale sticky flag.
      if (!apiRequires && !force) {
        markMfaEnrollment(false)
      } else {
        markMfaEnrollment(enroll)
      }

      window.localStorage.setItem(authConfig.storageTokenKeyName, opts.token)
      window.localStorage.setItem('userData', JSON.stringify(userInfo))
      setUser({ ...userInfo })

      const needEnroll = force || apiRequires
      if (needEnroll) {
        if (!router.pathname.startsWith(MFA_ENROLL_PATH)) {
          void router.replace(MFA_ENROLL_PATH)
        }
        return true
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
        applyMeResponse(response, { token: storedToken, forceEnroll: opts.forceEnroll })

        // Only hard-navigate to app home after explicit login/2fa — not every cold /me.
        if (opts.redirectHome && !opts.forceEnroll && !response.mfa_enrollment_required) {
          const returnUrl = router.query.returnUrl
          const redirectURL =
            returnUrl && returnUrl !== '/' ? String(returnUrl) : '/home'
          if (!router.pathname.startsWith('/home') && router.pathname !== redirectURL) {
            void router.replace(redirectURL)
          }
        }
      } catch {
        try {
          localStorage.removeItem('userData')
          localStorage.removeItem(authConfig.storageTokenKeyName)
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
    const storedToken =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(authConfig.storageTokenKeyName)
        : null
    if (storedToken) {
      void getUserDetails(storedToken, { redirectHome: false })
    } else {
      setLoading(false)
      setBootstrapped(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finishWithToken = (accessToken, extras = {}) => {
    markMfaEnrollment(!!extras.mfa_enrollment_required)
    void getUserDetails(accessToken, {
      forceEnroll: !!extras.mfa_enrollment_required,
      redirectHome: true
    })
  }

  const handleLogin = (params, errorCallback) => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
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

        const payload = response?.result?.data ?? response?.data ?? {}
        if (payload.two_factor_required && payload.challenge_token) {
          setPendingChallengeToken(payload.challenge_token)
          setLoading(false)
          setBootstrapped(true)
          void router.push('/login/mfa')
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
        if (!isAdminAccount(accountType)) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('Please login with admin account')
          return
        }
        finishWithToken(accessToken, {
          mfa_enrollment_required: !!payload.mfa_enrollment_required
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
      body: JSON.stringify({ email: payload?.email, id_token: payload?.id_token })
    })
      .then(r => r.json())
      .then(response => {
        if (response?.data?.isRegistered === false) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback)
            errorCallback('No NetQwix admin account for this Google email.')
          return
        }
        if (!response || response?.status === 'fail' || response?.status === 'FAIL') {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback(response?.error || response?.msg || 'Google sign-in failed')
          return
        }
        const tokens =
          response?.result?.data || response?.data?.data || response?.data || {}
        const body = tokens?.data || tokens
        const accessToken = body?.access_token
        const accountType = body?.account_type
        if (!accessToken) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('Google sign-in failed: no access token.')
          return
        }
        if (!isAdminAccount(accountType)) {
          setLoading(false)
          setBootstrapped(true)
          if (errorCallback) errorCallback('This Google account is not an administrator.')
          return
        }
        finishWithToken(accessToken, {
          mfa_enrollment_required: !!body?.mfa_enrollment_required
        })
      })
      .catch(e => {
        setLoading(false)
        setBootstrapped(true)
        if (errorCallback) errorCallback(e?.message || 'Google sign-in failed')
      })
  }

  const completeTwoFactor = (code, errorCallback) => {
    if (!pendingChallengeToken) {
      if (errorCallback) errorCallback('No pending MFA challenge. Sign in again.')
      return
    }
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/2fa/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_token: pendingChallengeToken, code })
    })
      .then(r => r.json())
      .then(response => {
        if (response?.status === 'fail' || response?.code === 400) {
          setLoading(false)
          if (errorCallback) errorCallback(response?.error || 'Invalid code')
          return
        }
        const payload = response?.result?.data ?? response?.data ?? {}
        const accessToken = payload?.access_token
        const accountType = payload?.account_type
        if (!accessToken || !isAdminAccount(accountType)) {
          setLoading(false)
          if (errorCallback) errorCallback('MFA succeeded but admin session missing.')
          return
        }
        setPendingChallengeToken(null)
        finishWithToken(accessToken, {
          mfa_enrollment_required: !!payload.mfa_enrollment_required
        })
      })
      .catch(e => {
        setLoading(false)
        if (errorCallback) errorCallback(e?.message || 'MFA failed')
      })
  }

  const handleLogout = () => {
    setUser(null)
    setPendingChallengeToken(null)
    markMfaEnrollment(false)
    try {
      window.localStorage.removeItem('userData')
      window.localStorage.removeItem(authConfig.storageTokenKeyName)
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
