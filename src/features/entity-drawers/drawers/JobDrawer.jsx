import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AdminSubTabs from 'src/components/admin/AdminSubTabs'
import EntityLink from 'src/components/admin/EntityLink'
import StatusPill from 'src/components/admin/StatusPill'
import { useAdminConfirm } from 'src/components/admin'
import { sentryIssuesUrl } from 'src/configs/observability'
import { useEntityDrawer } from 'src/features/entity-drawers/EntityDrawerContext'
import SentryIssueList from 'src/features/sentry/SentryIssueList'
import { searchSentry } from 'src/services/commandApi'
import { discardFailedJob, getFailedJob, retryFailedJob } from 'src/services/adminOpsApi'
import { queryKeys } from 'src/services/queryKeys'
import { fetchFailedJobsList } from 'src/store/slices/opsSlice'
import { useAppDispatch } from 'src/store/hooks'
import { ops } from 'src/styles/opsSurface'
import { timeAgo } from 'src/utils/format'
import { DrawerError, DrawerLoading, FactList, SectionTitle } from './shared'

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i
const fmt = ms => (ms ? new Date(ms).toLocaleString() : null)
const mono = { fontFamily: ops.mono, fontSize: 12 }

/** Drawer id is `<queue>:<jobId>`; queue names never contain ':' but job ids can. */
export const splitJobDrawerId = id => {
  const i = String(id || '').indexOf(':')
  return i < 1 ? { queue: '', jobId: '' } : { queue: id.slice(0, i), jobId: id.slice(i + 1) }
}

const CodeBlock = ({ children, maxHeight = 360 }) => (
  <Box
    component='pre'
    sx={{
      m: 0,
      p: 1.5,
      borderRadius: ops.radiusMd,
      bgcolor: ops.night,
      color: ops.onNight,
      fontFamily: ops.mono,
      fontSize: 12,
      lineHeight: 1.55,
      overflow: 'auto',
      maxHeight,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}
  >
    {children}
  </Box>
)

/** One stack frame, Sentry-style: function, then file:line. Frames outside our code are muted. */
const Frame = ({ frame, suspect }) => (
  <Box
    sx={{
      px: 1.25,
      py: 0.75,
      borderLeft: `3px solid ${suspect ? ops.error : frame.inApp ? ops.link : ops.hairline}`,
      bgcolor: suspect ? ops.dangerBg : frame.inApp ? ops.canvasSoft : 'transparent',
      opacity: frame.inApp ? 1 : 0.65
    }}
  >
    <Typography sx={{ ...mono, fontWeight: frame.inApp ? 600 : 400 }}>{frame.function}</Typography>
    <Typography sx={{ ...mono, color: ops.mute, wordBreak: 'break-all' }}>
      {frame.filename}
      {frame.lineno ? `:${frame.lineno}${frame.colno ? `:${frame.colno}` : ''}` : ''}
    </Typography>
  </Box>
)

function ErrorTab({ job }) {
  const [showAll, setShowAll] = useState(false)
  const [raw, setRaw] = useState(false)
  const frames = job.frames || []
  const appFrames = frames.filter(f => f.inApp)
  const shown = showAll || !appFrames.length ? frames : appFrames
  const crashSite = frames[frames.length - 1]

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <SectionTitle>Message</SectionTitle>
        <CodeBlock maxHeight={160}>{job.failedReason}</CodeBlock>
      </Box>
      {frames.length ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <SectionTitle>Stack trace (latest attempt, crash site last)</SectionTitle>
            {appFrames.length && appFrames.length !== frames.length ? (
              <Button size='small' onClick={() => setShowAll(v => !v)}>
                {showAll ? 'Only our code' : `Show all ${frames.length} frames`}
              </Button>
            ) : null}
          </Box>
          <Box
            sx={{
              display: 'grid',
              gap: 0.5,
              border: `1px solid ${ops.hairline}`,
              borderRadius: ops.radiusMd,
              overflow: 'hidden'
            }}
          >
            {shown.map((f, i) => (
              <Frame key={`${f.filename}:${f.lineno}:${i}`} frame={f} suspect={f === crashSite} />
            ))}
          </Box>
        </Box>
      ) : (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          No stack trace was kept for this job (it may have failed before BullMQ recorded one).
        </Typography>
      )}
      {job.stacktrace?.length ? (
        <Box>
          <Button size='small' onClick={() => setRaw(v => !v)}>
            {raw
              ? 'Hide raw stack'
              : `Raw stack (${job.stacktrace.length} attempt${job.stacktrace.length > 1 ? 's' : ''})`}
          </Button>
          {raw ? <CodeBlock>{job.stacktrace.join('\n\n--- next attempt ---\n\n')}</CodeBlock> : null}
        </Box>
      ) : null}
    </Box>
  )
}

function PayloadTab({ job }) {
  const text = useMemo(() => JSON.stringify(job.data ?? null, null, 2), [job.data])
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle>Job payload</SectionTitle>
        <Button size='small' onClick={() => navigator.clipboard?.writeText(text).then(() => toast.success('Copied'))}>
          Copy
        </Button>
      </Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Secrets (tokens, passwords, keys) are masked and large values are cut before this leaves the API.
      </Typography>
      <CodeBlock maxHeight={480}>{text}</CodeBlock>
    </Box>
  )
}

function TimelineTab({ job }) {
  return (
    <FactList
      rows={[
        { label: 'Created', value: fmt(job.timestamp) },
        { label: 'Last started', value: fmt(job.processedOn) },
        { label: 'Last failed', value: job.finishedOn ? `${fmt(job.finishedOn)} (${timeAgo(job.finishedOn)})` : null },
        { label: 'Attempts', value: `${job.attemptsMade}${job.maxAttempts ? ` of ${job.maxAttempts}` : ''}` },
        { label: 'Retry delay', value: job.opts?.delay ? `${job.opts.delay} ms` : null },
        {
          label: 'Backoff',
          value: job.opts?.backoff ? (
            <Box component='span' sx={mono}>
              {JSON.stringify(job.opts.backoff)}
            </Box>
          ) : null
        },
        {
          label: 'Job id',
          value: (
            <Box component='span' sx={mono}>
              {job.id}
            </Box>
          )
        },
        {
          label: 'Queue',
          value: (
            <Box component='span' sx={mono}>
              {job.queue}
            </Box>
          )
        }
      ]}
    />
  )
}

function SentryTab({ job }) {
  // Prefer the job tag (exact match for this job's issues); also show errors for the same lesson.
  const jobQuery = `job_id:${job.id}`
  const sessionId = job.correlation?.sessionId
  const byJob = useQuery({
    queryKey: queryKeys.sentrySearch(jobQuery),
    queryFn: () => searchSentry(jobQuery),
    retry: false
  })
  const sessionQuery = sessionId ? `session_id:${sessionId}` : null
  const bySession = useQuery({
    queryKey: queryKeys.sentrySearch(sessionQuery),
    queryFn: () => searchSentry(sessionQuery),
    enabled: !!sessionQuery,
    retry: false
  })
  const link = sentryIssuesUrl({ query: jobQuery })
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <SectionTitle>Sentry issues for this job</SectionTitle>
          {link ? (
            <Button size='small' component='a' href={link} target='_blank' rel='noreferrer'>
              Open in Sentry
            </Button>
          ) : null}
        </Box>
        <SentryIssueList
          issues={byJob.data?.items}
          loading={byJob.isLoading}
          error={byJob.error}
          emptyText='No Sentry issue is tagged with this job id (jobs that failed before this was deployed won’t be).'
          max={10}
        />
      </Box>
      {sessionQuery ? (
        <Box>
          <SectionTitle>Other errors in the same lesson</SectionTitle>
          <SentryIssueList
            issues={bySession.data?.items}
            loading={bySession.isLoading}
            error={bySession.error}
            emptyText='None.'
            max={10}
          />
        </Box>
      ) : null}
    </Box>
  )
}

/** Everything an engineer needs, as plain text to paste into a chat or ticket. */
export const buildDebugBundle = job =>
  [
    `Failed job ${job.queue} / ${job.name} (${job.id})`,
    `Error: ${job.errorType} — ${String(job.failedReason || '').split('\n')[0]}`,
    `Attempts: ${job.attemptsMade}${job.maxAttempts ? `/${job.maxAttempts}` : ''}`,
    `Created: ${fmt(job.timestamp) || '-'}  Failed: ${fmt(job.finishedOn) || '-'}`,
    job.correlation?.sessionId ? `Lesson: ${job.correlation.sessionId}` : null,
    job.correlation?.requestId ? `Request id: ${job.correlation.requestId}` : null,
    '',
    'Stack (latest attempt):',
    job.stacktrace?.length ? job.stacktrace[job.stacktrace.length - 1] : '(none)',
    '',
    'Payload (redacted):',
    JSON.stringify(job.data ?? null, null, 2)
  ]
    .filter(l => l !== null)
    .join('\n')

export default function JobDrawer({ id }) {
  const { queue, jobId } = splitJobDrawerId(id)
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()
  const { close } = useEntityDrawer()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [tab, setTab] = useState('error')
  const key = queryKeys.failedJob(queue, jobId)
  const q = useQuery({
    queryKey: key,
    queryFn: () => getFailedJob(queue, jobId),
    enabled: !!queue && !!jobId,
    retry: false
  })

  // The list lives in Redux; refresh it so the row reflects what just happened here.
  const refreshList = () => void dispatch(fetchFailedJobsList())

  const retry = useMutation({
    mutationFn: () => retryFailedJob(queue, jobId),
    onSuccess: () => {
      toast.success('Job re-queued')
      queryClient.invalidateQueries({ queryKey: key })
      refreshList()
    },
    onError: e =>
      toast.error(
        e?.message === 'job_not_failed' ? 'This job is no longer in the failed state.' : e?.message || 'Retry failed'
      )
  })
  const discard = useMutation({
    mutationFn: reason => discardFailedJob(queue, jobId, reason),
    onSuccess: () => {
      toast.success('Job discarded')
      refreshList()
      close()
    },
    onError: e => toast.error(e?.message || 'Discard failed')
  })

  if (!queue || !jobId) return <DrawerError error={{ message: 'Invalid job link.' }} />
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) {
    const gone = /job_not_found/.test(q.error?.message || '')
    return (
      <DrawerError
        error={{
          ...q.error,
          message: gone
            ? 'This job is no longer in the queue (retried, discarded, or trimmed by retention).'
            : q.error?.message
        }}
        onRetry={gone ? undefined : q.refetch}
      />
    )
  }
  const job = q.data
  if (!job) return <DrawerError error={{ message: 'Job not found.' }} />

  const { sessionId, userId, bookingId, requestId } = job.correlation || {}
  const onDiscard = async () => {
    const res = await confirm({
      title: 'Discard this failed job?',
      message: 'It is removed from the queue and will not run again. The Sentry issue and ops event stay.',
      confirmLabel: 'Discard',
      variant: 'danger',
      reasonRequired: true,
      reasonLabel: 'Why is it safe to discard?'
    })
    if (res?.confirmed) discard.mutate(res.reason)
  }
  const onRetry = async () => {
    const res = await confirm({
      title: 'Retry this job?',
      message: `It runs again now (attempt ${
        job.attemptsMade + 1
      }). Fix the root cause first or it will fail the same way.`,
      confirmLabel: 'Retry'
    })
    if (res?.confirmed) retry.mutate()
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box>
        <Typography sx={{ ...mono, fontSize: 13, color: ops.error, fontWeight: 600 }}>{job.errorType}</Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 0.5, wordBreak: 'break-word' }}>
          {String(job.failedReason || '').split('\n')[0] || 'Unknown failure'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
          <StatusPill tone='danger'>
            Failed · attempt {job.attemptsMade}
            {job.maxAttempts ? `/${job.maxAttempts}` : ''}
          </StatusPill>
          <StatusPill tone='neutral'>{job.queue}</StatusPill>
          <StatusPill tone='neutral'>{job.name}</StatusPill>
          {job.finishedOn ? <StatusPill tone='neutral'>{timeAgo(job.finishedOn)}</StatusPill> : null}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant='contained' size='small' disabled={retry.isPending} onClick={onRetry}>
          Retry
        </Button>
        <Button variant='outlined' color='error' size='small' disabled={discard.isPending} onClick={onDiscard}>
          Discard
        </Button>
        <Button
          variant='text'
          size='small'
          onClick={() =>
            navigator.clipboard?.writeText(buildDebugBundle(job)).then(() => toast.success('Debug info copied'))
          }
        >
          Copy debug info
        </Button>
      </Box>

      {sessionId || userId || bookingId || requestId ? (
        <FactList
          rows={[
            {
              label: 'Lesson',
              value:
                sessionId && OBJECT_ID_RE.test(sessionId) ? (
                  <EntityLink type='lesson' id={sessionId}>
                    Open lesson
                  </EntityLink>
                ) : (
                  sessionId
                )
            },
            {
              label: 'User',
              value:
                userId && OBJECT_ID_RE.test(userId) ? (
                  <EntityLink type='user' id={userId}>
                    Open user
                  </EntityLink>
                ) : (
                  userId
                )
            },
            { label: 'Booking', value: bookingId },
            {
              label: 'Request id',
              value: requestId ? (
                <Box component='span' sx={mono}>
                  {requestId}
                </Box>
              ) : null
            }
          ]}
        />
      ) : null}

      <Box>
        <AdminSubTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'error', label: 'Error' },
            { value: 'payload', label: 'Payload' },
            { value: 'timeline', label: 'Timeline' },
            { value: 'sentry', label: 'Sentry' }
          ]}
        />
        {tab === 'error' ? <ErrorTab job={job} /> : null}
        {tab === 'payload' ? <PayloadTab job={job} /> : null}
        {tab === 'timeline' ? <TimelineTab job={job} /> : null}
        {tab === 'sentry' ? <SentryTab job={job} /> : null}
      </Box>
      {ConfirmDialog}
    </Box>
  )
}
