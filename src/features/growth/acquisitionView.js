const SOURCE_LABEL = { direct: 'Direct visit', mobile_app: 'Mobile app', referral: 'Referred by a member', untracked: 'Not tracked (joined before source tracking)' }
const cap = s => String(s || '').replace(/^./, c => c.toUpperCase())

/** Report rows with plain labels: "Google · organic", "Referred by a member", "Not tracked". */
export function acquisitionRows(data) {
  return (data?.sources || []).map(s => {
    const base = SOURCE_LABEL[s.source] || cap(s.source)
    const showMedium = s.medium && !SOURCE_LABEL[s.source] && s.medium !== 'none'
    return {
      key: `${s.source}|${s.medium || ''}`,
      label: showMedium ? `${base} · ${s.medium}` : s.source === 'mobile_app' && s.medium ? `${base} (${s.medium === 'ios' ? 'iPhone' : s.medium === 'android' ? 'Android' : s.medium})` : base,
      tracked: s.source !== 'untracked',
      signups: s.signups,
      booked: s.booked,
      bookedShare: s.bookedShare
    }
  })
}

/** What the figures can and cannot say. */
export function acquisitionNote(data) {
  if (!data || !data.total) return null
  const parts = []
  if (data.tracked < data.total) parts.push(`${data.total - data.tracked} of ${data.total} signups have no recorded source.`)
  parts.push('“Booked a lesson” counts any lesson booked since joining, so newer sources look lower; compare sources of similar age.')
  if (data.truncated) parts.push('Showing the most recent 50,000 signups only.')
  return parts.join(' ')
}
