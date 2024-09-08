const navigation = () => {
  return [
    {
      title: 'Home',
      path: '/home',
      icon: 'mdi:home-outline',
    },
    {
      title: 'Manage Trainer',
      path: '/apps/manage-trainer',
      icon: 'mdi:human-male-board',
    },
    {
      title: 'Manage Trainee',
      path: '/apps/manage-trainee',
      icon: 'mdi:account-school-outline',
    },
    {
      title: 'Bookings',
      path: '/apps/booking',
      icon: 'mdi:briefcase-arrow-left-right-outline',
    },
    {
      title: 'Users feedback',
      path: '/apps/write-by-user',
      icon: 'mdi:account-question',
    },
    {
      title: 'Refund Request',
      path: '/apps/concern-by-user',
      icon: 'mdi:chat-question',
    },
    // {
    //   title: 'Second Page',
    //   path: '/second-page',
    //   icon: 'mdi:email-outline',
    // },
    // {
    //   path: '/acl',
    //   action: 'read',
    //   subject: 'acl-page',
    //   title: 'Access Control',
    //   icon: 'mdi:shield-outline',
    // }
  ]
}

export default navigation
