/**
 * Run: node src/features/logs/clientSurface.selfcheck.js
 */
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}

function clientSurfaceFromRow(row = {}) {
  const at = String(row.account_type || row.actor?.account_type || '').toLowerCase()
  const path = String(row.path || '').toLowerCase()
  const c = String(row.client_type || row.client_surface || '').toLowerCase()
  const p = String(row.platform || '').toLowerCase()
  if (row.client_surface) return row.client_surface
  if (at === 'admin' || path.startsWith('/admin')) return 'admin'
  if (c === 'mobile' || p === 'ios' || p === 'android') return 'mobile'
  if (c === 'web' || c === 'desktop' || c === 'tablet' || p === 'web') return 'website'
  return 'unknown'
}

assert(clientSurfaceFromRow({ client_surface: 'mobile' }) === 'mobile', 'stored surface wins')
assert(clientSurfaceFromRow({ path: '/admin/users' }) === 'admin', 'admin path')
assert(clientSurfaceFromRow({ platform: 'ios' }) === 'mobile', 'ios is mobile')
assert(clientSurfaceFromRow({ client_type: 'web' }) === 'website', 'web is website')
assert(clientSurfaceFromRow({}) === 'unknown', 'empty is unknown')
console.log('clientSurface.selfcheck ok')
