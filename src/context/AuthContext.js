import { useEffect } from 'react'
import { installApiAuthHandler } from 'src/utils/installApiAuthHandler'
import { registerSessionExpiredCallback } from 'src/utils/sessionExpired'
import { useAppDispatch } from 'src/store/hooks'
import { bootstrapSession, sessionExpired } from 'src/store/slices/authSlice'

/**
 * Boots Redux auth once and bridges 401 → sessionExpired.
 * Auth state lives in the store; consumers use `useAuth()`.
 */
export function AuthProvider({ children }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    installApiAuthHandler()
    registerSessionExpiredCallback(() => {
      void dispatch(sessionExpired())
    })
    void dispatch(bootstrapSession())
    return () => registerSessionExpiredCallback(null)
  }, [dispatch])

  return children
}
