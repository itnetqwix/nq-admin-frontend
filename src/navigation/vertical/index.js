/**
 * Admin sidebar — grouped by area. Section headers use `auth: false` (labels only).
 * Parent groups collapse children; keep child `subject` values aligned with `src/configs/acl.js`.
 */
const navigation = () => [
  {
    title: 'Home',
    path: '/home',
    icon: 'mdi:home-outline',
    action: 'read',
    subject: 'admin-nav-home'
  },
  { sectionTitle: 'People', auth: false },
  {
    title: 'Users',
    icon: 'mdi:account-group-outline',
    action: 'read',
    subject: 'admin-nav-people',
    children: [
      {
        title: 'Trainer verifications',
        path: '/apps/trainer-verifications',
        icon: 'mdi:account-check-outline',
        action: 'read',
        subject: 'admin-nav-trainer-verifications'
      },
      {
        title: 'Trainee reviews',
        path: '/apps/trainee-account-reviews',
        icon: 'mdi:account-clock-outline',
        action: 'read',
        subject: 'admin-nav-trainee-reviews'
      },
      {
        title: 'Trainers',
        path: '/apps/manage-trainer',
        icon: 'mdi:human-male-board',
        action: 'read',
        subject: 'admin-nav-trainers'
      },
      {
        title: 'Trainees',
        path: '/apps/manage-trainee',
        icon: 'mdi:account-school-outline',
        action: 'read',
        subject: 'admin-nav-trainees'
      },
      {
        title: 'Account deletions',
        path: '/apps/account-deletions',
        icon: 'mdi:account-remove-outline',
        action: 'read',
        subject: 'admin-nav-account-deletions'
      }
    ]
  },
  { sectionTitle: 'Mobile content', auth: false },
  {
    title: 'CMS & placements',
    icon: 'mdi:cellphone-cog',
    action: 'read',
    subject: 'admin-nav-content',
    children: [
      {
        title: 'Overview',
        path: '/apps/cms',
        icon: 'mdi:view-dashboard-outline',
        action: 'read',
        subject: 'admin-nav-cms-overview'
      },
      {
        title: 'Banners',
        path: '/apps/banners',
        icon: 'mdi:image-multiple-outline',
        action: 'read',
        subject: 'admin-nav-banners'
      },
      {
        title: 'Tips (offers)',
        path: '/apps/tips',
        icon: 'mdi:lightbulb-on-outline',
        action: 'read',
        subject: 'admin-nav-tips'
      },
      {
        title: 'Blog & pages',
        path: '/apps/cms-blog',
        icon: 'mdi:post-outline',
        action: 'read',
        subject: 'admin-nav-cms-blog'
      },
      {
        title: 'FAQ',
        path: '/apps/cms-faq',
        icon: 'mdi:help-circle-outline',
        action: 'read',
        subject: 'admin-nav-cms-faq'
      },
      {
        title: 'Legal',
        path: '/apps/cms-legal',
        icon: 'mdi:file-document-outline',
        action: 'read',
        subject: 'admin-nav-cms-legal'
      }
    ]
  },
  { sectionTitle: 'Clips & video', auth: false },
  {
    title: 'NetQwix Library',
    icon: 'mdi:video-box-outline',
    action: 'read',
    subject: 'admin-nav-clips-library',
    children: [
      {
        title: 'Categories',
        path: '/apps/clip-taxonomy',
        icon: 'mdi:folder-outline',
        action: 'read',
        subject: 'admin-nav-clip-taxonomy'
      },
      {
        title: 'Library requests',
        path: '/apps/library-submissions',
        icon: 'mdi:clipboard-check-outline',
        action: 'read',
        subject: 'admin-nav-library-submissions'
      },
      {
        title: 'Published clips',
        path: '/apps/netqwix-library',
        icon: 'mdi:library-outline',
        action: 'read',
        subject: 'admin-nav-netqwix-library'
      }
    ]
  },
  { sectionTitle: 'Operations', auth: false },
  {
    title: 'Platform ops',
    icon: 'mdi:cog-outline',
    action: 'read',
    subject: 'admin-nav-operations',
    children: [
      {
        title: 'Bookings',
        path: '/apps/booking',
        icon: 'mdi:briefcase-arrow-left-right-outline',
        action: 'read',
        subject: 'admin-nav-bookings'
      },
      {
        title: 'User feedback',
        path: '/apps/write-by-user',
        icon: 'mdi:message-text-outline',
        action: 'read',
        subject: 'admin-nav-user-feedback'
      },
      {
        title: 'Support tickets',
        path: '/apps/concern-by-user',
        icon: 'mdi:lifebuoy',
        action: 'read',
        subject: 'admin-nav-support-tickets'
      },
      {
        title: 'Call diagnostics',
        path: '/apps/call-diagnostics',
        icon: 'mdi:phone-in-talk-outline',
        action: 'read',
        subject: 'admin-nav-call-diagnostics'
      }
    ]
  },
  { sectionTitle: 'Logs & audit', auth: false },
  {
    title: 'Logs',
    icon: 'mdi:text-box-search-outline',
    action: 'read',
    subject: 'admin-nav-logs',
    children: [
      {
        title: 'Audit log',
        path: '/apps/audit-logs',
        icon: 'mdi:clipboard-text-clock-outline',
        action: 'read',
        subject: 'admin-nav-audit-logs'
      },
      {
        title: 'Operations log',
        path: '/apps/ops-logs',
        icon: 'mdi:alert-circle-outline',
        action: 'read',
        subject: 'admin-nav-ops-logs'
      }
    ]
  },
  { sectionTitle: 'Business', auth: false },
  {
    title: 'Revenue & growth',
    icon: 'mdi:chart-line',
    action: 'read',
    subject: 'admin-nav-business',
    children: [
      {
        title: 'Finance',
        path: '/apps/finance',
        icon: 'mdi:wallet-outline',
        action: 'read',
        subject: 'admin-nav-finance'
      },
      {
        title: 'Stripe Connect',
        path: '/apps/finance/connect',
        icon: 'mdi:bank-transfer',
        action: 'read',
        subject: 'admin-nav-finance'
      },
      {
        title: 'Pricing & fees',
        path: '/apps/pricing',
        icon: 'mdi:currency-usd',
        action: 'read',
        subject: 'admin-nav-pricing'
      },
      {
        title: 'Promo codes',
        path: '/apps/promo-codes',
        icon: 'mdi:tag-multiple-outline',
        action: 'read',
        subject: 'admin-nav-promo-codes'
      },
      {
        title: 'Referrals',
        path: '/apps/referrals',
        icon: 'mdi:account-arrow-right-outline',
        action: 'read',
        subject: 'admin-nav-referrals'
      },
      {
        title: 'Broadcasts',
        path: '/apps/broadcasts',
        icon: 'mdi:bullhorn-outline',
        action: 'read',
        subject: 'admin-nav-broadcasts'
      }
    ]
  }
]

export default navigation
