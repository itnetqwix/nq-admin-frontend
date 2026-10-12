import { formatInt, formatPct } from 'src/utils/format'

export const CHANNELS = [
  { value: '', label: 'All channels' },
  { value: 'email', label: 'Email', icon: 'mdi:email-outline' },
  { value: 'sms', label: 'SMS', icon: 'mdi:message-text-outline' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'mdi:whatsapp' },
  { value: 'push', label: 'Push', icon: 'mdi:bell-outline' }
]
export const CHANNEL_VALUES = CHANNELS.map(c => c.value).filter(Boolean)
export const CHANNEL_LABEL = Object.fromEntries(CHANNELS.filter(c => c.value).map(c => [c.value, c.label]))
export const STATUS_FILTERS = [
  { value: '', label: 'Any result' },
  { value: 'sent', label: 'Handed to provider' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'problem', label: 'Any problem' },
  { value: 'failed', label: 'Failed' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'complained', label: 'Spam complaints' }
]
export const STATUS_VALUES = STATUS_FILTERS.map(s => s.value).filter(Boolean)

/** How each result reads in the table. "Sent" means the provider accepted it; only "Delivered" is confirmed. */
export const STATUS_META = {
  sent: { label: 'Sent', tone: 'neutral' },
  delivered: { label: 'Delivered', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  bounced: { label: 'Bounced', tone: 'danger' },
  complained: { label: 'Complaint', tone: 'danger' }
}
export const statusMeta = status => STATUS_META[status] || { label: String(status || 'Unknown'), tone: 'neutral' }
export const RANGES = [
  { value: 24, label: '24 hours' },
  { value: 168, label: '7 days' },
  { value: 720, label: '30 days' }
]

/** Failure rate -> how worried to be. Small samples are not alarming: one failure in two is noise. */
export function healthOf(channel) {
  if (!channel || channel.total === 0) return { tone: 'neutral', label: 'No sends' }
  if (channel.total < 10) return channel.failed > 0 ? { tone: 'warning', label: 'Some failed' } : { tone: 'success', label: 'Healthy' }
  const rate = channel.failureRate ?? 0
  if (rate >= 0.2) return { tone: 'danger', label: 'Failing' }
  if (rate >= 0.05) return { tone: 'warning', label: 'Degraded' }
  return { tone: 'success', label: 'Healthy' }
}

/** " (3 bounced, 1 complaint)" when part of the failures are bounces or complaints, else nothing. */
function problemBreakdown(channel) {
  const parts = []
  if (channel.bounced > 0) parts.push(`${formatInt(channel.bounced)} bounced`)
  if (channel.complained > 0) parts.push(`${formatInt(channel.complained)} ${channel.complained === 1 ? 'complaint' : 'complaints'}`)
  return parts.length ? ` (${parts.join(', ')})` : ''
}

export function channelTile(channel) {
  const h = healthOf(channel)
  return {
    key: channel.channel,
    label: CHANNEL_LABEL[channel.channel] || channel.channel,
    value: formatInt(channel.sent),
    hint: channel.total === 0 ? 'nothing sent' : `${formatInt(channel.failed)} failed${problemBreakdown(channel)} · ${formatPct(channel.failureRate, 1)} failure rate`,
    health: h
  }
}

export function recipientLabel(row) {
  const extra = (row.recipient_count || 1) - 1
  return extra > 0 ? `${row.recipient_masked} +${extra} more` : row.recipient_masked || '—'
}
