import { useContext } from 'react'
import { AbilityContext } from 'src/layouts/components/acl/Can'

/**
 * Section titles hide when the user cannot read the section subject
 * (no more always-visible auth:false headers above empty groups).
 */
const CanViewNavSectionTitle = props => {
  const { children, navTitle } = props
  const ability = useContext(AbilityContext)

  if (!navTitle) return null
  if (navTitle.auth === false) return <>{children}</>
  if (!(navTitle.action && navTitle.subject)) return <>{children}</>
  return ability && ability.can(navTitle.action, navTitle.subject) ? <>{children}</> : null
}

export default CanViewNavSectionTitle
