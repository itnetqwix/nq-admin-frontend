/**
 * Where CMS content renders in NetQwix apps + pixel specs for admin previews.
 */

export const MOBILE_FRAME = {
  width: 390,
  height: 720,
  contentPadding: 16,
  get contentWidth() {
    return this.width - this.contentPadding * 2
  }
}

/** Recommended upload sizes & preview geometry (matches nq-mobile components). */
export const IMAGE_SPECS = {
  'banner.hero': {
    key: 'banner.hero',
    width: 1200,
    height: 540,
    aspectRatio: 1 / 0.45,
    label: 'Hero — 2.2:1 wide (e.g. 1200×540)',
    usesImage: true,
    previewHeight: Math.round(MOBILE_FRAME.contentWidth * 0.45)
  },
  'banner.strip': {
    key: 'banner.strip',
    usesImage: false,
    label: 'Strip — text + severity icon only (no image on mobile)',
    aspectRatio: null
  },
  'banner.sticky_bottom': {
    key: 'banner.sticky_bottom',
    usesImage: false,
    label: 'Sticky bar — pricetag icon only (images not shown on mobile)',
    aspectRatio: null
  },
  'tip.offers_carousel': {
    key: 'tip.offers_carousel',
    width: 192,
    height: 192,
    aspectRatio: 1,
    label: 'Offers carousel — 1:1 thumb 48×48pt (upload 192×192 @2x)',
    usesImage: true,
    cardWidthFraction: 0.72
  },
  'tip.dashboard_list': {
    key: 'tip.dashboard_list',
    usesImage: false,
    label: 'Trainer dashboard list — Ionicons name only (no image)',
    aspectRatio: null
  },
  'page.blog_cover': {
    key: 'page.blog_cover',
    width: 1200,
    height: 670,
    aspectRatio: 16 / 9,
    label: 'Blog article hero — ~16:9 (full width × 200pt)',
    usesImage: true,
    previewHeight: 200
  },
  'page.blog_list_thumb': {
    key: 'page.blog_list_thumb',
    width: 176,
    height: 176,
    aspectRatio: 1,
    label: 'Blog list — 1:1 thumb 88×88pt',
    usesImage: true,
    previewSize: 88
  },
  'page.static': {
    key: 'page.static',
    usesImage: false,
    label: 'Static page — body HTML in WebView (cover optional)',
    aspectRatio: null
  }
}

export function getImageSpec(surfaceKey) {
  return IMAGE_SPECS[surfaceKey] || null
}

export function bannerImageSpec(placement) {
  return getImageSpec(`banner.${placement || 'hero'}`)
}

export function blogImageSpec(type) {
  return type === 'page' ? getImageSpec('page.static') : getImageSpec('page.blog_cover')
}

export const TIPS_PLACEMENT = [
  {
    surface: 'Mobile — marketplace offers carousel',
    previewKey: 'tip.offers_carousel',
    path: 'Home tab → “✦ OFFERS FOR YOU ✦” band',
    audiences: ['trainee', 'trainer', 'all'],
    notes: 'Horizontal cards · 48×48 image thumb or pricetag fallback',
    imageSpec: IMAGE_SPECS['tip.offers_carousel']
  },
  {
    surface: 'Mobile — trainer dashboard list',
    previewKey: 'tip.dashboard_list',
    path: 'Trainer home → Tips for you',
    audiences: ['trainer'],
    notes: 'Vertical rows · icon field only · no cover image',
    imageSpec: IMAGE_SPECS['tip.dashboard_list']
  },
  {
    surface: 'Mobile — guest browse home',
    path: 'Home tab (not signed in)',
    previewKey: 'tip.offers_carousel',
    audiences: ['all only'],
    notes: 'Same offers carousel · audience “Everyone” only'
  }
]

export const BANNERS_PLACEMENT = [
  {
    surface: 'Hero carousel',
    placement: 'hero',
    previewKey: 'banner.hero',
    path: 'Home → under search header',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Full-bleed image · auto-advance · up to 2 CTAs',
    imageSpec: IMAGE_SPECS['banner.hero']
  },
  {
    surface: 'Announcement strip',
    placement: 'strip',
    previewKey: 'banner.strip',
    path: 'Login screen + compact alerts',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Severity icon · no image · legacy single CTA',
    imageSpec: IMAGE_SPECS['banner.strip']
  },
  {
    surface: 'Sticky bottom promo',
    placement: 'sticky_bottom',
    previewKey: 'banner.sticky_bottom',
    path: 'Home → above tab bar',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Pricetag icon · title + optional body · dismiss',
    imageSpec: IMAGE_SPECS['banner.sticky_bottom']
  }
]

export const BLOG_PLACEMENT = [
  {
    surface: 'Blog list',
    previewKey: 'page.blog_list_thumb',
    path: 'Home → Blogs',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: '88×88 cover thumb + title + excerpt',
    imageSpec: IMAGE_SPECS['page.blog_list_thumb']
  },
  {
    surface: 'Blog article',
    previewKey: 'page.blog_cover',
    path: 'Blogs → post detail',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Full-width hero 200pt + WebView body',
    imageSpec: IMAGE_SPECS['page.blog_cover']
  },
  {
    surface: 'Static page (e.g. About)',
    previewKey: 'page.static',
    path: 'Settings → About us (slug from CMS)',
    audiences: ['guest', 'trainee', 'trainer', 'all'],
    notes: 'Full-screen WebView when slug matches published page',
    imageSpec: IMAGE_SPECS['page.static']
  }
]

export const LEGAL_PLACEMENT = [
  {
    surface: 'Terms & Privacy',
    path: 'Signup · Settings · Guest settings',
    audiences: ['guest', 'trainee', 'trainer'],
    notes: 'In-app WebView · versioned OTA refresh · no store update'
  }
]

export const TIPS_AUDIENCE_HELP = {
  all: 'Everyone signed in + guest home (offers carousel)',
  trainer: 'Trainer home — carousel + dashboard tips list',
  trainee: 'Trainee home — offers carousel'
}

export const BANNERS_AUDIENCE_HELP = {
  guest: 'Guest home + login (unauthenticated)',
  trainee: 'Signed-in trainee home',
  trainer: 'Signed-in trainer home',
  all: 'All of the above'
}

export const BANNERS_PLACEMENT_HELP = {
  hero: 'Hero carousel — wide 2.2:1 image required for best results',
  strip: 'Compact strip — text-first; images are not displayed on mobile',
  sticky_bottom: 'Bottom promo — short title; images are not displayed on mobile'
}
