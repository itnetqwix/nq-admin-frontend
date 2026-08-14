// Keep clientSurface.selfcheck.js in sync with this mapping.
export function clientSurfaceFromRow(row = {}) {
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

export const SURFACE_FILTERS = [
  { value: '', label: 'All surfaces' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'website', label: 'Website' },
  { value: 'admin', label: 'Admin' }
]
