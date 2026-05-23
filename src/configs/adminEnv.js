/** Admin UI feature flags (Next.js: NEXT_PUBLIC_* only). */

/** Enabled unless explicitly set to "false" (avoids missing env after .env edits without restart). */
export const isAdminRegisterEnabled = () => {
  const raw = String(process.env.NEXT_PUBLIC_ADMIN_REGISTER_ENABLED ?? 'true').trim().toLowerCase()
  return raw !== 'false'
}

/** Hint shown when bootstrap registration is enabled (API must allow it too). */
export const adminRegisterEnvHint = () =>
  'Enable NEXT_PUBLIC_ADMIN_REGISTER_ENABLED on this app and ADMIN_PUBLIC_SIGNUP_ENABLED=true on the API.'

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
