export * from 'src/utils/authStorage'
export { refreshAdminAccessToken } from 'src/utils/authRefresh'
export { adminFetch } from 'src/services/http'
export { installApiAuthHandler } from 'src/utils/installApiAuthHandler'

export function isAdminAccount(accountType, payload) {
  if (payload?.is_admin === true) return true
  if (String(payload?.admin_role || '').trim()) return true
  return String(accountType || '').trim().toLowerCase() === 'admin'
}
