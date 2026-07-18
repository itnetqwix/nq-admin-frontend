/**
 * Frontend mirror of nq-backend-main adminPermission.ts ROLE_MATRIX.
 * Restricted roles: missing keys deny (explicit true required).
 */

export const ALL_PERMISSION_KEYS = [
  'nav_home',
  'nav_people',
  'nav_users_directory',
  'nav_trainers',
  'nav_trainees',
  'nav_trainer_verifications',
  'nav_trainee_reviews',
  'nav_account_deletions',
  'nav_content',
  'nav_cms',
  'nav_cms_overview',
  'nav_banners',
  'nav_tips',
  'nav_cms_blog',
  'nav_cms_faq',
  'nav_cms_legal',
  'nav_clips',
  'nav_clip_taxonomy',
  'nav_library_submissions',
  'nav_netqwix_library',
  'nav_operations',
  'nav_platform_health',
  'nav_bookings',
  'nav_user_feedback',
  'nav_support_tickets',
  'nav_call_diagnostics',
  'nav_logs',
  'nav_platform_activity',
  'nav_audit_logs',
  'nav_ops_logs',
  'nav_admin_settings',
  'nav_business',
  'nav_finance',
  'nav_finance_connect',
  'nav_pricing',
  'nav_promo_codes',
  'nav_referrals',
  'nav_broadcasts',
  'users_read',
  'users_update',
  'users_delete',
  'finance_read',
  'finance_refund',
  'finance_adjust_wallet',
  'finance_approve_payout',
  'finance_reconcile',
  'pricing_read',
  'pricing_update',
  'promo_read',
  'promo_create',
  'promo_update',
  'promo_delete',
  'broadcast_read',
  'broadcast_send',
  'broadcast_delete',
  'referrals_read',
  'cms_write',
  'cms_delete',
  'library_write',
  'library_delete',
  'can_manage_commission',
  'can_manage_pricing',
  'can_process_refund',
  'can_soft_delete_entities',
  'can_hard_delete',
  'can_export_logs',
  'can_view_security_logs',
  'can_resolve_ops',
  'can_assign_admin_roles',
  'can_view_admin_roles'
]

function perms(enabled = {}) {
  const out = {}
  ALL_PERMISSION_KEYS.forEach(k => {
    out[k] = false
  })
  Object.entries(enabled).forEach(([k, v]) => {
    if (v === true) out[k] = true
  })
  return out
}

const FULL_OPS = {
  nav_home: true,
  nav_people: true,
  nav_users_directory: true,
  nav_trainers: true,
  nav_trainees: true,
  nav_trainer_verifications: true,
  nav_trainee_reviews: true,
  nav_account_deletions: true,
  nav_content: true,
  nav_cms: true,
  nav_cms_overview: true,
  nav_banners: true,
  nav_tips: true,
  nav_cms_blog: true,
  nav_cms_faq: true,
  nav_cms_legal: true,
  nav_clips: true,
  nav_clip_taxonomy: true,
  nav_library_submissions: true,
  nav_netqwix_library: true,
  nav_operations: true,
  nav_platform_health: true,
  nav_bookings: true,
  nav_user_feedback: true,
  nav_support_tickets: true,
  nav_call_diagnostics: true,
  nav_logs: true,
  nav_platform_activity: true,
  nav_audit_logs: true,
  nav_ops_logs: true,
  nav_admin_settings: true,
  nav_business: true,
  nav_finance: true,
  nav_finance_connect: true,
  nav_pricing: true,
  nav_promo_codes: true,
  nav_referrals: true,
  nav_broadcasts: true,
  users_read: true,
  users_update: true,
  users_delete: true,
  finance_read: true,
  finance_refund: true,
  finance_adjust_wallet: true,
  finance_approve_payout: true,
  finance_reconcile: true,
  pricing_read: true,
  pricing_update: true,
  promo_read: true,
  promo_create: true,
  promo_update: true,
  promo_delete: true,
  broadcast_read: true,
  broadcast_send: true,
  broadcast_delete: true,
  referrals_read: true,
  cms_write: true,
  cms_delete: true,
  library_write: true,
  library_delete: true,
  can_manage_commission: true,
  can_manage_pricing: true,
  can_process_refund: true,
  can_soft_delete_entities: true,
  can_hard_delete: true,
  can_export_logs: true,
  can_view_security_logs: true,
  can_resolve_ops: true,
  can_view_admin_roles: true,
  can_assign_admin_roles: false
}

const ROLE_MATRIX = {
  SuperAdmin: null,
  Admin: perms(FULL_OPS),
  Manager: perms({ ...FULL_OPS, can_hard_delete: false, users_delete: false, can_assign_admin_roles: false }),
  Operator: perms({
    nav_home: true,
    nav_people: true,
    nav_users_directory: true,
    nav_trainers: true,
    nav_trainees: true,
    nav_trainer_verifications: true,
    nav_trainee_reviews: true,
    nav_account_deletions: true,
    nav_content: true,
    nav_cms: true,
    nav_cms_overview: true,
    nav_banners: true,
    nav_tips: true,
    nav_cms_blog: true,
    nav_cms_faq: true,
    nav_cms_legal: true,
    nav_clips: true,
    nav_clip_taxonomy: true,
    nav_library_submissions: true,
    nav_netqwix_library: true,
    nav_operations: true,
    nav_platform_health: true,
    nav_bookings: true,
    nav_user_feedback: true,
    nav_support_tickets: true,
    nav_call_diagnostics: true,
    nav_logs: true,
    nav_platform_activity: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    users_read: true,
    users_update: true,
    cms_write: true,
    library_write: true,
    can_soft_delete_entities: true,
    can_export_logs: true,
    can_resolve_ops: true
  }),
  Support: perms({
    nav_home: true,
    nav_people: true,
    nav_users_directory: true,
    nav_trainers: true,
    nav_trainees: true,
    nav_operations: true,
    nav_platform_health: true,
    nav_bookings: true,
    nav_user_feedback: true,
    nav_support_tickets: true,
    nav_call_diagnostics: true,
    nav_logs: true,
    nav_platform_activity: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    users_read: true,
    can_export_logs: true,
    can_resolve_ops: true
  }),
  Auditor: perms({
    nav_home: true,
    nav_people: true,
    nav_users_directory: true,
    nav_trainers: true,
    nav_trainees: true,
    nav_logs: true,
    nav_platform_activity: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    nav_business: true,
    nav_finance: true,
    nav_finance_connect: true,
    nav_pricing: true,
    nav_admin_settings: true,
    users_read: true,
    finance_read: true,
    pricing_read: true,
    promo_read: true,
    referrals_read: true,
    broadcast_read: true,
    can_export_logs: true,
    can_view_security_logs: true,
    can_view_admin_roles: true
  })
}

/** Permission groups for Admin Roles UI. */
export const PERM_GROUPS = [
  {
    title: 'Navigation · People',
    keys: [
      'nav_home',
      'nav_people',
      'nav_users_directory',
      'nav_trainers',
      'nav_trainees',
      'nav_trainer_verifications',
      'nav_trainee_reviews',
      'nav_account_deletions'
    ]
  },
  {
    title: 'Navigation · Content & Library',
    keys: [
      'nav_content',
      'nav_cms',
      'nav_cms_overview',
      'nav_banners',
      'nav_tips',
      'nav_cms_blog',
      'nav_cms_faq',
      'nav_cms_legal',
      'nav_clips',
      'nav_clip_taxonomy',
      'nav_library_submissions',
      'nav_netqwix_library'
    ]
  },
  {
    title: 'Navigation · Ops & Logs',
    keys: [
      'nav_operations',
      'nav_platform_health',
      'nav_bookings',
      'nav_user_feedback',
      'nav_support_tickets',
      'nav_call_diagnostics',
      'nav_logs',
      'nav_platform_activity',
      'nav_audit_logs',
      'nav_ops_logs',
      'nav_admin_settings'
    ]
  },
  {
    title: 'Navigation · Revenue',
    keys: [
      'nav_business',
      'nav_finance',
      'nav_finance_connect',
      'nav_pricing',
      'nav_promo_codes',
      'nav_referrals',
      'nav_broadcasts'
    ]
  },
  {
    title: 'CRUD · Users & Finance',
    keys: [
      'users_read',
      'users_update',
      'users_delete',
      'finance_read',
      'finance_refund',
      'finance_adjust_wallet',
      'finance_approve_payout',
      'finance_reconcile'
    ]
  },
  {
    title: 'CRUD · Growth & Content',
    keys: [
      'pricing_read',
      'pricing_update',
      'promo_read',
      'promo_create',
      'promo_update',
      'promo_delete',
      'broadcast_read',
      'broadcast_send',
      'broadcast_delete',
      'referrals_read',
      'cms_write',
      'cms_delete',
      'library_write',
      'library_delete'
    ]
  },
  {
    title: 'Actions · Sensitive',
    keys: [
      'can_manage_commission',
      'can_manage_pricing',
      'can_process_refund',
      'can_soft_delete_entities',
      'can_hard_delete',
      'can_export_logs',
      'can_view_security_logs',
      'can_resolve_ops',
      'can_view_admin_roles',
      'can_assign_admin_roles'
    ]
  }
]

export function effectiveAdminPermissions(user) {
  const explicit = user?.extraInfo?.admin_permissions
  if (explicit && typeof explicit === 'object' && Object.keys(explicit).length > 0) {
    return perms(explicit)
  }
  const role = String(user?.extraInfo?.admin_role || '').trim()
  if (!role || role === 'SuperAdmin') return null
  return ROLE_MATRIX[role] ? { ...ROLE_MATRIX[role] } : null
}

export { ROLE_MATRIX }
