// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'

const MFA_ENROLL_PATH = '/pages/mfa-enroll'

const AuthGuard = props => {
  const { children, fallback } = props
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady || !auth.bootstrapped) return

    if (auth.user === null) {
      if (router.asPath !== '/') {
        void router.replace({
          pathname: '/login',
          query: { returnUrl: router.asPath }
        })
      } else {
        void router.replace('/login')
      }
      return
    }

    // Prod backend returns mfa_enrollment_required until TOTP is enabled.
    if (auth.mfaEnrollmentRequired && !router.pathname.startsWith(MFA_ENROLL_PATH)) {
      void router.replace(MFA_ENROLL_PATH)
    }
  }, [
    router.isReady,
    router.asPath,
    router.pathname,
    auth.bootstrapped,
    auth.user,
    auth.mfaEnrollmentRequired,
    router
  ])

  if (!auth.bootstrapped || auth.loading || auth.user === null) {
    return fallback
  }
  if (auth.mfaEnrollmentRequired && !router.pathname.startsWith(MFA_ENROLL_PATH)) {
    return fallback
  }

  return <>{children}</>
}

export default AuthGuard
