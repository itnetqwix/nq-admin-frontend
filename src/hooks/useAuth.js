import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'

/** Single source of auth for guards, login, and MFA enroll. */
export const useAuth = () => useContext(AuthContext)

export default useAuth
