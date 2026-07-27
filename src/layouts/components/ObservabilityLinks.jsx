import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import {
  hasObservabilityLinks,
  logRocketSessionsUrl,
  sentryIssuesUrl,
  sentryUserSearchUrl
} from 'src/configs/observability'

/** Compact Sentry / LogRocket deep links for ops triage. */
export default function ObservabilityLinks({ userId, sessionId, dense }) {
  if (!hasObservabilityLinks()) return null

  const sentryUser = userId ? sentryUserSearchUrl(userId) : null
  const sentrySession = sessionId
    ? sentryIssuesUrl({ query: `sessionId:${sessionId}` })
    : sentryIssuesUrl()
  const lr = logRocketSessionsUrl({ userId })

  return (
    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ my: dense ? 0 : 1 }}>
      {sentryUser ? (
        <Button size='small' variant='outlined' href={sentryUser} target='_blank' rel='noopener noreferrer'>
          Sentry user
        </Button>
      ) : null}
      {sentrySession ? (
        <Button size='small' variant='outlined' href={sentrySession} target='_blank' rel='noopener noreferrer'>
          Sentry{sessionId ? ' session' : ''}
        </Button>
      ) : null}
      {lr ? (
        <Button size='small' variant='outlined' href={lr} target='_blank' rel='noopener noreferrer'>
          LogRocket
        </Button>
      ) : null}
    </Stack>
  )
}
