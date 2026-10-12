import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'
import StatusPill from 'src/components/admin/StatusPill'
import { describeIssue } from './describeIssue'

const TONE_COLOR = { danger: ops.error, warning: ops.warningFg, neutral: ops.mute }

/** Friendly text for the two ways Sentry data can be unavailable, instead of a raw error. */
function unavailableMessage(error) {
  const msg = String(error?.message || error || '')
  if (/not configured/i.test(msg)) return 'Sentry isn’t connected to the admin yet. Set SENTRY_API_TOKEN, SENTRY_ORG and SENTRY_ADMIN_PROJECTS on the API.'
  if (error?.status === 403) return 'Your admin role can’t view error reports.'
  return msg || 'Could not load error reports.'
}

/** Errors as sentences an admin can triage: what broke, who it hit, what it touches. */
export default function SentryIssueList({ issues, loading, error, max = 6, emptyText = 'No unresolved errors. 🎉' }) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} variant='rounded' height={52} />
        ))}
      </Box>
    )
  }
  if (error) return <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{unavailableMessage(error)}</Typography>
  if (!issues?.length) return <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{emptyText}</Typography>

  return (
    <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
      {issues.slice(0, max).map(issue => {
        const d = describeIssue(issue)
        const row = (
          <Box
            sx={{
              display: 'flex',
              gap: 1.25,
              p: 1.25,
              borderRadius: ops.radiusMd,
              border: `1px solid ${ops.hairline}`,
              borderLeft: `3px solid ${TONE_COLOR[d.tone]}`,
              bgcolor: ops.canvas,
              '&:hover': d.permalink ? { bgcolor: ops.canvasSoft } : undefined
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', lineHeight: 1.35 }} noWrap title={d.headline}>
                {d.headline}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{d.detail}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, flexShrink: 0 }}>
              {d.state ? <StatusPill tone={d.state === 'Regressed' ? 'danger' : 'info'} size='sm'>{d.state}</StatusPill> : null}
              <StatusPill tone='neutral' size='sm'>{d.impactLabel}</StatusPill>
            </Box>
          </Box>
        )
        return (
          <li key={issue.id}>
            {d.permalink ? (
              <Link href={d.permalink} target='_blank' rel='noopener noreferrer' underline='none' sx={{ display: 'block', color: 'inherit' }}>
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        )
      })}
    </Box>
  )
}
