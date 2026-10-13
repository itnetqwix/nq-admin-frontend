/** Pure helpers for the Trace tab. */
export const SOURCE_LABEL = { api: 'API', ops: 'Ops event', sentry: 'Sentry' }
export const SEVERITY_TONE = { error: 'danger', warning: 'warning', info: 'neutral' }

/** Items for the selected source tab ('all' keeps everything), order preserved. */
export function filterTrace(items, source) {
  const list = Array.isArray(items) ? items : []
  return source && source !== 'all' ? list.filter(i => i.source === source) : list
}
