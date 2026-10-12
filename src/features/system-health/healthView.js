import { formatDuration, timeAgo } from 'src/utils/format'

/** Same threshold the backend uses for "backing up, not just busy". */
export const QUEUE_BACKLOG_WARN = 500

export function queueView(q) {
  if (q.failed > 0) return { tone: 'danger', label: `${q.failed} failed` }
  if (q.waiting >= QUEUE_BACKLOG_WARN) return { tone: 'warning', label: 'Backed up' }
  if (q.paused > 0) return { tone: 'warning', label: 'Paused' }
  if (q.active > 0 || q.waiting > 0) return { tone: 'info', label: 'Working' }
  return { tone: 'success', label: 'Idle' }
}

/** nq-clip-transcode -> clip transcode */
export function queueLabel(name) {
  return String(name || '')
    .replace(/^nq-/, '')
    .replace(/-/g, ' ')
}

export function cronView(c, now = Date.now()) {
  if (c.lastStatus === 'error') return { tone: 'danger', label: 'Failed', note: c.lastError || 'Last run threw an error' }
  if (c.stale) return { tone: 'danger', label: 'Overdue', note: `Expected about every ${formatDuration(c.expectedIntervalSec)}` }
  if (c.lastStatus === 'never') return { tone: 'neutral', label: 'No run yet', note: 'Not seen since the scheduler last started' }
  return { tone: 'success', label: 'On time', note: c.lastRunAt ? `Ran ${timeAgo(c.lastRunAt, now)}` : null }
}

/** A process that has missed 2+ heartbeats (they are sent every 15s) is suspect. */
export function workerView(w) {
  if (w.ageSec > 40) return { tone: 'warning', label: 'Stale' }
  return { tone: 'success', label: 'Alive' }
}

export function webhookView(w) {
  if (!w) return { tone: 'neutral', label: 'Unknown' }
  if (w.lagSec != null && w.lagSec > 300) return { tone: 'danger', label: 'Stuck' }
  if (w.failed24h > 0) return { tone: 'warning', label: `${w.failed24h} failed` }
  return { tone: 'success', label: 'Flowing' }
}

export const OVERALL = {
  ok: { tone: 'success', title: 'All systems normal' },
  degraded: { tone: 'warning', title: 'Something needs a look' },
  down: { tone: 'danger', title: 'A core system is down' },
  unknown: { tone: 'neutral', title: 'Status unknown' }
}
