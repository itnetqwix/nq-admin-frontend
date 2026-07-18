/**
 * Frontend mirror of backend admin role → permission matrix.
 * Keep in sync with nq-backend-main adminPermission.ts ROLE_MATRIX.
 */
const ROLE_MATRIX = {
  SuperAdmin: null,
  Admin: {
    nav_home: true,
    nav_people: true,
    nav_trainers: true,
    nav_trainees: true,
    nav_operations: true,
    nav_bookings: true,
    nav_logs: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    nav_business: true,
    nav_finance: true,
    nav_cms: true,
    nav_clips: true,
    nav_broadcasts: true,
    nav_referrals: true,
    nav_promo_codes: true,
    nav_user_feedback: true,
    nav_support_tickets: true,
    nav_call_diagnostics: true,
    can_manage_commission: true,
    can_manage_pricing: true,
    can_process_refund: true,
    can_soft_delete_entities: true,
    can_hard_delete: true,
    can_export_logs: true,
    can_view_security_logs: true,
    can_resolve_ops: true,
    can_assign_admin_roles: false
  },
  Manager: {
    nav_home: true,
    nav_people: true,
    nav_trainers: true,
    nav_trainees: true,
    nav_operations: true,
    nav_bookings: true,
    nav_logs: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    nav_business: true,
    nav_finance: true,
    nav_cms: true,
    nav_clips: true,
    nav_broadcasts: true,
    nav_referrals: true,
    nav_promo_codes: true,
    can_manage_commission: true,
    can_manage_pricing: true,
    can_process_refund: true,
    can_soft_delete_entities: true,
    can_hard_delete: false,
    can_export_logs: true,
    can_view_security_logs: true,
    can_resolve_ops: true,
    can_assign_admin_roles: false
  },
  Operator: {
    nav_home: true,
    nav_people: true,
    nav_trainers: true,
    nav_trainees: true,
    nav_operations: true,
    nav_bookings: true,
    nav_logs: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    nav_cms: true,
    nav_clips: true,
    can_manage_commission: false,
    can_manage_pricing: false,
    can_process_refund: false,
    can_soft_delete_entities: true,
    can_hard_delete: false,
    can_export_logs: true,
    can_view_security_logs: false,
    can_resolve_ops: true,
    can_assign_admin_roles: false
  },
  Support: {
    nav_home: true,
    nav_people: true,
    nav_trainers: true,
    nav_trainees: true,
    nav_operations: true,
    nav_bookings: true,
    nav_logs: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    nav_user_feedback: true,
    nav_support_tickets: true,
    nav_call_diagnostics: true,
    can_manage_commission: false,
    can_manage_pricing: false,
    can_process_refund: false,
    can_soft_delete_entities: false,
    can_hard_delete: false,
    can_export_logs: true,
    can_view_security_logs: false,
    can_resolve_ops: true,
    can_assign_admin_roles: false
  },
  Auditor: {
    nav_home: true,
    nav_logs: true,
    nav_audit_logs: true,
    nav_ops_logs: true,
    nav_finance: true,
    nav_people: true,
    nav_trainers: true,
    nav_trainees: true,
    can_manage_commission: false,
    can_manage_pricing: false,
    can_process_refund: false,
    can_soft_delete_entities: false,
    can_hard_delete: false,
    can_export_logs: true,
    can_view_security_logs: true,
    can_resolve_ops: false,
    can_assign_admin_roles: false
  }
}

export function effectiveAdminPermissions(user) {
  const explicit = user?.extraInfo?.admin_permissions
  if (explicit && typeof explicit === 'object' && Object.keys(explicit).length > 0) {
    return explicit
  }
  const role = String(user?.extraInfo?.admin_role || '').trim()
  if (!role || role === 'SuperAdmin') return null
  return ROLE_MATRIX[role] ? { ...ROLE_MATRIX[role] } : null
}

export { ROLE_MATRIX }
