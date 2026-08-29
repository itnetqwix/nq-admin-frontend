import {
  resolvePublicApiBaseUrl,
  resolveWebAppBaseUrl,
  resolveAdminPublicOrigin,
} from '../src/utils/vercelEnv.js'

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}

process.env.VERCEL_ENV = 'production'
process.env.NEXT_PUBLIC_API_BASE_URL = ''
assert(resolvePublicApiBaseUrl() === 'https://api-netqwix.com', 'prod api')
assert(resolveWebAppBaseUrl() === 'https://www.netqwix.com', 'prod web')
assert(
  resolveAdminPublicOrigin() === 'https://admin.netqwix.com',
  'prod admin origin'
)

process.env.VERCEL_ENV = 'preview'
process.env.VERCEL_GIT_COMMIT_REF = 'staging'
assert(
  resolvePublicApiBaseUrl() === 'https://api-netqwix.online',
  'preview api'
)
assert(
  resolveWebAppBaseUrl() === 'https://staging-netqwix.com',
  'staging web'
)
assert(
  resolveAdminPublicOrigin() === 'https://admin-staging.netqwix.com',
  'staging admin'
)

process.env.VERCEL_GIT_COMMIT_REF = 'feature-x'
process.env.VERCEL_URL = 'nq-admin-frontend-git-feature-x.vercel.app'
assert(
  resolveAdminPublicOrigin() ===
    'https://nq-admin-frontend-git-feature-x.vercel.app',
  'feature preview origin'
)

console.log('vercelEnv.selfcheck ok')
