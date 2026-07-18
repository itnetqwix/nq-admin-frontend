import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import authConfig from 'src/configs/auth'
import {
  clearAuthStorage,
  isUnauthorizedResponse
} from 'src/utils/sessionExpired'
import { clearLogRocketUser, identifyLogRocketUser } from 'src/lib/logrocket'
import { identifyClarityUser } from 'src/lib/clarity'

const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || ''

function isAdminAccount(accountType) {
  return String(accountType || '')
    .trim()
    .toLowerCase() === 'admin'
}

function persistSession(token, userInfo) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(authConfig.storageTokenKeyName, token)
  if (userInfo) window.localStorage.setItem('userData', JSON.stringify(userInfo))
}

function readStoredToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(authConfig.storageTokenKeyName)
}

async function fetchMe(token) {
  const res = await fetch(`${apiBase()}/user/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (isUnauthorizedResponse(res)) {
    const err = new Error('UNAUTHORIZED')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  const response = await res.json()
  if (!res.ok || !response?.userInfo) {
    const err = new Error(response?.error || 'Unable to load profile')
    err.code = 'ME_FAILED'
    throw err
  }
  return response.userInfo
}

/** Cold start: token in localStorage → /user/me */
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  const token = readStoredToken()
  if (!token) return { user: null }
  try {
    const userInfo = await fetchMe(token)
    identifyLogRocketUser(userInfo)
    identifyClarityUser(userInfo)
    persistSession(token, userInfo)
    return { user: userInfo, token }
  } catch (e) {
    if (e?.code === 'UNAUTHORIZED') {
      clearAuthStorage()
      clearLogRocketUser()
      return { user: null }
    }
    return rejectWithValue(e?.message || 'Bootstrap failed')
  }
})

/** Email / password admin login */
export const loginPassword = createAsyncThunk(
  'auth/loginPassword',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const response = await res.json()
      if (response?.code === 400 || response?.status === 'fail' || !res.ok) {
        return rejectWithValue(response?.error || 'Email or Password is invalid')
      }
      const accountType = response?.result?.data?.account_type
      const accessToken = response?.result?.data?.access_token
      if (!accessToken) return rejectWithValue('Login failed: access token not found.')
      if (!isAdminAccount(accountType)) return rejectWithValue('Please login with admin account')

      const userInfo = await fetchMe(accessToken)
      persistSession(accessToken, userInfo)
      identifyLogRocketUser(userInfo)
      identifyClarityUser(userInfo)
      return { user: userInfo, token: accessToken, method: 'password' }
    } catch (e) {
      return rejectWithValue(e?.message || 'Unable to login right now.')
    }
  }
)

/** Google GIS → verify-google-login (existing Admin only) */
export const loginGoogle = createAsyncThunk(
  'auth/loginGoogle',
  async ({ email, id_token }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${apiBase()}/auth/verify-google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id_token })
      })
      const response = await res.json()

      if (response?.data?.isRegistered === false) {
        return rejectWithValue(
          'No NetQwix admin account for this Google email. Ask a Super Admin to create one.'
        )
      }
      if (!res.ok || response?.status === 'fail' || response?.status === 'FAIL') {
        return rejectWithValue(response?.error || response?.msg || 'Google sign-in failed')
      }

      const payload = response?.result?.data || response?.data?.data || response?.data
      const tokens = payload?.data || payload
      const accountType = tokens?.account_type
      const accessToken = tokens?.access_token
      if (!accessToken) return rejectWithValue('Google sign-in failed: no access token.')
      if (!isAdminAccount(accountType)) {
        return rejectWithValue('This Google account is not an administrator.')
      }

      const userInfo = await fetchMe(accessToken)
      persistSession(accessToken, userInfo)
      identifyLogRocketUser(userInfo)
      identifyClarityUser(userInfo)
      return { user: userInfo, token: accessToken, method: 'google' }
    } catch (e) {
      return rejectWithValue(e?.message || 'Google sign-in failed')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  clearLogRocketUser()
  clearAuthStorage()
  return null
})

export const sessionExpired = createAsyncThunk('auth/sessionExpired', async () => {
  // handleSessionExpired already clears storage + redirects; keep Redux in sync
  clearLogRocketUser()
  clearAuthStorage()
  return null
})

const initialState = {
  user: null,
  token: null,
  loading: true,
  bootstrapped: false,
  error: null,
  lastMethod: null, // password | google | null
  status: 'idle' // idle | authenticating | authenticated | anonymous
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload
      state.status = action.payload ? 'authenticated' : 'anonymous'
      if (action.payload) {
        try {
          window.localStorage.setItem('userData', JSON.stringify(action.payload))
        } catch {
          /* ignore */
        }
      }
    },
    setAuthLoading(state, action) {
      state.loading = Boolean(action.payload)
    },
    clearAuthError(state) {
      state.error = null
    },
    clearAuth(state) {
      state.user = null
      state.token = null
      state.loading = false
      state.error = null
      state.lastMethod = null
      state.status = 'anonymous'
    }
  },
  extraReducers: builder => {
    const pending = state => {
      state.loading = true
      state.error = null
      state.status = 'authenticating'
    }
    const rejected = (state, action) => {
      state.loading = false
      state.error = action.payload || action.error?.message || 'Request failed'
      state.status = state.user ? 'authenticated' : 'anonymous'
    }
    const fulfilledSession = (state, action) => {
      state.loading = false
      state.bootstrapped = true
      state.error = null
      state.user = action.payload?.user || null
      state.token = action.payload?.token || state.token
      state.lastMethod = action.payload?.method || state.lastMethod
      state.status = state.user ? 'authenticated' : 'anonymous'
    }

    builder
      .addCase(bootstrapSession.pending, state => {
        state.loading = true
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.loading = false
        state.bootstrapped = true
        state.user = action.payload?.user || null
        state.token = action.payload?.token || null
        state.status = state.user ? 'authenticated' : 'anonymous'
      })
      .addCase(bootstrapSession.rejected, state => {
        state.loading = false
        state.bootstrapped = true
        state.user = null
        state.token = null
        state.status = 'anonymous'
      })
      .addCase(loginPassword.pending, pending)
      .addCase(loginPassword.fulfilled, fulfilledSession)
      .addCase(loginPassword.rejected, rejected)
      .addCase(loginGoogle.pending, pending)
      .addCase(loginGoogle.fulfilled, fulfilledSession)
      .addCase(loginGoogle.rejected, rejected)
      .addCase(logout.fulfilled, state => {
        state.user = null
        state.token = null
        state.loading = false
        state.error = null
        state.lastMethod = null
        state.status = 'anonymous'
        state.bootstrapped = true
      })
      .addCase(sessionExpired.fulfilled, state => {
        state.user = null
        state.token = null
        state.loading = false
        state.error = null
        state.lastMethod = null
        state.status = 'anonymous'
      })
  }
})

export const { setUser, setAuthLoading, clearAuthError, clearAuth } = authSlice.actions

export const selectAuth = state => state.auth
export const selectUser = state => state.auth.user
export const selectAuthLoading = state => state.auth.loading
export const selectAuthBootstrapped = state => state.auth.bootstrapped
export const selectAuthError = state => state.auth.error
export const selectIsAuthenticated = state => Boolean(state.auth.user)

export default authSlice.reducer
