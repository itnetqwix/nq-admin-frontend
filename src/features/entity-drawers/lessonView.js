import { formatMinor } from 'src/utils/format'

/** Order the lesson steps appear in, with the words an admin uses. */
export const JOURNEY_STEPS = [
  { step: 'lesson_selection', label: 'Coach selected' },
  { step: 'lesson', label: 'Lesson' },
  { step: 'participants', label: 'Both joined' },
  { step: 'chat', label: 'Chat' },
  { step: 'game_plan', label: 'Game plan' },
  { step: 'screenshots', label: 'Screenshots' },
  { step: 'recording', label: 'Recording' },
  { step: 'notifications', label: 'Notifications' },
  { step: 'settlement', label: 'Payment settled' },
  { step: 'post_lesson', label: 'After the lesson' }
]

const STATE_TONE = {
  succeeded: 'success',
  started: 'info',
  pending: 'warning',
  failed: 'danger',
  blocked: 'danger',
  not_applicable: 'neutral'
}

/**
 * The journey as a fixed checklist. Steps that have not happened yet show as "Not yet" so an admin
 * sees what is missing, not just what exists. Unknown steps the server adds later are appended.
 */
export function journeyChecklist(journey) {
  const byStep = new Map((journey?.steps || []).map(s => [s.step, s]))
  const known = JOURNEY_STEPS.map(({ step, label }) => {
    const row = byStep.get(step)
    return {
      step,
      label,
      state: row?.state || 'none',
      tone: row ? STATE_TONE[row.state] || 'neutral' : 'neutral',
      title: row?.title || null,
      detail: row?.detail || null,
      at: row?.createdAt || null
    }
  })
  const extra = (journey?.steps || [])
    .filter(s => !JOURNEY_STEPS.some(k => k.step === s.step))
    .map(s => ({ step: s.step, label: s.step, state: s.state, tone: STATE_TONE[s.state] || 'neutral', title: s.title || null, detail: s.detail || null, at: s.createdAt || null }))
  return [...known, ...extra]
}

export function journeyHeadline(journey) {
  if (!journey) return null
  if (journey.blocked?.length) return { tone: 'danger', text: `${journey.blocked.length} step${journey.blocked.length === 1 ? '' : 's'} failed or blocked` }
  if (journey.complete) return { tone: 'success', text: 'Everything after the lesson completed' }
  if (journey.ended && journey.pending?.length) return { tone: 'warning', text: `${journey.pending.length} step${journey.pending.length === 1 ? '' : 's'} still processing` }
  if (!journey.steps?.length) return { tone: 'neutral', text: 'No journey events recorded for this lesson' }
  return { tone: 'info', text: 'Lesson in progress' }
}

/**
 * Round-trip time in ms. WebRTC reports it in seconds and the mobile app converts to ms, so stored
 * samples can be either; nothing under 10 can be a real millisecond RTT on a call, so it is
 * treated as seconds. (Confirm against a live lesson once both clients send the same unit.)
 */
export function normalizeRttMs(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null
  const n = Number(value)
  if (n <= 0) return null
  return Math.round(n < 10 ? n * 1000 : n)
}

/** Quality scores are 0-100. Same bands the backend uses for live snapshots. */
export function qualityBand(score) {
  if (score === null || score === undefined || !Number.isFinite(Number(score))) return { label: 'No data', tone: 'neutral' }
  const n = Number(score)
  if (n >= 75) return { label: 'Good', tone: 'success' }
  if (n >= 45) return { label: 'Fair', tone: 'warning' }
  return { label: 'Poor', tone: 'danger' }
}

/** Booking detail -> the rows shown in the drawer's Money tab. Missing sections yield no rows. */
export function moneyRows(detail) {
  if (!detail) return []
  const e = detail.escrow
  const rows = []
  const add = (label, minor, opts = {}) => {
    if (minor === null || minor === undefined) return
    rows.push({ label, value: formatMinor(minor), ...opts })
  }
  if (e) {
    add('Charged to trainee', e.charge_total_minor ?? e.gross_minor)
    add('Lesson price', e.session_subtotal_minor)
    add('Surge', e.surge_minor || null)
    add('Trainee platform fee', e.trainee_platform_fee_minor)
    add('Coach platform fee', e.trainer_platform_fee_minor)
    add('Processing fee', e.processing_fee_minor)
    add('Tax', e.tax_minor)
    add('Coach earns', e.trainer_net_minor, { strong: true })
    add('Platform keeps', e.platform_fee_minor, { strong: true })
  }
  return rows
}

export function escrowTone(status) {
  switch (status) {
    case 'released':
      return 'success'
    case 'held':
    case 'releasing':
      return 'info'
    case 'refunded':
      return 'neutral'
    case 'disputed':
      return 'danger'
    default:
      return 'neutral'
  }
}
