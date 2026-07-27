// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Config
import authConfig from 'src/configs/auth'
import toast from 'react-hot-toast'

// ** Defaults
const defaultProvider = {
  user: null,
  loading: false,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  completeTwoFactor: () => Promise.resolve(),
  mfaEnrollmentRequired: false
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false)
  const [pendingChallengeToken, setPendingChallengeToken] = useState(null)

  const router = useRouter()
  useEffect(() => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (storedToken) getUserDetails(storedToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isAdminAccount = accountType => {
    if (!accountType) return false
    return String(accountType).trim().toLowerCase() === 'admin'
  }

  const finishWithToken = (accessToken, extras = {}) => {
    if (extras.mfa_enrollment_required) {
      setMfaEnrollmentRequired(true)
      window.localStorage.setItem('nq:admin_mfa_enroll', '1')
    } else {
      setMfaEnrollmentRequired(false)
      window.localStorage.removeItem('nq:admin_mfa_enroll')
    }
    getUserDetails(accessToken, extras.mfa_enrollment_required)
  }

  const handleLogin = (params, errorCallback) => {
    setLoading(true)
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/login', options)
      .then(data => data.json())
      .then(response => {
        if (response?.code === 400 || response?.status === 'fail') {
          setLoading(false)
          if (errorCallback) errorCallback(response?.error || 'Email or Password is invalid')
          return
        }

        const payload = response?.result?.data ?? response?.data ?? {}
        if (payload.two_factor_required && payload.challenge_token) {
          setPendingChallengeToken(payload.challenge_token)
          setLoading(false)
          router.push('/login/mfa')
          return
        }

        const accountType = payload?.account_type
        const accessToken = payload?.access_token

        if (!accessToken) {
          setLoading(false)
          if (errorCallback) errorCallback('Login failed: access token not found.')
          return
        }

        if (isAdminAccount(accountType)) {
          finishWithToken(accessToken, {
            mfa_enrollment_required: !!payload.mfa_enrollment_required
          })
        } else {
          setLoading(false)
          if (errorCallback) errorCallback('Please login with admin account')
        }
      })
      .catch(e => {
        setLoading(false)
        if (errorCallback) errorCallback(e?.error || e?.message || 'Unable to login right now.')
      })
  }

  const completeTwoFactor = (code, errorCallback) => {
    if (!pendingChallengeToken) {
      if (errorCallback) errorCallback('No pending MFA challenge. Sign in again.')
      return
    }
    setLoading(true)
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/2fa/challenge', {
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
        finishWithToken(accessToken)
      })
      .catch(e => {
        setLoading(false)
        if (errorCallback) errorCallback(e?.message || 'MFA failed')
      })
  }

  const getUserDetails = async (storedToken, forceEnroll = false) => {
    if (storedToken) {
      setLoading(true)
      await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/user/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(data => data.json())
        .then(async response => {
          window.localStorage.setItem(authConfig.storageTokenKeyName, storedToken)
          window.localStorage.setItem('userData', JSON.stringify(response.userInfo))
          setUser({ ...response.userInfo })

          const enrollFlag =
            forceEnroll || window.localStorage.getItem('nq:admin_mfa_enroll') === '1'
          if (enrollFlag) {
            setMfaEnrollmentRequired(true)
            router.replace('/pages/mfa-enroll')
            setLoading(false)
            return
          }

          const returnUrl = router.query.returnUrl
          const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
          router.replace(redirectURL)
          setLoading(false)
        })
        .catch(() => {
          localStorage.removeItem('userData')
          localStorage.removeItem('accessToken')
          setLoading(false)
          if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
            toast.error('Session expired. Please sign in again.')
            router.replace('/login')
          }
        })
    } else {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setMfaEnrollmentRequired(false)
    setPendingChallengeToken(null)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    window.localStorage.removeItem('nq:admin_mfa_enroll')
    router.push('/login')
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    completeTwoFactor,
    mfaEnrollmentRequired,
    clearMfaEnrollment: () => {
      setMfaEnrollmentRequired(false)
      window.localStorage.removeItem('nq:admin_mfa_enroll')
    }
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
