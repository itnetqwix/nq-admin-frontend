// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Config Import
import { buildAbilityFor } from 'src/configs/acl'

// ** Component Import
import NotAuthorized from 'src/pages/401'
import Spinner from 'src/@core/components/spinner'
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Util Import
import getHomeRoute from 'src/layouts/components/acl/getHomeRoute'

const AclGuard = props => {
  // ** Props
  const { aclAbilities, children, guestGuard = false, authGuard = true } = props

  // ** Hooks
  const auth = useAuth()
  const router = useRouter()

  // ** Vars
  let ability
  useEffect(() => {
    if (auth.user && auth.user.account_type && !guestGuard && router.route === '/') {
      console.log(ability, "==========props -2", router.route)
      const homeRoute = getHomeRoute(auth.user.account_type)
      router.replace(homeRoute)
    }
  }, [auth.user, guestGuard, router])

  // User is logged in, build ability for the user based on his role

  if (auth.user && !ability) {
    console.log(ability, "==========props -1", router.route)
    ability = buildAbilityFor(auth.user.account_type, auth.user)
    if (router.route === '/') {
      return <Spinner />
    }
  }

  // If guest guard or no guard is true or any error page

  if (guestGuard || router.route === '/404' || router.route === '/500' || !authGuard) {
    console.log(ability, "==========props0", router.route)
    // If user is logged in and his ability is built
    if (auth.user && ability) {
      console.log(ability, "==========props0 01", router.route)
      return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
    } else {
      console.log(ability, "==========props0 02", router.route)
      // If user is not logged in (render pages like login, register etc..)
      return <>{children}</>
    }
  }

  // Check the access of current user and render pages

  // if (ability && auth.user && ability.can(aclAbilities.action, aclAbilities.subject)) {
  if (ability && auth.user) {
    console.log(ability, "==========props1", router.route, aclAbilities.action, aclAbilities.subject)
    if (router.route === '/') {
      return <Spinner />
    }

    return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
  }

  // Render Not Authorized component if the current user has limited access
  return (
    <BlankLayout>
      <NotAuthorized />
    </BlankLayout>
  )
}

export default AclGuard
