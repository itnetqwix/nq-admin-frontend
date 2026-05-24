// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Config
import authConfig from 'src/configs/auth'
import {
  clearAuthStorage,
  handleSessionExpired,
  isUnauthorizedResponse,
  registerSessionExpiredCallback
} from 'src/utils/sessionExpired'
import { installApiAuthHandler } from 'src/utils/installApiAuthHandler'

// ** Defaults
const defaultProvider = {
  user: null,
  loading: false,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)

  // ** Hooks
  const router = useRouter()

  useEffect(() => {
    installApiAuthHandler()
    registerSessionExpiredCallback(() => {
      setUser(null)
      setLoading(false)
    })
    return () => registerSessionExpiredCallback(null)
  }, [])

  useEffect(() => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
    if (storedToken) getUserDetails(storedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isAdminAccount = accountType => {
    if (!accountType) return false
    return String(accountType).trim().toLowerCase() === 'admin'
  }

  const handleLogin = (params, errorCallback) => {
    setLoading(true)
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    };
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/login', options)
      .then(data => {
        return data.json();
      }).then(response => {
        if (response?.code === 400 || response?.status === 'fail') {
          setLoading(false)
          if (errorCallback) errorCallback(response?.error || 'Email or Password is invalid')
          return;
        }

        const accountType = response?.result?.data?.account_type
        const accessToken = response?.result?.data?.access_token

        if (!accessToken) {
          setLoading(false)
          if (errorCallback) errorCallback('Login failed: access token not found.')
          return
        }

        if (isAdminAccount(accountType)) {
          getUserDetails(accessToken)
        } else {
          setLoading(false)
          if (errorCallback) errorCallback('Please login with admin account')
          return;
        }
      }).catch(e => {
        setLoading(false)
        if (errorCallback) errorCallback(e?.error || e?.message || 'Unable to login right now.')
      });

  }

  const getUserDetails = async storedToken => {
    if (!storedToken) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })

      if (isUnauthorizedResponse(res)) {
        handleSessionExpired()
        return
      }

      const response = await res.json()
      if (!response?.userInfo) {
        handleSessionExpired()
        return
      }

      if (!res.ok) {
        return
      }

      window.localStorage.setItem(authConfig.storageTokenKeyName, storedToken)
      window.localStorage.setItem('userData', JSON.stringify(response.userInfo))
      setUser({ ...response.userInfo })

      const returnUrl = router.query.returnUrl
      const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/home'
      router.replace(redirectURL)
    } catch {
      handleSessionExpired()
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    clearAuthStorage()
    router.push('/login')
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
