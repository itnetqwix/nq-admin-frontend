import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import {
  clearAuthError,
  loginGoogle,
  loginPassword,
  logout as logoutThunk,
  selectAuth,
  setUser
} from 'src/store/slices/authSlice'

/**
 * Admin auth — Redux is the source of truth.
 */
export function useAuth() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector(selectAuth)
  const router = useRouter()

  const redirectAfterLogin = useCallback(() => {
    const returnUrl = router.query.returnUrl
    const redirectURL = returnUrl && returnUrl !== '/' ? String(returnUrl) : '/home'
    void router.replace(redirectURL)
  }, [router])

  const login = useCallback(
    (params, errorCallback) => {
      dispatch(clearAuthError())
      return dispatch(loginPassword(params))
        .unwrap()
        .then(() => redirectAfterLogin())
        .catch(err => {
          if (errorCallback) errorCallback(typeof err === 'string' ? err : err?.message || 'Login failed')
        })
    },
    [dispatch, redirectAfterLogin]
  )

  const loginWithGoogle = useCallback(
    (payload, errorCallback) => {
      dispatch(clearAuthError())
      return dispatch(loginGoogle(payload))
        .unwrap()
        .then(() => redirectAfterLogin())
        .catch(err => {
          if (errorCallback) errorCallback(typeof err === 'string' ? err : err?.message || 'Google sign-in failed')
        })
    },
    [dispatch, redirectAfterLogin]
  )

  const logout = useCallback(() => {
    void dispatch(logoutThunk()).then(() => {
      void router.push('/login')
    })
  }, [dispatch, router])

  return {
    user: auth.user,
    loading: auth.loading || !auth.bootstrapped,
    bootstrapped: auth.bootstrapped,
    error: auth.error,
    status: auth.status,
    lastMethod: auth.lastMethod,
    setUser: next => dispatch(setUser(next)),
    clearError: () => dispatch(clearAuthError()),
    login,
    loginWithGoogle,
    logout
  }
}

export default useAuth
