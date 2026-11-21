/** Pure view helpers for the lesson drawer's Recording tab (no React, easy to test). */

const LEVEL_TONE = { error: 'danger', warn: 'warning', info: 'neutral' }
export const levelTone = level => LEVEL_TONE[level] || 'neutral'

/** The API says "error"; StatusPill says "danger". */
export const diagnosisTone = tone => (tone === 'error' ? 'danger' : tone || 'neutral')

const STATUS_TONE = { ready: 'success', failed: 'danger', uploading: 'warning', processing: 'info' }
export const takeStatusTone = status => STATUS_TONE[status] || 'neutral'

export const PHASE_LABEL = {
  consent: 'Consent',
  capture: 'Capture',
  upload: 'Upload',
  finalize: 'Finalize',
  transcode: 'Processing',
  merge: 'Merge',
  ready: 'Saved',
  egress: 'Server recording',
  access: 'Access'
}

export function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * One group per take (oldest first), then a leading "Before a take existed" group for
 * consent / permission / start-up events that have no take yet. Events whose take was
 * discarded (retry, abandoned shell) land in their own "Removed take" group so nothing is hidden.
 */
export function groupRecordingEvents(events = [], takes = []) {
  const byTake = new Map()
  const pre = []
  for (const e of events) {
    if (!e.take_id) pre.push(e)
    else {
      if (!byTake.has(e.take_id)) byTake.set(e.take_id, [])
      byTake.get(e.take_id).push(e)
    }
  }
  const groups = []
  if (pre.length) groups.push({ key: 'pre', title: 'Before recording started', take: null, events: pre })
  takes.forEach((take, i) => {
    groups.push({ key: take.id, title: `Take ${i + 1}`, take, events: byTake.get(take.id) || [] })
    byTake.delete(take.id)
  })
  for (const [id, evs] of byTake) groups.push({ key: id, title: 'Removed take (retry or discarded)', take: null, events: evs })
  return groups
}

export const countProblems = (events = []) => ({
  errors: events.filter(e => e.level === 'error').length,
  warnings: events.filter(e => e.level === 'warn').length
})

/** Plain-text transcript for pasting into a support ticket / chat. */
export function recordingLogText(data) {
  if (!data) return ''
  const lines = [`Lesson ${data.sessionId}`, `Diagnosis: ${data.diagnosis?.headline || '—'}${data.diagnosis?.detail ? ` — ${data.diagnosis.detail}` : ''}`, '']
  for (const e of data.events || []) {
    const detail = e.detail ? ` ${JSON.stringify(e.detail)}` : ''
    lines.push(
      `${new Date(e.at).toISOString()} [${(e.level || 'info').toUpperCase()}] ${PHASE_LABEL[e.phase] || e.phase}/${e.code} (${e.source}${e.platform ? `, ${e.platform}` : ''}${e.owner?.name ? `, ${e.owner.name}` : ''}): ${e.message}${detail}`
    )
  }
  return lines.join('\n')
}
