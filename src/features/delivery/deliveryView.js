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
  { value: 'sent', label: 'Delivered to provider' },
  { value: 'failed', label: 'Failed' }
]
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

export function channelTile(channel) {
  const h = healthOf(channel)
  return {
    key: channel.channel,
    label: CHANNEL_LABEL[channel.channel] || channel.channel,
    value: formatInt(channel.sent),
    hint: channel.total === 0 ? 'nothing sent' : `${formatInt(channel.failed)} failed · ${formatPct(channel.failureRate, 1)} failure rate`,
    health: h
  }
}

export function recipientLabel(row) {
  const extra = (row.recipient_count || 1) - 1
  return extra > 0 ? `${row.recipient_masked} +${extra} more` : row.recipient_masked || '—'
}
