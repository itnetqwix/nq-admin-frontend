export function stripHtml(html) {
  if (typeof document === 'undefined') return String(html || '').replace(/<[^>]+>/g, '')
  const tmp = document.createElement('div')
  tmp.innerHTML = html || ''
  return tmp.textContent || tmp.innerText || ''
}

export function smsSegmentInfo(text) {
  const len = String(text || '').length
  const singleLimit = 160
  const segments = len === 0 ? 0 : Math.ceil(len / singleLimit)
  return { length: len, segments, singleLimit }
}

export function deliverySuccessRate(stats, channels = []) {
  if (!stats || !channels.length) return null
  let sent = 0
  let failed = 0
  channels.forEach(ch => {
    const s = stats[ch]
    if (s) {
      sent += Number(s.sent) || 0
      failed += Number(s.failed) || 0
    }
  })
  const total = sent + failed
  if (total === 0) return null
  return Math.round((sent / total) * 100)
}

export function exportDeliveryLogCsv(broadcast, logs) {
  const rows = [['User', 'Email', 'Channel', 'Status', 'Error', 'Sent at']]
  ;(logs || []).forEach(log => {
    const u = log.user_id
    rows.push([
      u?.fullname || '',
      u?.email || '',
      log.channel || '',
      log.status || '',
      (log.error || '').replace(/"/g, '""'),
      log.sent_at ? new Date(log.sent_at).toISOString() : ''
    ])
  })
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `broadcast-${broadcast?._id || 'export'}-delivery-log.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
