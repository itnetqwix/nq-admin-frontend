const navigation = () => {
  return [
    {
      title: 'Home',
      path: '/home',
      icon: 'mdi:home-outline',
      action: 'read',
      subject: 'admin-nav-home'
    },
    {
      title: 'People',
      icon: 'mdi:account-group-outline',
      children: [
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
        }
      ]
    },
    {
      title: 'Money',
      icon: 'mdi:cash-multiple',
      children: [
        {
          title: 'Bookings',
          path: '/apps/booking',
          icon: 'mdi:briefcase-arrow-left-right-outline',
          action: 'read',
          subject: 'admin-nav-bookings'
        }
      ]
    },
    {
      title: 'Ops',
      icon: 'mdi:shield-account-outline',
      children: [
        {
          title: 'Support tickets',
          path: '/apps/concern-by-user',
          icon: 'mdi:lifebuoy',
          action: 'read',
          subject: 'admin-nav-support-tickets'
        },
        {
          title: 'User feedback',
          path: '/apps/write-by-user',
          icon: 'mdi:account-question',
          action: 'read',
          subject: 'admin-nav-user-feedback'
        },
        {
          title: 'Failed jobs',
          path: '/apps/failed-jobs',
          icon: 'mdi:alert-octagon-outline',
          action: 'read',
          subject: 'admin-nav-failed-jobs'
        },
        {
          title: 'Audit log',
          path: '/apps/audit-logs',
          icon: 'mdi:clipboard-text-clock-outline',
          action: 'read',
          subject: 'admin-nav-audit-logs'
        },
        {
          title: 'Call diagnostics',
          path: '/apps/call-diagnostics',
          icon: 'mdi:video-outline',
          action: 'read',
          subject: 'admin-nav-call-diagnostics'
        }
      ]
    },
    {
      title: 'Marketing',
      icon: 'mdi:bullhorn-outline',
      children: [
        {
          title: 'CMS',
          path: '/apps/cms',
          icon: 'mdi:view-dashboard-edit-outline',
          action: 'read',
          subject: 'admin-nav-cms'
        },
        {
          title: 'Banners',
          path: '/apps/cms/banners',
          icon: 'mdi:image-multiple-outline',
          action: 'read',
          subject: 'admin-nav-banners'
        },
        {
          title: 'Tips',
          path: '/apps/cms/tips',
          icon: 'mdi:lightbulb-outline',
          action: 'read',
          subject: 'admin-nav-tips'
        },
        {
          title: 'Uploads',
          path: '/apps/cms/uploads',
          icon: 'mdi:cloud-upload-outline',
          action: 'read',
          subject: 'admin-nav-cms'
        },
        {
          title: 'Broadcasts',
          path: '/apps/broadcasts',
          icon: 'mdi:bullhorn-outline',
          action: 'read',
          subject: 'admin-nav-broadcasts'
        },
        {
          title: 'Promo Codes',
          path: '/apps/promo-codes',
          icon: 'mdi:tag-multiple-outline',
          action: 'read',
          subject: 'admin-nav-promo-codes'
        }
      ]
    }
  ]
}

export default navigation
