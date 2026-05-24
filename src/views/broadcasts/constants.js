export const CHANNELS = [
  {
    key: 'email',
    label: 'Email',
    icon: 'mdi:email-outline',
    color: '#1976d2',
    description: 'Rich HTML email to users who opted in to promotional email.',
    requiresHtml: true
  },
  {
    key: 'sms',
    label: 'SMS',
    icon: 'mdi:message-text-outline',
    color: '#2e7d32',
    description: 'Plain text SMS (160 chars recommended per segment).',
    requiresText: true,
    maxChars: 1600
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: 'mdi:whatsapp',
    color: '#25D366',
    description: 'WhatsApp message via configured business API.',
    requiresText: true,
    maxChars: 1600
  },
  {
    key: 'in_app',
    label: 'In-app',
    icon: 'mdi:bell-outline',
    color: '#ed6c02',
    description: 'Notification center entry inside the app.',
    requiresText: false
  },
  {
    key: 'push',
    label: 'Push',
    icon: 'mdi:cellphone-message',
    color: '#9c27b0',
    description: 'Mobile push + web push where subscribed.',
    requiresText: true
  }
]

export const STATUS_COLORS = {
  draft: 'default',
  sending: 'warning',
  completed: 'success',
  failed: 'error'
}

export const AUDIENCE_OPTIONS = [
  { value: 'All', label: 'All users', hint: 'Trainers and trainees' },
  { value: 'Trainer', label: 'Trainers only', hint: 'Coach accounts' },
  { value: 'Trainee', label: 'Trainees only', hint: 'Student accounts' }
]

export const STATUS_FILTER_OPTIONS = [
  { value: 'approved', label: 'Approved only' },
  { value: 'pending', label: 'Pending only' },
  { value: '', label: 'All statuses' }
]

export const HISTORY_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'sending', label: 'Sending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
]

export const MESSAGE_TEMPLATES = [
  {
    id: 'blank',
    label: 'Blank',
    title: '',
    plainText: '',
    htmlHint: ''
  },
  {
    id: 'welcome',
    label: 'Welcome message',
    title: 'Welcome to NetQwix',
    plainText:
      'Hi there! Welcome to NetQwix. We are glad to have you. Explore trainers, book sessions, and reach out if you need help.',
    htmlHint:
      '<p>Hi there!</p><p>Welcome to <strong>NetQwix</strong>. We are glad to have you on board.</p><p>Explore trainers, book sessions, and contact support anytime you need help.</p>'
  },
  {
    id: 'maintenance',
    label: 'Scheduled maintenance',
    title: 'Scheduled maintenance notice',
    plainText:
      'NetQwix will undergo scheduled maintenance. Some features may be unavailable during this window. We will notify you when everything is back online.',
    htmlHint:
      '<p>NetQwix will undergo <strong>scheduled maintenance</strong>.</p><p>Some features may be unavailable during this window. We will notify you when service is restored.</p>'
  },
  {
    id: 'promo',
    label: 'Promotion / announcement',
    title: 'New on NetQwix',
    plainText:
      'We have something new for you on NetQwix! Log in to the app to see the latest updates and offers.',
    htmlHint:
      '<p>We have something new for you on <strong>NetQwix</strong>!</p><p>Log in to the app to see the latest updates and offers.</p>'
  }
]
