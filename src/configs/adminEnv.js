/** Admin UI feature flags (Next.js: NEXT_PUBLIC_* only). */

export const isAdminRegisterEnabled = () =>
  String(process.env.NEXT_PUBLIC_ADMIN_REGISTER_ENABLED || '').toLowerCase() === 'true'

/** Short label for current API host (for environment banner). */
export const getAdminApiEnvLabel = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  if (!raw) return 'API URL not set'
  try {
    const u = new URL(raw)
    return u.host || raw
  } catch {
    return raw.replace(/^https?:\/\//i, '').slice(0, 48)
  }
}

export const showAdminMfaNotice = () =>
  String(process.env.NEXT_PUBLIC_ADMIN_MFA_NOTICE || '').toLowerCase() === 'true'
