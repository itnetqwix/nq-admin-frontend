import { useState } from 'react'
import NextLink from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AdminTabs from 'src/components/admin/AdminTabs'
import EntityLink from 'src/components/admin/EntityLink'
import StatusPill from 'src/components/admin/StatusPill'
import { ops } from 'src/styles/opsSurface'
import SentryIssueList from 'src/features/sentry/SentryIssueList'
import { getBookingDetail, getCallQualitySummary, getLessonJourney, getSessionOpsEvents, searchSentry } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { formatDuration, timeAgo } from 'src/utils/format'
import { escrowTone, journeyChecklist, journeyHeadline, moneyRows, normalizeRttMs, qualityBand } from '../lessonView'
import { DrawerError, DrawerLoading, FactList, SectionTitle } from './shared'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'journey', label: 'Journey' },
  { value: 'quality', label: 'Call quality' },
  { value: 'errors', label: 'Errors' },
  { value: 'money', label: 'Money' }
]

const fmtTime = v => (v ? new Date(v).toLocaleString() : null)
const personOf = p => (p ? { id: p._id || p.id, name: p.fullname || p.name || p.email || 'Unknown' } : null)

function Person({ label, person }) {
  const p = personOf(person)
  return { label, value: p ? <EntityLink type='user' id={String(p.id)}>{p.name}</EntityLink> : '—' }
}

function Overview({ id }) {
  const q = useQuery({ queryKey: queryKeys.lesson.booking(id), queryFn: () => getBookingDetail(id) })
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const d = q.data || {}
  const s = d.session || {}
  const durationSec = s.both_joined_at && s.actual_end_at ? (new Date(s.actual_end_at) - new Date(s.both_joined_at)) / 1000 : null
  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        <StatusPill tone={s.actual_end_at ? 'neutral' : s.both_joined_at ? 'live' : 'info'} pulse={Boolean(s.both_joined_at && !s.actual_end_at)}>
          {s.actual_end_at ? 'Ended' : s.both_joined_at ? 'Live' : s.status || 'Scheduled'}
        </StatusPill>
        {s.is_instant ? <StatusPill tone='violet'>Instant</StatusPill> : null}
        {s.refund_status ? <StatusPill tone='warning'>Refund: {s.refund_status}</StatusPill> : null}
      </Box>
      <FactList
        rows={[
          Person({ label: 'Coach', person: d.trainer }),
          Person({ label: 'Trainee', person: d.trainee }),
          { label: 'Booked for', value: fmtTime(s.start_time) },
          { label: 'Both joined', value: fmtTime(s.both_joined_at) },
          { label: 'Ended', value: fmtTime(s.actual_end_at) },
          { label: 'Talk time', value: durationSec ? formatDuration(durationSec) : null },
          { label: 'Extended by', value: s.total_extended_minutes ? `${s.total_extended_minutes} min` : null },
          { label: 'Refund reason', value: s.refund_reason_label }
        ]}
      />
      {d.ops_events?.length ? (
        <Box>
          <SectionTitle>Incidents on this lesson</SectionTitle>
          <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
            {d.ops_events.slice(0, 6).map(e => (
              <li key={e._id}>
                <Typography sx={{ fontSize: 13 }}>
                  {e.title} <Box component='span' sx={{ color: ops.mute, fontSize: 12 }}>· {timeAgo(e.createdAt)}</Box>
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      ) : null}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box component={NextLink} href={`/apps/live-lessons/history?sessionId=${id}`} sx={{ fontSize: 13, color: ops.link }}>
          Full debug view →
        </Box>
        <Box component={NextLink} href={`/apps/booking?sessionId=${id}`} sx={{ fontSize: 13, color: ops.link }}>
          Open booking →
        </Box>
      </Box>
    </Box>
  )
}

function Journey({ id }) {
  const q = useQuery({ queryKey: queryKeys.lesson.journey(id), queryFn: () => getLessonJourney(id) })
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const journey = q.data?.journey
  const head = journeyHeadline(journey)
  const list = journeyChecklist(journey)
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {head ? <StatusPill tone={head.tone}>{head.text}</StatusPill> : null}
      <Box component='ol' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1 }}>
        {list.map(step => (
          <li key={step.step}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box sx={{ pt: 0.25 }}>
                <StatusPill tone={step.tone} size='sm' sx={{ minWidth: 78, justifyContent: 'center' }}>
                  {step.state === 'none' ? 'Not yet' : step.state.replace('_', ' ')}
                </StatusPill>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{step.label}</Typography>
                {step.title || step.detail ? (
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{[step.title, step.detail].filter(Boolean).join(' — ')}</Typography>
                ) : null}
                {step.at ? <Typography sx={{ fontSize: 11, color: ops.mute }}>{timeAgo(step.at)}</Typography> : null}
              </Box>
            </Box>
          </li>
        ))}
      </Box>
    </Box>
  )
}

function Quality({ id }) {
  const q = useQuery({ queryKey: queryKeys.lesson.quality(id), queryFn: () => getCallQualitySummary(id) })
  const ev = useQuery({ queryKey: queryKeys.lesson.events(id), queryFn: () => getSessionOpsEvents(id) })
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const sum = q.data?.summary
  const events = (Array.isArray(ev.data) ? ev.data : ev.data?.items || []).filter(e => /^CALL_|^CLIENT_|^PARTICIPANT_|^CONNECTION/.test(e.event_type || ''))
  if (!sum) return <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>No call quality samples were recorded for this lesson.</Typography>
  const band = qualityBand(sum.averageOverallScore)
  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 40, fontWeight: 600, lineHeight: 1 }}>{Math.round(sum.averageOverallScore)}</Typography>
        <Box>
          <StatusPill tone={band.tone}>{band.label}</StatusPill>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>average overall score across {sum.totalSamples} samples</Typography>
        </Box>
      </Box>
      <FactList
        rows={[
          { label: 'Audio score', value: Math.round(sum.averageAudioScore) },
          { label: 'Video score', value: Math.round(sum.averageVideoScore) },
          { label: 'Round-trip time', value: normalizeRttMs(sum.averageRtt) ? `${normalizeRttMs(sum.averageRtt)} ms` : null },
          { label: 'Went through relay', value: `${sum.relayUsagePercentage}% of samples` }
        ]}
      />
      {events.length ? (
        <Box>
          <SectionTitle>Call events</SectionTitle>
          <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
            {events.slice(0, 10).map(e => (
              <li key={e._id}>
                <Typography sx={{ fontSize: 13 }}>
                  {e.title} <Box component='span' sx={{ color: ops.mute, fontSize: 12 }}>· {timeAgo(e.createdAt)}</Box>
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

function Errors({ id }) {
  const q = useQuery({
    queryKey: queryKeys.lesson.errors(id),
    queryFn: () => searchSentry(`session_id:${id}`),
    retry: false
  })
  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Errors reported with this lesson’s id. Only events from builds that tag the lesson can be matched.
      </Typography>
      <SentryIssueList issues={q.data?.items} loading={q.isLoading} error={q.error} emptyText='No errors were reported for this lesson.' max={20} />
      {q.data?.errors?.length ? (
        <Typography sx={{ fontSize: 12, color: ops.warningFg }}>
          Couldn’t search: {q.data.errors.map(e => e.project).join(', ')}
        </Typography>
      ) : null}
    </Box>
  )
}

function Money({ id }) {
  const q = useQuery({ queryKey: queryKeys.lesson.booking(id), queryFn: () => getBookingDetail(id) })
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const d = q.data || {}
  const rows = moneyRows(d)
  const e = d.escrow
  if (!e && !rows.length) return <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>No payment is attached to this lesson.</Typography>
  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {e ? <StatusPill tone={escrowTone(e.status)}>Escrow: {e.status}</StatusPill> : null}
        {d.refund?.status ? <StatusPill tone='warning'>Refund: {d.refund.status}</StatusPill> : null}
        {d.payment?.method_label ? <StatusPill tone='neutral'>{d.payment.method_label}</StatusPill> : null}
      </Box>
      <FactList rows={rows} />
      {e?.release_blockers?.length ? (
        <Box sx={{ p: 1.5, borderRadius: ops.radiusMd, bgcolor: ops.warningBg, border: `1px solid ${ops.warningBorder}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: ops.warningFg }}>Not released yet</Typography>
          {e.release_blockers.map(b => (
            <Typography key={b} sx={{ fontSize: 12, color: ops.warningFg }}>• {b}</Typography>
          ))}
        </Box>
      ) : null}
      {e?.release_eligible_at ? <FactList rows={[{ label: 'Release eligible', value: fmtTime(e.release_eligible_at) }, { label: 'Released', value: fmtTime(e.released_at) }]} /> : null}
      <Box component={NextLink} href={`/apps/finance?sessionId=${id}`} sx={{ fontSize: 13, color: ops.link }}>
        Open in Finance (release, refund, ledger) →
      </Box>
      <Typography sx={{ fontSize: 11, color: ops.mute }}>Amounts in {String(d.amounts?.currency || 'USD').toUpperCase()}.</Typography>
    </Box>
  )
}

const PANES = { overview: Overview, journey: Journey, quality: Quality, errors: Errors, money: Money }

export default function LessonDrawer({ id, initialTab = 'overview' }) {
  const [tab, setTab] = useState(initialTab)
  const Pane = PANES[tab]
  return (
    <Box>
      <AdminTabs value={tab} onChange={setTab} tabs={TABS} sx={{ mb: 2.5 }} />
      <Pane id={id} />
    </Box>
  )
}
