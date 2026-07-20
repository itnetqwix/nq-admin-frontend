/**
 * Auto eyebrows for AdminPageShell — every leftover page gets Ops Surface section labels.
 */
export const OPS_PAGE_EYEBROWS = {
  '/home': 'Overview',
  '/': 'Overview',
  '/apps/users': 'People · directory',
  '/apps/manage-trainer': 'People · trainers',
  '/apps/manage-trainee': 'People · trainees',
  '/apps/trainer-verifications': 'People · verifications',
  '/apps/trainee-account-reviews': 'People · trainee reviews',
  '/apps/account-deletions': 'People · deletions',
  '/apps/booking': 'Operations · bookings',
  '/apps/write-by-user': 'Operations · feedback',
  '/apps/concern-by-user': 'Operations · support',
  '/apps/call-diagnostics': 'Operations · calls',
  '/apps/platform-health': 'Operations · health',
  '/apps/platform-activity': 'Logs · platform',
  '/apps/logs': 'Logs · hub',
  '/apps/admin-roles': 'Admin access · RBAC',
  '/apps/audit-logs': 'Logs · audit',
  '/apps/ops-logs': 'Logs · operations',
  '/apps/finance': 'Revenue · finance',
  '/apps/finance/connect': 'Revenue · connect',
  '/apps/pricing': 'Revenue · pricing',
  '/apps/promo-codes': 'Revenue · promos',
  '/apps/referrals': 'Revenue · referrals',
  '/apps/broadcasts': 'Revenue · broadcasts',
  '/apps/banners': 'CMS · banners',
  '/apps/tips': 'CMS · tips',
  '/apps/cms': 'CMS · overview',
  '/apps/cms-blog': 'CMS · blog',
  '/apps/cms-legal': 'CMS · legal',
  '/apps/cms-faq': 'CMS · faq',
  '/apps/netqwix-library': 'Library · published',
  '/apps/library-submissions': 'Library · submissions',
  '/apps/clip-taxonomy': 'Library · taxonomy'
}

export function eyebrowForPath(pathname) {
  if (!pathname) return null
  if (OPS_PAGE_EYEBROWS[pathname]) return OPS_PAGE_EYEBROWS[pathname]
  // Dynamic routes e.g. /apps/users/[id]
  if (pathname.startsWith('/apps/users/')) return 'People · user 360'
  return null
}
