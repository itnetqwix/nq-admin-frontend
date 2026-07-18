import Link from 'next/link'
import { Button, Chip, Stack, Typography } from '@mui/material'
import { AdminLoadingState } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

import { SectionShell, EmptyHint, OpsSurfaceCard } from '../user360Shared'

export default function User360IssuesTab({ userId, opsItems = [], loadingOpsEvents = false }) {
  return (
    <SectionShell
      title='Issues & logs'
      subtitle='Ops events for this user: calls, instant lessons, wallet, support tickets, and errors.'
      action={
        <Button component={Link} href={`/apps/ops-logs?userId=${userId}`} variant='outlined' size='small'>
          View all logs
        </Button>
      }
    >
      {loadingOpsEvents ? <AdminLoadingState message='Loading issues…' minHeight={180} /> : null}
      {!loadingOpsEvents && opsItems.length ? (
        <Stack spacing={1.5}>
          {opsItems.slice(0, 30).map(row => (
            <OpsSurfaceCard key={row._id || row.event_id}>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Chip
                  size='small'
                  label={row.severity}
                  sx={{
                    fontFamily: ops.mono,
                    fontSize: 11,
                    bgcolor:
                      row.severity === 'error' || row.severity === 'critical' ? ops.errorSoft : ops.canvasSoft2,
                    color: row.severity === 'error' || row.severity === 'critical' ? ops.error : ops.body
                  }}
                />
                <Chip
                  size='small'
                  label={row.category}
                  sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
                  variant='outlined'
                />
                <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontWeight: 600, letterSpacing: '-0.28px' }}>{row.title}</Typography>
              {row.summary ? (
                <Typography sx={{ mt: 0.5, fontSize: 13, color: ops.body, lineHeight: 1.5 }}>{row.summary}</Typography>
              ) : null}
            </OpsSurfaceCard>
          ))}
        </Stack>
      ) : null}
      {!loadingOpsEvents && !opsItems.length ? (
        <EmptyHint
          title='No ops events'
          hint='Issues will appear here when logged from calls, wallet, or support.'
        />
      ) : null}
    </SectionShell>
  )
}
