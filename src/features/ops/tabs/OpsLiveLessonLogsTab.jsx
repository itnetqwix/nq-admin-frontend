import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Drawer,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import moment from 'moment'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  getLiveLessonLogSession,
  getLiveLessonLogs,
  getOpsEvents,
  getSentryEvent,
  getSentryIssueEvents,
  getSentryIssues,
  getSentryProjects
} from 'src/services/opsApi'
import { ops } from 'src/styles/opsSurface'

const formatSuspectFrame = event => {
  const frame = event?.suspectFrame
  if (frame?.filename || frame?.function) {
    const loc = [frame.filename, frame.line != null ? `:${frame.line}` : ''].filter(Boolean).join('')
    return [frame.function, loc].filter(Boolean).join(' @ ')
  }
  const tail = event?.frames?.slice(-5)
  if (tail?.length) return JSON.stringify(tail, null, 2)
  return 'No in-app stack frame (message-only event or native crash without symbolicated frames).'
}

const stateColor = state => {
  if (state === 'failed' || state === 'blocked') return { bgcolor: ops.errorSoft, color: ops.error }
  if (state === 'pending' || state === 'started') return { bgcolor: ops.softAmber, color: '#ab570a' }
  return { bgcolor: ops.canvasSoft2, color: ops.ink }
}

export default function OpsLiveLessonLogsTab() {
  const [rows, setRows] = useState([])
  const [issues, setIssues] = useState([])
  const [opsEvents, setOpsEvents] = useState([])
  const [projects, setProjects] = useState([])
  const [project, setProject] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logs, internal, projectRows] = await Promise.all([
        getLiveLessonLogs({ limit: 50, ...(sessionId.trim() ? { sessionId: sessionId.trim() } : {}) }),
        getOpsEvents({ limit: 50, ...(sessionId.trim() ? { sessionId: sessionId.trim() } : {}) }),
        projects.length ? Promise.resolve(projects) : getSentryProjects()
      ])
      const nextProjects = projectRows || []
      if (!projects.length) {
        setProjects(nextProjects)
      }
      setRows(logs?.items || [])
      setOpsEvents(internal?.items || [])
      const selectedProjects = project ? nextProjects.filter(item => item.slug === project) : nextProjects
      const sentryResults = await Promise.all(
        selectedProjects.map(item =>
          getSentryIssues({ project: item.slug, statsPeriod: '24h', query: 'is:unresolved' })
        )
      )
      setIssues(sentryResults.flatMap(result => result?.items || []))
    } catch (error) {
      toast.error(error?.message || 'Live lesson logs are unavailable')
      setRows([])
      setIssues([])
      setOpsEvents([])
    } finally {
      setLoading(false)
    }
  }, [project, projects, sessionId])

  useEffect(() => {
    void load()
  }, [load])

  const openSession = async row => {
    try {
      setSelected({ type: 'session', loading: true })
      const data = await getLiveLessonLogSession(row.sessionId)
      setSelected({ type: 'session', ...data })
    } catch (error) {
      toast.error(error?.message || 'Could not load lesson timeline')
      setSelected(null)
    }
  }

  const openIssue = async issue => {
    try {
      setSelected({ type: 'sentry', loading: true })
      const events = await getSentryIssueEvents(issue.id, { limit: 1 })
      const event = events?.items?.[0]
      const projectSlug = issue.project || event?.project
      const eventId = event?.id
      const detail = eventId && projectSlug ? await getSentryEvent(projectSlug, eventId) : event
      setSelected({ type: 'sentry', issue, event: detail })
    } catch (error) {
      toast.error(error?.message || 'Could not load Sentry root cause')
      setSelected(null)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
        <TextField
          size='small'
          label='Session id'
          value={sessionId}
          onChange={event => setSessionId(event.target.value)}
          sx={{ minWidth: 240 }}
        />
        <Select
          size='small'
          value={project}
          displayEmpty
          onChange={event => {
            setProject(event.target.value)
            setTimeout(() => void load(), 0)
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value=''>All Sentry projects</MenuItem>
          {projects.map(item => <MenuItem key={item.slug} value={item.slug}>{item.name || item.slug}</MenuItem>)}
        </Select>
        <Button variant='contained' size='small' onClick={() => void load()} disabled={loading} sx={{ textTransform: 'none' }}>
          Refresh logs
        </Button>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Box sx={{ border: `1px solid ${ops.hairline}`, borderRadius: ops.radiusSm, p: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Lesson workflow</Typography>
          <Typography sx={{ color: ops.mute, fontSize: 12, mb: 1.5 }}>
            A lesson remains open until post-lesson work and settlement finish.
          </Typography>
          <Stack spacing={1}>
            {rows.map(row => (
              <Button
                key={row.sessionId}
                onClick={() => void openSession(row)}
                sx={{ justifyContent: 'space-between', textTransform: 'none', color: ops.ink, border: `1px solid ${ops.hairline}`, px: 1.5 }}
              >
                <Stack alignItems='flex-start'>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }}>{row.sessionId}</Typography>
                  <Typography sx={{ color: ops.mute, fontSize: 11 }}>
                    {row.lastAt ? moment(row.lastAt).fromNow() : '—'}
                  </Typography>
                </Stack>
                <Stack direction='row' spacing={0.5}>
                  {row.ended ? <Chip size='small' label='ended' sx={{ height: 22 }} /> : null}
                  {row.pending ? <Chip size='small' label={`${row.pending} pending`} sx={{ height: 22, ...stateColor('pending') }} /> : null}
                  {row.blocked ? <Chip size='small' label={`${row.blocked} blocked`} sx={{ height: 22, ...stateColor('blocked') }} /> : null}
                  {!row.pending && !row.blocked ? <Chip size='small' label='complete' sx={{ height: 22, ...stateColor('succeeded') }} /> : null}
                </Stack>
              </Button>
            ))}
            {!rows.length ? <Typography sx={{ color: ops.mute, fontSize: 13 }}>No live lesson journey logs found.</Typography> : null}
          </Stack>
        </Box>

        <Box sx={{ border: `1px solid ${ops.hairline}`, borderRadius: ops.radiusSm, p: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Sentry crashes</Typography>
          <Typography sx={{ color: ops.mute, fontSize: 12, mb: 1.5 }}>
            Unresolved issues from {project || 'configured projects'} in the last 24 hours.
          </Typography>
          <Stack spacing={1}>
            {issues.map(issue => (
              <Button
                key={issue.id}
                onClick={() => void openIssue(issue)}
                sx={{ justifyContent: 'space-between', textTransform: 'none', color: ops.ink, border: `1px solid ${ops.hairline}`, textAlign: 'left' }}
              >
                <Stack sx={{ minWidth: 0 }}>
                  <Typography noWrap>{issue.title}</Typography>
                  <Typography sx={{ color: ops.mute, fontSize: 11 }}>{issue.project} · {issue.count} events · {moment(issue.lastSeen).fromNow()}</Typography>
                </Stack>
                <Chip size='small' label={issue.level} sx={{ height: 22, ...stateColor('failed') }} />
              </Button>
            ))}
            {!issues.length ? <Typography sx={{ color: ops.mute, fontSize: 13 }}>No unresolved Sentry issues found.</Typography> : null}
          </Stack>
        </Box>
      </Box>
      <Box sx={{ border: `1px solid ${ops.hairline}`, borderRadius: ops.radiusSm, p: 2 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Internal live-lesson incidents</Typography>
        <Stack spacing={0.75}>
          {opsEvents.slice(0, 12).map(event => (
            <Stack key={event._id || event.event_id} direction='row' spacing={1} alignItems='center'>
              <Chip size='small' label={event.severity || 'info'} sx={{ height: 21, ...stateColor(event.severity === 'error' || event.severity === 'critical' ? 'failed' : 'pending') }} />
              <Typography sx={{ fontSize: 12 }}>{event.title || event.event_type}</Typography>
              <Typography sx={{ ml: 'auto', color: ops.mute, fontSize: 11 }}>{event.createdAt ? moment(event.createdAt).fromNow() : '—'}</Typography>
            </Stack>
          ))}
          {!opsEvents.length ? <Typography sx={{ color: ops.mute, fontSize: 13 }}>No internal incidents found.</Typography> : null}
        </Stack>
      </Box>

      <Drawer anchor='right' open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, bgcolor: ops.night, color: ops.onNight } }}>
        {selected?.loading ? <Typography>Loading lesson timeline…</Typography> : null}
        {selected && !selected.loading ? (
          <Stack spacing={2}>
            <Typography sx={{ fontSize: 18, fontWeight: 600 }}>Live lesson log</Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted }}>{selected.journey?.sessionId}</Typography>
            {selected.type === 'session' && selected.journey?.ended && !selected.journey?.complete ? (
              <Chip label='Lesson ended — post-lesson workflow still pending' sx={{ ...stateColor('pending') }} />
            ) : null}
            {selected.type === 'session' ? <Stack spacing={1}>
              {(selected.journey?.steps || []).map(step => (
                <Box key={step.step} sx={{ border: `1px solid ${ops.nightLift}`, borderRadius: 1, p: 1.25 }}>
                  <Stack direction='row' justifyContent='space-between' gap={1}>
                    <Typography sx={{ color: ops.onNight }}>{step.title || step.step}</Typography>
                    <Chip size='small' label={step.state} sx={{ height: 22, ...stateColor(step.state) }} />
                  </Stack>
                  <Typography sx={{ color: ops.onNightMuted, fontSize: 11, fontFamily: ops.mono }}>{step.event_type}</Typography>
                  {step.detail ? <Typography sx={{ color: ops.onNightMuted, fontSize: 12 }}>{step.detail}</Typography> : null}
                </Box>
              ))}
            </Stack> : null}
            {selected.type === 'sentry' ? (
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 600 }}>{selected.issue?.title}</Typography>
                <Typography sx={{ color: ops.onNightMuted, fontSize: 13 }}>
                  {[selected.event?.exceptionType, selected.event?.exceptionValue].filter(Boolean).join(': ') ||
                    selected.issue?.title ||
                    'No exception details'}
                </Typography>
                <Typography sx={{ color: ops.lime, fontSize: 12, fontWeight: 600 }}>Suspect frame</Typography>
                <Box component='pre' sx={{ whiteSpace: 'pre-wrap', fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted, bgcolor: ops.nightLift, p: 1.5, borderRadius: 1 }}>
                  {formatSuspectFrame(selected.event)}
                </Box>
                {selected.event?.permalink ? <Button component='a' href={selected.event.permalink} target='_blank' rel='noreferrer' sx={{ color: ops.lime, textTransform: 'none' }}>Open in Sentry</Button> : null}
              </Stack>
            ) : null}
            {selected.type === 'session' ? <Button component={Link} href={`/apps/booking?bookingId=${selected.journey?.sessionId}`} sx={{ color: ops.lime, textTransform: 'none' }}>
              Open booking
            </Button> : null}
          </Stack>
        ) : null}
      </Drawer>
    </Stack>
  )
}
