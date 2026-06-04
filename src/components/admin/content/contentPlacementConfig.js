/**
 * Where tips & banners render in the NetQwix apps.
 * Shown in admin so editors know which audience + placement tags map to which screen.
 */

export const TIPS_PLACEMENT = [
  {
    surface: 'Mobile — marketplace home (all roles)',
    path: 'Home tab → below hero carousel',
    audiences: ['trainee', 'trainer', 'all'],
    notes: 'Horizontal “✦ OFFERS FOR YOU ✦” carousel (Tips CMS)'
  },
  {
    surface: 'Mobile — guest browse home',
    path: 'Home tab (not signed in)',
    audiences: ['all only'],
    notes: 'Tips with audience “Everyone” only'
  },
  {
    surface: 'Web — trainee / trainer dashboard',
    path: 'Not yet integrated',
    audiences: ['—'],
    notes: 'Planned: match mobile home placement'
  }
]

export const BANNERS_PLACEMENT = [
  {
    surface: 'Hero carousel',
    placement: 'hero',
    path: 'Home → under search header',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Large image cards, auto-advance interval from admin'
  },
  {
    surface: 'Announcement strip',
    placement: 'strip',
    path: 'Login screen + compact alerts',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Single dismissible strip (no carousel)'
  },
  {
    surface: 'Sticky bottom promo',
    placement: 'sticky_bottom',
    path: 'Home → above tab bar',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Blinkit-style slim promo with dismiss'
  }
]

export const TIPS_AUDIENCE_HELP = {
  all: 'Everyone signed in + guest home (offers carousel)',
  trainer: 'Trainer home only',
  trainee: 'Trainee home only'
}

export const BANNERS_AUDIENCE_HELP = {
  guest: 'Guest home + login (unauthenticated)',
  trainee: 'Signed-in trainee home',
  trainer: 'Signed-in trainer home',
  all: 'All of the above'
}

export const BANNERS_PLACEMENT_HELP = {
  hero: 'Hero carousel — use a wide image URL',
  strip: 'Compact strip — text-first announcements',
  sticky_bottom: 'Bottom promo bar — short title + optional body'
}
