/**
 * Sidebar must list every real admin app page (not login/404/detail).
 * Run: node src/navigation/navItems.selfcheck.js
 */
const fs = require('fs')
const path = require('path')

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const root = __dirname
const nav = fs.readFileSync(path.join(root, 'navItems.js'), 'utf8')
const vertical = fs.readFileSync(path.join(root, 'vertical/index.js'), 'utf8')
const horizontal = fs.readFileSync(path.join(root, 'horizontal/index.js'), 'utf8')
const acl = fs.readFileSync(path.join(root, '../configs/acl.js'), 'utf8')
const subjects = fs.readFileSync(path.join(root, '../configs/aclRouteSubjects.js'), 'utf8')

assert(/from 'src\/navigation\/navItems'/.test(vertical), 'vertical nav must re-export navItems')
assert(/from 'src\/navigation\/navItems'/.test(horizontal), 'horizontal nav must re-export navItems')

const required = [
  '/home',
  '/apps/users',
  '/apps/manage-trainer',
  '/apps/trainer-verifications',
  '/apps/manage-trainee',
  '/apps/trainee-account-reviews',
  '/apps/account-deletions',
  '/apps/booking',
  '/apps/finance',
  '/apps/finance/connect',
  '/apps/pricing',
  '/apps/promo-codes',
  '/apps/referrals',
  '/apps/cms',
  '/apps/banners',
  '/apps/tips',
  '/apps/cms/uploads',
  '/apps/cms-blog',
  '/apps/cms-faq',
  '/apps/cms-legal',
  '/apps/broadcasts',
  '/apps/netqwix-library',
  '/apps/clip-taxonomy',
  '/apps/library-submissions',
  '/apps/logs',
  '/apps/platform-activity',
  '/apps/concern-by-user',
  '/apps/write-by-user',
  '/apps/audit-logs',
  '/apps/ops-logs',
  '/apps/failed-jobs',
  '/apps/platform-health',
  '/apps/call-diagnostics',
  '/apps/live-lessons',
  '/apps/admin-roles'
]

for (const p of required) {
  assert(nav.includes(`'${p}'`), `sidebar missing ${p}`)
}

assert(nav.includes('Admin roles'), 'Invite sub-admins lives on Admin roles — must be in the sidebar')
assert(acl.includes('admin-nav-admin-settings'), 'acl.js must grant Admin roles')
assert(acl.includes('admin-nav-users-directory'), 'acl.js must grant Users directory')
assert(subjects.includes("'/apps/admin-roles'"), 'aclRouteSubjects must map Admin roles')
assert(subjects.includes("'/apps/live-lessons'"), 'aclRouteSubjects must map live lessons')

console.log('navItems.selfcheck ok')
