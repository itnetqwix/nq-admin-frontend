import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import StatusPill from 'src/components/admin/StatusPill'
import { ops } from 'src/styles/opsSurface'
import { getLessonRecordingLog } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { formatDuration } from 'src/utils/format'
import { countProblems, diagnosisTone, formatBytes, groupRecordingEvents, levelTone, PHASE_LABEL, recordingLogText, takeStatusTone } from '../recordingView'
import { DrawerError, DrawerLoading, FactList, SectionTitle } from './shared'

const fmtClock = v => (v ? new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '')
const fmtDateTime = v => (v ? new Date(v).toLocaleString() : null)

function Linkish({ onClick, children }) {
  return (
    <Box component='button' type='button' onClick={onClick} sx={{ border: 0, bgcolor: 'transparent', p: 0, color: ops.link, cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
      {children}
    </Box>
  )
}

function EventRow({ e }) {
  const [open, setOpen] = useState(false)
  return (
    <li>
      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, pt: 0.4, minWidth: 66 }}>{fmtClock(e.at)}</Typography>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusPill tone={levelTone(e.level)} size='sm'>{PHASE_LABEL[e.phase] || e.phase}</StatusPill>
            <Typography sx={{ fontSize: 13, fontWeight: e.level === 'info' ? 400 : 600 }}>{e.message}</Typography>
          </Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
            {[e.code, e.source, e.platform, e.role !== 'system' ? e.owner?.name || e.role : null].filter(Boolean).join(' · ')}
            {e.detail ? (
              <>
                {' · '}
                <Linkish onClick={() => setOpen(v => !v)}>{open ? 'hide details' : 'details'}</Linkish>
              </>
            ) : null}
          </Typography>
          {open ? (
            <Box component='pre' sx={{ m: 0, mt: 0.5, p: 1, borderRadius: ops.radiusSm, bgcolor: ops.neutralBg, fontFamily: ops.mono, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(e.detail, null, 2)}
            </Box>
          ) : null}
        </Box>
      </Box>
    </li>
  )
}

function TakeSummary({ take }) {
  if (!take) return null
  const res = take.width && take.height ? `${take.width}×${take.height}` : null
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
        <StatusPill tone={takeStatusTone(take.status)}>{take.status}</StatusPill>
        {take.is_merged ? <StatusPill tone='violet'>Merged lesson</StatusPill> : null}
        {take.has_audio === false ? <StatusPill tone='warning'>No audio</StatusPill> : null}
      </Box>
      {take.explanation ? (
        <Typography sx={{ fontSize: 13, mb: 1, color: take.status === 'failed' ? ops.dangerFg : ops.warningFg }}>{take.explanation}</Typography>
      ) : null}
      <FactList
        rows={[
          { label: 'Recorded by', value: take.owner?.name },
          { label: 'Capture', value: [take.capture_mode, take.display_surface, take.device_class].filter(v => v && v !== 'unknown').join(' · ') },
          { label: 'Length', value: take.duration_seconds ? formatDuration(take.duration_seconds) : null },
          { label: 'Size', value: formatBytes(take.bytes) },
          { label: 'Video', value: [res, take.fps ? `${take.fps} fps` : null].filter(Boolean).join(' @ ') },
          { label: 'Qualities', value: take.renditions?.length ? take.renditions.join(', ') : null },
          { label: 'Started', value: fmtDateTime(take.created_at) },
          { label: 'Saved', value: fmtDateTime(take.ready_at) }
        ]}
      />
    </Box>
  )
}

export default function RecordingPane({ id }) {
  const q = useQuery({ queryKey: queryKeys.lesson.recording(id), queryFn: () => getLessonRecordingLog(id) })
  const [problemsOnly, setProblemsOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const data = q.data
  const groups = useMemo(() => groupRecordingEvents(data?.events, data?.takes), [data])
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  if (!data) return null

  const { errors, warnings } = countProblems(data.events)
  const dx = data.diagnosis || {}
  const b = data.booking || {}
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recordingLogText(data))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ p: 1.5, borderRadius: ops.radiusMd, border: `1px solid ${ops.neutralBorder}` }}>
        <StatusPill tone={diagnosisTone(dx.tone)}>{dx.headline || 'No recording data'}</StatusPill>
        {dx.detail ? <Typography sx={{ fontSize: 13, mt: 1 }}>{dx.detail}</Typography> : null}
      </Box>

      <FactList
        rows={[
          { label: 'Recording requested', value: b.recording_requested ? 'Yes' : 'No' },
          { label: 'Lesson recording status', value: b.recording_status },
          { label: 'Trainee consent', value: fmtDateTime(b.consent_trainee_at) || (b.recording_requested ? 'Not given' : null) },
          { label: 'Coach consent', value: fmtDateTime(b.consent_trainer_at) || (b.recording_requested ? 'Not given' : null) },
          { label: 'Recorded via', value: b.media_engine === 'livekit' ? 'Server (LiveKit)' : b.media_engine ? 'On-device' : null },
          { label: 'Failure on booking', value: b.recording_failed_reason }
        ]}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12, color: ops.mute }}>
          {data.events.length} event{data.events.length === 1 ? '' : 's'} · {errors} error{errors === 1 ? '' : 's'} · {warnings} warning{warnings === 1 ? '' : 's'}
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5 }}>
          <Linkish onClick={() => setProblemsOnly(v => !v)}>{problemsOnly ? 'Show everything' : 'Errors & warnings only'}</Linkish>
          <Linkish onClick={copy}>{copied ? 'Copied' : 'Copy log'}</Linkish>
        </Box>
      </Box>

      {!groups.length ? (
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
          Nothing was logged for this lesson. Recording events are kept for 90 days, and lessons from before this logging shipped won’t have any.
        </Typography>
      ) : null}

      {groups.map(g => {
        const evs = problemsOnly ? g.events.filter(e => e.level !== 'info') : g.events
        return (
          <Box key={g.key}>
            <SectionTitle>{g.title}</SectionTitle>
            <TakeSummary take={g.take} />
            {evs.length ? (
              <Box component='ol' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1.25 }}>
                {evs.map(e => <EventRow key={e.id} e={e} />)}
              </Box>
            ) : (
              <Typography sx={{ fontSize: 12, color: ops.mute }}>
                {problemsOnly ? 'No errors or warnings.' : 'No events were logged for this take (it predates event logging, or the app never reported).'}
              </Typography>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
