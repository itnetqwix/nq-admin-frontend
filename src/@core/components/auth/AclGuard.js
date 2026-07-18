// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Config Import
import { buildAbilityFor } from 'src/configs/acl'
import { subjectForPath } from 'src/configs/aclRouteSubjects'

// ** Component Import
import NotAuthorized from 'src/pages/401'
import Spinner from 'src/@core/components/spinner'
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Util Import
import getHomeRoute from 'src/layouts/components/acl/getHomeRoute'

function canAccessRoute(ability, aclAbilities, pathname) {
  if (!ability) return false
  if (ability.can('manage', 'all')) return true
  if (aclAbilities?.action && aclAbilities?.subject) {
    if (ability.can(aclAbilities.action, aclAbilities.subject)) return true
  }
  const routeSubject = subjectForPath(pathname)
  if (routeSubject && ability.can('read', routeSubject)) return true
  // Home / overview always for any admin with at least one nav ability
  if (pathname === '/home' || pathname === '/') {
    return ability.rules?.length > 0
  }
  return false
}

const AclGuard = props => {
  const { aclAbilities, children, guestGuard = false, authGuard = true } = props
  const auth = useAuth()
  const router = useRouter()

  let ability
  useEffect(() => {
    if (auth.user && auth.user.account_type && !guestGuard && router.route === '/') {
      const homeRoute = getHomeRoute(auth.user.account_type)
      router.replace(homeRoute)
    }
  }, [auth.user, guestGuard, router])

  if (auth.user && !ability) {
    ability = buildAbilityFor(auth.user.account_type, auth.user)
    if (router.route === '/') {
      return <Spinner />
    }
  }

  if (guestGuard || router.route === '/404' || router.route === '/500' || !authGuard) {
    if (auth.user && ability) {
      return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
    }
    return <>{children}</>
  }

  if (ability && auth.user && canAccessRoute(ability, aclAbilities, router.pathname)) {
    if (router.route === '/') {
      return <Spinner />
    }
    return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
  }

  return (
    <BlankLayout>
      <NotAuthorized />
    </BlankLayout>
  )
}

export default AclGuard
