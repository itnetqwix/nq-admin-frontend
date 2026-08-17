import { AbilityBuilder, Ability } from '@casl/ability'

export const AppAbility = Ability

/**
 * Admin menu + action rules. If `user.extraInfo.admin_permissions` is missing or empty,
 * admin has full access (`manage all`). Otherwise any key set to `false` removes that ability.
 */
const defineRulesFor = (role, user) => {
  const { can, rules } = new AbilityBuilder(AppAbility)

  if (String(role).toLowerCase() !== 'admin' && !String(user?.extraInfo?.admin_role || '').trim()) {
    return rules
  }

  const p = user?.extraInfo?.admin_permissions
  const restricted = p && typeof p === 'object' && Object.keys(p).length > 0

  const ok = key => !restricted || p[key] !== false

  if (!restricted) {
    can('manage', 'all')
    return rules
  }

  const nav = [
    ['nav_home', 'admin-nav-home'],
    ['nav_users_directory', 'admin-nav-users-directory'],
    ['nav_trainers', 'admin-nav-trainers'],
    ['nav_trainees', 'admin-nav-trainees'],
    ['nav_trainee_reviews', 'admin-nav-trainee-reviews'],
    ['nav_account_deletions', 'admin-nav-account-deletions'],
    ['nav_bookings', 'admin-nav-bookings'],
    ['nav_user_feedback', 'admin-nav-user-feedback'],
    ['nav_support_tickets', 'admin-nav-support-tickets'],
    ['nav_audit_logs', 'admin-nav-audit-logs'],
    ['nav_call_diagnostics', 'admin-nav-call-diagnostics'],
    ['nav_promo_codes', 'admin-nav-promo-codes'],
    ['nav_broadcasts', 'admin-nav-broadcasts'],
    ['nav_cms_blog', 'admin-nav-cms-blog'],
    ['nav_cms_faq', 'admin-nav-cms-faq'],
    ['nav_cms_legal', 'admin-nav-cms-legal'],
    ['nav_careers', 'admin-nav-careers'],
    ['nav_netqwix_library', 'admin-nav-netqwix-library'],
    ['nav_clip_taxonomy', 'admin-nav-clip-taxonomy'],
    ['nav_library_submissions', 'admin-nav-library-submissions'],
    ['nav_platform_activity', 'admin-nav-platform-activity'],
    ['nav_ops_logs', 'admin-nav-ops-logs'],
    ['nav_logs', 'admin-nav-logs'],
    ['nav_finance', 'admin-nav-finance'],
    ['nav_finance_connect', 'admin-nav-finance-connect'],
    ['nav_pricing', 'admin-nav-pricing'],
    ['nav_referrals', 'admin-nav-referrals'],
    ['nav_platform_health', 'admin-nav-platform-health']
  ]
  nav.forEach(([key, subject]) => {
    if (ok(key)) can('read', subject)
  })

  if (ok('nav_trainer_verifications') || ok('nav_trainers')) {
    can('read', 'admin-nav-trainer-verifications')
  }
  if (ok('nav_failed_jobs') || ok('nav_audit_logs') || ok('nav_ops_logs')) {
    can('read', 'admin-nav-failed-jobs')
  }
  if (ok('nav_cms') || ok('nav_cms_overview')) {
    can('read', 'admin-nav-cms')
    can('read', 'admin-nav-cms-overview')
  }
  if (ok('nav_banners') || ok('nav_cms')) can('read', 'admin-nav-banners')
  if (ok('nav_tips') || ok('nav_cms')) can('read', 'admin-nav-tips')
  if (ok('nav_careers') || ok('nav_cms')) can('read', 'admin-nav-careers')
  if (ok('nav_clips')) {
    can('read', 'admin-nav-netqwix-library')
    can('read', 'admin-nav-clip-taxonomy')
    can('read', 'admin-nav-library-submissions')
  }
  if (ok('nav_admin_settings') || ok('can_view_admin_roles')) {
    can('read', 'admin-nav-admin-settings')
  }
  if (ok('can_assign_admin_roles')) can('update', 'admin-nav-admin-settings')

  if (ok('can_manage_commission')) can('update', 'admin-action-commission')
  if (ok('can_process_refund') || ok('finance_refund')) can('update', 'admin-action-refund')
  if (ok('can_hard_delete')) can('delete', 'admin-action-hard-delete')
  if (ok('can_soft_delete_entities')) can('update', 'admin-action-soft-delete')

  return rules
}

export const buildAbilityFor = (role, user) => {
  return new AppAbility(defineRulesFor(role, user), {
    // https://casl.js.org/v5/en/guide/subject-type-detection
    // @ts-ignore
    detectSubjectType: object => object.type
  })
}

export const defaultACLObj = {
  action: 'manage',
  subject: 'all'
}

export default defineRulesFor
