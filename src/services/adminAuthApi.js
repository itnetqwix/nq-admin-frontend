const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || ''

/**
 * Bootstrap administrator account (account_type = Admin).
 * Requires NEXT_PUBLIC_ADMIN_REGISTER_ENABLED on the admin app and
 * ADMIN_PUBLIC_SIGNUP_ENABLED=true on the API.
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
      (res.status === 403
        ? 'Admin registration is disabled on the API. Set ADMIN_PUBLIC_SIGNUP_ENABLED=true.'
        : 'Unable to create administrator account.')
    throw new Error(message)
  }

  return data
}
