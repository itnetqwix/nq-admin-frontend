import { AbilityBuilder, Ability } from '@casl/ability'

export const AppAbility = Ability

/**
 * Admin menu + action rules. If `user.extraInfo.admin_permissions` is missing or empty,
 * admin has full access (`manage all`). Otherwise any key set to `false` removes that ability.
 */
const defineRulesFor = (role, user) => {
  const { can, rules } = new AbilityBuilder(AppAbility)

  if (role !== 'Admin') {
    return rules
  }

  const p = user?.extraInfo?.admin_permissions
  const restricted = p && typeof p === 'object' && Object.keys(p).length > 0

  const ok = key => !restricted || p[key] !== false

  if (!restricted) {
    can('manage', 'all')
    return rules
  }

  if (ok('nav_home')) can('read', 'admin-nav-home')
  if (ok('nav_trainers') || ok('nav_trainer_verifications')) can('read', 'admin-nav-trainer-verifications')
  if (ok('nav_trainers')) can('read', 'admin-nav-trainers')
  if (ok('nav_trainees')) can('read', 'admin-nav-trainees')
  if (ok('nav_bookings')) can('read', 'admin-nav-bookings')
  if (ok('nav_user_feedback')) can('read', 'admin-nav-user-feedback')
  if (ok('nav_support_tickets')) can('read', 'admin-nav-support-tickets')
  if (ok('nav_audit_logs')) can('read', 'admin-nav-audit-logs')
  if (ok('nav_ops_logs') || ok('nav_audit_logs')) can('read', 'admin-nav-ops-logs')
  if (ok('nav_call_diagnostics')) can('read', 'admin-nav-call-diagnostics')
  if (ok('nav_finance')) can('read', 'admin-nav-finance')
  if (ok('nav_promo_codes')) can('read', 'admin-nav-promo-codes')
  if (ok('nav_referrals')) can('read', 'admin-nav-referrals')
  if (ok('nav_broadcasts')) can('read', 'admin-nav-broadcasts')
  if (ok('nav_cms') || ok('nav_banners')) can('read', 'admin-nav-banners')
  if (ok('nav_cms') || ok('nav_tips')) can('read', 'admin-nav-tips')
  if (ok('nav_cms') || ok('nav_cms_blog')) can('read', 'admin-nav-cms-blog')
  if (ok('nav_cms') || ok('nav_cms_legal')) can('read', 'admin-nav-cms-legal')
  if (ok('nav_cms') || ok('nav_cms_faq')) can('read', 'admin-nav-cms-faq')
  if (ok('nav_cms')) can('read', 'admin-nav-cms-overview')

  if (ok('nav_cms') || ok('nav_banners') || ok('nav_tips')) {
    can('read', 'admin-nav-content')
    can('read', 'admin-nav-banners')
    can('read', 'admin-nav-tips')
    can('read', 'admin-nav-cms-blog')
    can('read', 'admin-nav-cms-legal')
    can('read', 'admin-nav-cms-faq')
    can('read', 'admin-nav-cms-overview')
  }

  if (ok('nav_people') || ok('nav_trainers')) {
    can('read', 'admin-nav-people')
    can('read', 'admin-nav-trainer-verifications')
    can('read', 'admin-nav-trainers')
    can('read', 'admin-nav-trainees')
  }
  if (ok('nav_clips')) {
    can('read', 'admin-nav-clips-library')
    can('read', 'admin-nav-clip-taxonomy')
    can('read', 'admin-nav-library-submissions')
    can('read', 'admin-nav-netqwix-library')
  }
  if (ok('nav_operations') || ok('nav_bookings')) {
    can('read', 'admin-nav-operations')
    can('read', 'admin-nav-bookings')
    can('read', 'admin-nav-user-feedback')
    can('read', 'admin-nav-support-tickets')
    can('read', 'admin-nav-call-diagnostics')
  }
  if (ok('nav_logs') || ok('nav_audit_logs')) {
    can('read', 'admin-nav-logs')
    can('read', 'admin-nav-audit-logs')
    can('read', 'admin-nav-ops-logs')
  }
  if (ok('nav_business') || ok('nav_finance')) {
    can('read', 'admin-nav-business')
    can('read', 'admin-nav-finance')
    can('read', 'admin-nav-pricing')
    can('read', 'admin-nav-promo-codes')
    can('read', 'admin-nav-referrals')
    can('read', 'admin-nav-broadcasts')
  }
  if (ok('nav_cms')) {
    can('read', 'admin-nav-cms')
    can('read', 'admin-nav-cms-banners')
    can('read', 'admin-nav-cms-tips')
    can('read', 'admin-nav-cms-blog')
    can('read', 'admin-nav-cms-faq')
    can('read', 'admin-nav-cms-legal')
  } else {
    if (ok('nav_cms_banners')) {
      can('read', 'admin-nav-cms')
      can('read', 'admin-nav-cms-banners')
    }
    if (ok('nav_cms_tips')) {
      can('read', 'admin-nav-cms')
      can('read', 'admin-nav-cms-tips')
    }
    if (ok('nav_cms_blog')) {
      can('read', 'admin-nav-cms')
      can('read', 'admin-nav-cms-blog')
    }
    if (ok('nav_cms_faq')) {
      can('read', 'admin-nav-cms')
      can('read', 'admin-nav-cms-faq')
    }
    if (ok('nav_cms_legal')) {
      can('read', 'admin-nav-cms')
      can('read', 'admin-nav-cms-legal')
    }
  }

  if (ok('can_manage_commission')) can('update', 'admin-action-commission')
  if (ok('can_manage_pricing') || !restricted) can('update', 'admin-action-pricing')
  if (ok('can_process_refund')) can('update', 'admin-action-refund')
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
