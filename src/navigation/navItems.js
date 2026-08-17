/**
 * Single sidebar source. Vertical + horizontal both re-export this.
 * Subjects must match src/configs/acl.js (admin-nav-*).
 */

const link = (title, path, icon, subject) => ({
  title,
  path,
  icon,
  action: 'read',
  subject
})

const navigation = () => [
  link('Home', '/home', 'mdi:home-outline', 'admin-nav-home'),
  {
    title: 'People',
    icon: 'mdi:account-group-outline',
    children: [
      link('Users', '/apps/users', 'mdi:account-search-outline', 'admin-nav-users-directory'),
      link('Trainers', '/apps/manage-trainer', 'mdi:human-male-board', 'admin-nav-trainers'),
      link(
        'Trainer verifications',
        '/apps/trainer-verifications',
        'mdi:account-check-outline',
        'admin-nav-trainer-verifications'
      ),
      link('Trainees', '/apps/manage-trainee', 'mdi:account-school-outline', 'admin-nav-trainees'),
      link(
        'Trainee reviews',
        '/apps/trainee-account-reviews',
        'mdi:account-convert-outline',
        'admin-nav-trainee-reviews'
      ),
      link(
        'Account deletions',
        '/apps/account-deletions',
        'mdi:account-off-outline',
        'admin-nav-account-deletions'
      )
    ]
  },
  {
    title: 'Money',
    icon: 'mdi:cash-multiple',
    children: [
      link('Bookings', '/apps/booking', 'mdi:briefcase-arrow-left-right-outline', 'admin-nav-bookings'),
      link('Finance', '/apps/finance', 'mdi:bank-outline', 'admin-nav-finance'),
      link(
        'Stripe Connect',
        '/apps/finance/connect',
        'mdi:credit-card-outline',
        'admin-nav-finance-connect'
      ),
      link('Pricing', '/apps/pricing', 'mdi:currency-usd', 'admin-nav-pricing'),
      link('Promo codes', '/apps/promo-codes', 'mdi:tag-multiple-outline', 'admin-nav-promo-codes'),
      link('Referrals', '/apps/referrals', 'mdi:gift-outline', 'admin-nav-referrals')
    ]
  },
  {
    title: 'Content',
    icon: 'mdi:view-dashboard-edit-outline',
    children: [
      link('CMS', '/apps/cms', 'mdi:view-dashboard-edit-outline', 'admin-nav-cms-overview'),
      link('Banners', '/apps/banners', 'mdi:image-multiple-outline', 'admin-nav-banners'),
      link('Tips', '/apps/tips', 'mdi:lightbulb-outline', 'admin-nav-tips'),
      link('Uploads', '/apps/cms/uploads', 'mdi:cloud-upload-outline', 'admin-nav-cms'),
      link('Blog & pages', '/apps/cms-blog', 'mdi:post-outline', 'admin-nav-cms-blog'),
      link('FAQ', '/apps/cms-faq', 'mdi:help-circle-outline', 'admin-nav-cms-faq'),
      link('Legal', '/apps/cms-legal', 'mdi:file-document-outline', 'admin-nav-cms-legal'),
      link('Careers', '/apps/careers', 'mdi:briefcase-outline', 'admin-nav-careers'),
      link('Broadcasts', '/apps/broadcasts', 'mdi:bullhorn-outline', 'admin-nav-broadcasts')
    ]
  },
  {
    title: 'Library',
    icon: 'mdi:video-box',
    children: [
      link(
        'Published clips',
        '/apps/netqwix-library',
        'mdi:play-box-multiple-outline',
        'admin-nav-netqwix-library'
      ),
      link('Clip categories', '/apps/clip-taxonomy', 'mdi:tag-outline', 'admin-nav-clip-taxonomy'),
      link(
        'Library requests',
        '/apps/library-submissions',
        'mdi:inbox-arrow-down-outline',
        'admin-nav-library-submissions'
      )
    ]
  },
  {
    title: 'Ops',
    icon: 'mdi:shield-account-outline',
    children: [
      link('Logs', '/apps/logs', 'mdi:text-box-search-outline', 'admin-nav-logs'),
      link(
        'Platform activity',
        '/apps/platform-activity',
        'mdi:chart-timeline-variant',
        'admin-nav-platform-activity'
      ),
      link('Support tickets', '/apps/concern-by-user', 'mdi:lifebuoy', 'admin-nav-support-tickets'),
      link('User feedback', '/apps/write-by-user', 'mdi:account-question', 'admin-nav-user-feedback'),
      link('Audit log', '/apps/audit-logs', 'mdi:clipboard-text-clock-outline', 'admin-nav-audit-logs'),
      link('Ops / errors', '/apps/ops-logs', 'mdi:alert-circle-outline', 'admin-nav-ops-logs'),
      link('Failed jobs', '/apps/failed-jobs', 'mdi:alert-octagon-outline', 'admin-nav-failed-jobs'),
      link(
        'Platform health',
        '/apps/platform-health',
        'mdi:heart-pulse',
        'admin-nav-platform-health'
      ),
      link('Call diagnostics', '/apps/call-diagnostics', 'mdi:video-outline', 'admin-nav-call-diagnostics'),
      link('Live lessons', '/apps/live-lessons', 'mdi:record-rec', 'admin-nav-call-diagnostics'),
      link('Admin roles', '/apps/admin-roles', 'mdi:shield-account-outline', 'admin-nav-admin-settings')
    ]
  }
]

export default navigation
