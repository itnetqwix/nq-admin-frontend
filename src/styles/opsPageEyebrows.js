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
  '/apps/audit-logs': 'Logs · audit',
  '/apps/ops-logs': 'Logs · operations',
  '/apps/finance': 'Business · finance',
  '/apps/finance/connect': 'Business · connect',
  '/apps/pricing': 'Business · pricing',
  '/apps/promo-codes': 'Business · promos',
  '/apps/referrals': 'Business · referrals',
  '/apps/broadcasts': 'Business · broadcasts',
  '/apps/banners': 'Content · banners',
  '/apps/tips': 'Content · tips',
  '/apps/cms': 'Content · cms',
  '/apps/cms-blog': 'Content · blog',
  '/apps/cms-legal': 'Content · legal',
  '/apps/cms-faq': 'Content · faq',
  '/apps/netqwix-library': 'Clips · library',
  '/apps/library-submissions': 'Clips · submissions',
  '/apps/clip-taxonomy': 'Clips · taxonomy'
}

export function eyebrowForPath(pathname) {
  if (!pathname) return null
  if (OPS_PAGE_EYEBROWS[pathname]) return OPS_PAGE_EYEBROWS[pathname]
  // Dynamic routes e.g. /apps/users/[id]
  if (pathname.startsWith('/apps/users/')) return 'People · user 360'
  return null
}
