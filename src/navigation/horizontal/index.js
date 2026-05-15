const navigation = () => [
  {
    title: 'Home',
    path: '/home',
    icon: 'mdi:home-outline',
    action: 'read',
    subject: 'admin-nav-home'
  },
  {
    title: 'Manage Trainer',
    path: '/apps/manage-trainer',
    icon: 'mdi:human-male-board',
    action: 'read',
    subject: 'admin-nav-trainers'
  },
  {
    title: 'Trainer verifications',
    path: '/apps/trainer-verifications',
    icon: 'mdi:account-check-outline',
    action: 'read',
    subject: 'admin-nav-trainer-verifications'
  },
  {
    title: 'Manage Trainee',
    path: '/apps/manage-trainee',
    icon: 'mdi:account-school-outline',
    action: 'read',
    subject: 'admin-nav-trainees'
  },
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
    icon: 'mdi:account-question',
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
  },
  {
    title: 'Call diagnostics',
    path: '/apps/call-diagnostics',
    icon: 'mdi:video-outline',
    action: 'read',
    subject: 'admin-nav-call-diagnostics'
  }
]

export default navigation
