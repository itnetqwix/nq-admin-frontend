import { AbilityBuilder, Ability } from '@casl/ability'
import { effectiveAdminPermissions } from 'src/configs/adminRoleMatrix'

export const AppAbility = Ability

/**
 * Admin menu + action rules. Deny-by-default when restricted:
 * only explicit true on a permission key grants the CASL rule.
 */
const defineRulesFor = (role, user) => {
  const { can, rules } = new AbilityBuilder(AppAbility)

  if (role !== 'Admin') {
    return rules
  }

  const p = effectiveAdminPermissions(user)
  const restricted = p && typeof p === 'object' && Object.keys(p).length > 0

  // Deny-by-default
  const ok = key => Boolean(restricted && p[key] === true)

  if (!restricted) {
    can('manage', 'all')
    return rules
  }

  // —— Nav leaves ——
  if (ok('nav_home')) can('read', 'admin-nav-home')

  if (ok('nav_people')) can('read', 'admin-nav-people')
  if (ok('nav_users_directory') || ok('nav_trainers') || ok('nav_trainees')) {
    can('read', 'admin-nav-users-directory')
  }
  if (ok('nav_trainers')) can('read', 'admin-nav-trainers')
  if (ok('nav_trainees')) can('read', 'admin-nav-trainees')
  if (ok('nav_trainer_verifications') || ok('nav_trainers')) {
    can('read', 'admin-nav-trainer-verifications')
  }
  if (ok('nav_trainee_reviews') || ok('nav_trainees')) can('read', 'admin-nav-trainee-reviews')
  if (ok('nav_account_deletions') || ok('nav_trainees')) can('read', 'admin-nav-account-deletions')

  if (ok('nav_content') || ok('nav_cms') || ok('nav_banners') || ok('nav_tips')) {
    can('read', 'admin-nav-content')
  }
  if (ok('nav_cms') || ok('nav_cms_overview')) can('read', 'admin-nav-cms-overview')
  if (ok('nav_banners') || ok('nav_cms')) can('read', 'admin-nav-banners')
  if (ok('nav_tips') || ok('nav_cms')) can('read', 'admin-nav-tips')
  if (ok('nav_cms_blog') || ok('nav_cms')) can('read', 'admin-nav-cms-blog')
  if (ok('nav_cms_faq') || ok('nav_cms')) can('read', 'admin-nav-cms-faq')
  if (ok('nav_cms_legal') || ok('nav_cms')) can('read', 'admin-nav-cms-legal')

  if (ok('nav_clips')) {
    can('read', 'admin-nav-clips-library')
    can('read', 'admin-nav-clip-taxonomy')
    can('read', 'admin-nav-library-submissions')
    can('read', 'admin-nav-netqwix-library')
  }
  if (ok('nav_clip_taxonomy')) can('read', 'admin-nav-clip-taxonomy')
  if (ok('nav_library_submissions')) can('read', 'admin-nav-library-submissions')
  if (ok('nav_netqwix_library')) can('read', 'admin-nav-netqwix-library')

  if (ok('nav_operations') || ok('nav_bookings') || ok('nav_platform_health')) {
    can('read', 'admin-nav-operations')
  }
  if (ok('nav_platform_health') || ok('nav_operations')) can('read', 'admin-nav-platform-health')
  if (ok('nav_bookings')) can('read', 'admin-nav-bookings')
  if (ok('nav_user_feedback')) can('read', 'admin-nav-user-feedback')
  if (ok('nav_support_tickets')) can('read', 'admin-nav-support-tickets')
  if (ok('nav_call_diagnostics')) can('read', 'admin-nav-call-diagnostics')

  if (ok('nav_logs') || ok('nav_audit_logs') || ok('nav_ops_logs')) can('read', 'admin-nav-logs')
  if (ok('nav_platform_activity') || ok('nav_audit_logs') || ok('nav_ops_logs')) {
    can('read', 'admin-nav-platform-activity')
  }
  if (ok('nav_audit_logs')) can('read', 'admin-nav-audit-logs')
  if (ok('nav_ops_logs')) can('read', 'admin-nav-ops-logs')

  if (ok('nav_admin_settings') || ok('can_view_admin_roles') || ok('can_assign_admin_roles')) {
    can('read', 'admin-nav-admin-settings')
  }
  if (ok('can_assign_admin_roles')) can('update', 'admin-nav-admin-settings')

  if (ok('nav_business') || ok('nav_finance') || ok('nav_pricing')) can('read', 'admin-nav-business')
  if (ok('nav_finance') || ok('finance_read')) can('read', 'admin-nav-finance')
  if (ok('nav_finance_connect') || ok('nav_finance')) can('read', 'admin-nav-finance-connect')
  if (ok('nav_pricing') || ok('pricing_read')) can('read', 'admin-nav-pricing')
  if (ok('nav_promo_codes') || ok('promo_read')) can('read', 'admin-nav-promo-codes')
  if (ok('nav_referrals') || ok('referrals_read')) can('read', 'admin-nav-referrals')
  if (ok('nav_broadcasts') || ok('broadcast_read')) can('read', 'admin-nav-broadcasts')

  // —— CRUD / actions ——
  if (ok('users_read')) can('read', 'admin-action-users')
  if (ok('users_update')) can('update', 'admin-action-users')
  if (ok('users_delete') || ok('can_hard_delete')) can('delete', 'admin-action-users')

  if (ok('finance_read')) can('read', 'admin-action-finance')
  if (ok('finance_refund') || ok('can_process_refund')) can('update', 'admin-action-refund')
  if (ok('finance_adjust_wallet')) can('update', 'admin-action-wallet-adjust')
  if (ok('finance_approve_payout')) can('update', 'admin-action-payout')
  if (ok('finance_reconcile')) can('update', 'admin-action-reconcile')

  if (ok('pricing_update') || ok('can_manage_pricing')) can('update', 'admin-action-pricing')
  if (ok('can_manage_commission')) can('update', 'admin-action-commission')

  if (ok('promo_create')) can('create', 'admin-action-promo')
  if (ok('promo_update')) can('update', 'admin-action-promo')
  if (ok('promo_delete')) can('delete', 'admin-action-promo')

  if (ok('broadcast_send')) can('create', 'admin-action-broadcast')
  if (ok('broadcast_delete')) can('delete', 'admin-action-broadcast')

  if (ok('cms_write')) can('update', 'admin-action-cms')
  if (ok('cms_delete')) can('delete', 'admin-action-cms')
  if (ok('library_write')) can('update', 'admin-action-library')
  if (ok('library_delete')) can('delete', 'admin-action-library')

  if (ok('can_export_logs')) can('export', 'admin-action-export-logs')
  if (ok('can_view_security_logs')) can('read', 'admin-action-security-logs')
  if (ok('can_resolve_ops')) can('update', 'admin-action-resolve-ops')
  if (ok('can_soft_delete_entities')) can('update', 'admin-action-soft-delete')
  if (ok('can_hard_delete')) can('delete', 'admin-action-hard-delete')

  return rules
}

export const buildAbilityFor = (role, user) => {
  return new AppAbility(defineRulesFor(role, user), {
    // @ts-ignore
    detectSubjectType: object => object.type
  })
}

export const defaultACLObj = {
  action: 'manage',
  subject: 'all'
}

export default defineRulesFor
