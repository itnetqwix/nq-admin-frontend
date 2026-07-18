import Clarity from '@microsoft/clarity'

// Own Clarity project only — Settings → Overview. Do not reuse web/mobile ids.
const PROJECT_ID = String(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? '')
  .replace(/^['"]|['"]$/g, '')
  .trim()

let inited = false
let lastCustomId = null

export function initClarity() {
  if (typeof window === 'undefined' || inited || !PROJECT_ID) return
  try {
    Clarity.init(PROJECT_ID)
    Clarity.setTag('app', 'admin')
    inited = true
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[Clarity] init failed:', err)
    }
  }
}

export function identifyClarityUser(user) {
  if (!inited || !user || typeof window === 'undefined') return
  const customId = String(user._id ?? user.id ?? '').trim()
  if (!customId) return
  lastCustomId = customId
  const friendly =
    String(user.email ?? user.fullname ?? user.fullName ?? '').trim() || undefined
  try {
    Clarity.identify(customId, undefined, undefined, friendly)
    const accountType = String(user.account_type ?? user.accountType ?? '').trim()
    if (accountType) Clarity.setTag('account_type', accountType)
  } catch {
    // SDK warming up
  }
}

export function reidentifyClarityPage(pageId) {
  if (!inited || !lastCustomId) return
  try {
    Clarity.identify(lastCustomId, undefined, pageId)
  } catch {
    // ignore
  }
}
