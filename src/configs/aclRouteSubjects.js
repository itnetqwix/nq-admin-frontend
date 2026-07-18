/**
 * Map admin app routes → CASL subjects (nav keys).
 * Used by AclGuard when a page does not set Component.acl.
 */
export const ACL_ROUTE_SUBJECTS = {
  '/home': 'admin-nav-home',
  '/apps/manage-trainer': 'admin-nav-trainers',
  '/apps/manage-trainee': 'admin-nav-trainees',
  '/apps/trainer-verifications': 'admin-nav-trainer-verifications',
  '/apps/trainee-account-reviews': 'admin-nav-trainee-reviews',
  '/apps/account-deletions': 'admin-nav-account-deletions',
  '/apps/users': 'admin-nav-users-directory',
  '/apps/booking': 'admin-nav-bookings',
  '/apps/write-by-user': 'admin-nav-user-feedback',
  '/apps/concern-by-user': 'admin-nav-support-tickets',
  '/apps/call-diagnostics': 'admin-nav-call-diagnostics',
  '/apps/platform-activity': 'admin-nav-platform-activity',
  '/apps/audit-logs': 'admin-nav-audit-logs',
  '/apps/ops-logs': 'admin-nav-ops-logs',
  '/apps/logs': 'admin-nav-logs',
  '/apps/finance': 'admin-nav-finance',
  '/apps/finance/connect': 'admin-nav-finance-connect',
  '/apps/pricing': 'admin-nav-pricing',
  '/apps/promo-codes': 'admin-nav-promo-codes',
  '/apps/referrals': 'admin-nav-referrals',
  '/apps/broadcasts': 'admin-nav-broadcasts',
  '/apps/banners': 'admin-nav-banners',
  '/apps/tips': 'admin-nav-tips',
  '/apps/cms': 'admin-nav-cms-overview',
  '/apps/cms-blog': 'admin-nav-cms-blog',
  '/apps/cms-faq': 'admin-nav-cms-faq',
  '/apps/cms-legal': 'admin-nav-cms-legal',
  '/apps/netqwix-library': 'admin-nav-netqwix-library',
  '/apps/clip-taxonomy': 'admin-nav-clip-taxonomy',
  '/apps/library-submissions': 'admin-nav-library-submissions',
  '/apps/platform-health': 'admin-nav-platform-health',
  '/apps/admin-roles': 'admin-nav-admin-settings'
}

export function subjectForPath(pathname) {
  if (!pathname) return null
  if (ACL_ROUTE_SUBJECTS[pathname]) return ACL_ROUTE_SUBJECTS[pathname]
  if (pathname.startsWith('/apps/users/')) return 'admin-nav-users-directory'
  const keys = Object.keys(ACL_ROUTE_SUBJECTS).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (pathname === key || pathname.startsWith(key + '/')) return ACL_ROUTE_SUBJECTS[key]
  }
  return null
}
