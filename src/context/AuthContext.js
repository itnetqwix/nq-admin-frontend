// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

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

  const getUserDetails = async (storedToken) => {
    if (storedToken) {
      setLoading(true)
      await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/user/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(data => {
          return data.json();
        })
        .then(async response => {

          window.localStorage.setItem(authConfig.storageTokenKeyName, storedToken);
          window.localStorage.setItem('userData', JSON.stringify(response.userInfo));

          setUser({ ...response.userInfo });

          const returnUrl = router.query.returnUrl;
          const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/';
          console.log("redirectURL====", redirectURL)
          router.replace(redirectURL)
          // router.push('/home')
          setLoading(false)
        })
        .catch(() => {
          localStorage.removeItem('userData')
          // localStorage.removeItem('refreshToken')
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
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
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
