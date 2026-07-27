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
  useEffect(
    () => {
      if (!router.isReady) {
        return
      }
      if (auth.user === null && !window.localStorage.getItem('userData')) {
        if (router.asPath !== '/') {
          router.replace({
            pathname: '/login',
            query: { returnUrl: router.asPath }
          })
        } else {
          router.replace('/login')
        }

        return
      }
      // ponytail: lock all routes until TOTP enroll finishes when backend requires MFA
      if (auth.mfaEnrollmentRequired && !router.pathname.startsWith(MFA_ENROLL_PATH)) {
        router.replace(MFA_ENROLL_PATH)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.route, router.isReady, auth.mfaEnrollmentRequired, auth.user]
  )
  if (auth.loading || auth.user === null) {
    return fallback
  }
  if (auth.mfaEnrollmentRequired && !router.pathname.startsWith(MFA_ENROLL_PATH)) {
    return fallback
  }

  return <>{children}</>
}

export default AuthGuard
