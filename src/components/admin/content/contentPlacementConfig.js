/**
 * Where tips & banners render in the NetQwix apps.
 * Shown in admin so editors know which audience tags map to which screen.
 */

export const TIPS_PLACEMENT = [
  {
    surface: 'Mobile — signed-in trainee home',
    path: 'Home tab → Discover (below welcome)',
    audiences: ['trainee', 'all'],
    notes: 'Horizontal “Tips for you” carousel'
  },
  {
    surface: 'Mobile — signed-in trainer home',
    path: 'Home tab → dashboard hub',
    audiences: ['trainer', 'all'],
    notes: 'Same carousel component'
  },
  {
    surface: 'Mobile — guest browse home',
    path: 'Home tab (not signed in)',
    audiences: ['all only'],
    notes: 'Tips with audience “Everyone” only; no login required'
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
    surface: 'Mobile — login',
    path: 'Sign in screen (top)',
    audiences: ['guest', 'all'],
    notes: 'Unauthenticated fetch; maintenance / promo for sign-in'
  },
  {
    surface: 'Mobile — guest browse home',
    path: 'Home tab (not signed in)',
    audiences: ['guest', 'all'],
    notes: 'Top strip above coach search'
  },
  {
    surface: 'Mobile — signed-in trainee home',
    path: 'Home tab → Discover',
    audiences: ['trainee', 'all'],
    notes: 'Highest-priority non-dismissed banner'
  },
  {
    surface: 'Mobile — signed-in trainer home',
    path: 'Home tab → trainer hub',
    audiences: ['trainer', 'all'],
    notes: 'Same strip component'
  },
  {
    surface: 'Web — login / dashboard',
    path: 'Not yet integrated',
    audiences: ['—'],
    notes: 'Planned: guest login + signed-in header'
  }
]

export const TIPS_AUDIENCE_HELP = {
  all: 'Everyone signed in + guest home (carousel)',
  trainer: 'Trainer home only',
  trainee: 'Trainee home only'
}

export const BANNERS_AUDIENCE_HELP = {
  guest: 'Login + guest home (no account)',
  trainee: 'Signed-in trainee home',
  trainer: 'Signed-in trainer home',
  all: 'All of the above'
}
