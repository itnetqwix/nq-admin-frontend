const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || ''

/**
 * Bootstrap administrator account (account_type = Admin).
 * Disabled in UI — admins are invited. Kept for emergency API use only.
 */
export async function registerAdminAccount({ fullname, email, mobile_no, password, accepted_terms_and_privacy }) {
  const res = await fetch(`${apiBase()}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullname: String(fullname || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      mobile_no: String(mobile_no || '').trim(),
      password,
      account_type: 'Admin',
      accepted_terms_and_privacy: accepted_terms_and_privacy === true
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.status === 'fail') {
    const message =
      data?.error ||
      data?.message ||
      'Unable to create administrator account.'
    throw new Error(message)
  }

  return data
}

/** Google SSO for an already-invited admin (never creates an account). */
export async function verifyGoogleAdminLogin({ email, id_token, access_token, rememberMe }) {
  const body = { email: String(email || '').trim().toLowerCase(), rememberMe: Boolean(rememberMe) }
  if (id_token) body.id_token = id_token
  if (access_token) body.access_token = access_token
  const res = await fetch(`${apiBase()}/auth/verify-google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Nq-Admin': '1' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}
